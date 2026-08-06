//src/components/CutGuide.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CuttingLayout, CutStep, Unit } from '../algorithm/packing';
import { SheetCanvas } from './SheetCanvas';
import { colors, spacing, radius } from '../theme/theme';
import { formatMmUnit, formatSize } from '../utils/unitConversion';

export function describeStep(step: CutStep, unit: Unit): string {
  const isH = step.orientation === 'horizontal';
  const offset = isH ? step.position - step.panel.y : step.position - step.panel.x;
  const edge = isH ? 'borde de arriba' : 'borde izquierdo';
  const direction = isH ? 'a lo ancho (de lado a lado)' : 'a lo largo (de arriba a abajo)';
  return `Cortá ${direction} a ${formatMmUnit(offset, unit)} del ${edge} del panel resaltado. El corte mide ${formatMmUnit(
    step.length,
    unit
  )}.`;
}

export interface CutGuideModalProps {
  visible: boolean;
  layout: CuttingLayout | null;
  onClose: () => void;
}

export const CutGuideModal: React.FC<CutGuideModalProps> = ({ visible, layout, onClose }) => {
  const { width, height } = useWindowDimensions();
  const [step, setStep] = useState(1);

  const total = layout ? layout.cutSteps.length : 0;
  const unit: Unit = layout?.unit || 'mm';
  const current = layout && total > 0 ? layout.cutSteps[Math.min(step, total) - 1] : null;

  const freedNow = useMemo(() => {
    if (!layout || !current) return [];
    return current.frees.map((i) => layout.placedCuts[i]).filter(Boolean);
  }, [layout, current]);

  React.useEffect(() => {
    if (visible) setStep(1);
  }, [visible, layout?.materialId]);

  if (!layout) return null;

  const canvasWidth = width - spacing.lg * 2;
  const canvasHeight = height * 0.46;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>
              Guía de corte
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {layout.materialLabel} · {formatSize(layout.width, layout.height, unit)}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
            <Ionicons name="close" size={22} color={colors.textOnDark} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.canvasWrap}>
            <SheetCanvas
              layout={layout}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              stepIndex={total > 0 ? step : null}
            />
          </View>

          <View style={styles.legendRow}>
            <LegendChip color={colors.stepActive} text="Corte de este paso" />
            <LegendChip color={colors.stepDone} text="Ya cortado" />
            <LegendChip color={colors.stepPanelStroke} text="Panel a cortar" />
          </View>

          {total === 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardText}>
                Esta placa no necesita cortes: la pieza ya entra tal cual.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.card}>
                <View style={styles.stepTitleRow}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>{step}</Text>
                  </View>
                  <Text style={styles.stepTitle}>
                    Paso {step} de {total} ·{' '}
                    {current?.orientation === 'horizontal' ? 'corte horizontal' : 'corte vertical'}
                  </Text>
                </View>
                <Text style={styles.cardText}>{current ? describeStep(current, unit) : ''}</Text>
                {current && (
                  <Text style={styles.cardMeta}>
                    Panel: {formatSize(current.panel.w, current.panel.h, unit)} · queda en{' '}
                    {current.orientation === 'horizontal' ? 'Y' : 'X'} ={' '}
                    {formatMmUnit(current.position, unit)} de la placa
                  </Text>
                )}
                {freedNow.length > 0 && (
                  <View style={styles.freedBox}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.stepDone} />
                    <Text style={styles.freedText}>
                      Con este corte queda lista:{' '}
                      {freedNow
                        .map(
                          (p) =>
                            `${p.name} (${formatSize(p.originalWidth, p.originalHeight, p.unit || 'mm')})`
                        )
                        .join(', ')}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.navRow}>
                <TouchableOpacity
                  style={[styles.navBtn, step <= 1 && styles.navBtnDisabled]}
                  onPress={() => setStep((s) => Math.max(1, s - 1))}
                  disabled={step <= 1}
                  activeOpacity={0.85}
                >
                  <Ionicons name="chevron-back" size={18} color={colors.textOnDark} />
                  <Text style={styles.navBtnText}>Anterior</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.navBtn, styles.navBtnPrimary, step >= total && styles.navBtnDisabled]}
                  onPress={() => setStep((s) => Math.min(total, s + 1))}
                  disabled={step >= total}
                  activeOpacity={0.85}
                >
                  <Text style={styles.navBtnText}>Siguiente</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textOnDark} />
                </TouchableOpacity>
              </View>

              <Text style={styles.listTitle}>Todos los pasos</Text>
              {layout.cutSteps.map((s) => {
                const active = s.order === step;
                const done = s.order < step;
                return (
                  <TouchableOpacity
                    key={s.order}
                    style={[styles.stepRow, active && styles.stepRowActive]}
                    onPress={() => setStep(s.order)}
                    activeOpacity={0.85}
                  >
                    <View
                      style={[
                        styles.rowBadge,
                        { backgroundColor: active ? colors.stepActive : done ? colors.stepDone : colors.darkLine },
                      ]}
                    >
                      {done ? (
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      ) : (
                        <Text style={styles.rowBadgeText}>{s.order}</Text>
                      )}
                    </View>
                    <Text style={[styles.rowText, active && styles.rowTextActive]} numberOfLines={2}>
                      {describeStep(s, unit)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const LegendChip: React.FC<{ color: string; text: string }> = ({ color, text }) => (
  <View style={styles.legendChip}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text style={styles.legendText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.textOnDark },
  subtitle: { fontSize: 12, color: colors.textOnDarkMuted, marginTop: 2 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.darkAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  canvasWrap: { alignItems: 'center', marginBottom: spacing.md },

  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  legendChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 10.5, color: colors.textOnDarkMuted, fontWeight: '600' },

  card: { backgroundColor: colors.darkAlt, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  stepTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 6 },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.stepActive,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  stepTitle: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.textOnDark },
  cardText: { fontSize: 13, color: colors.textOnDark, lineHeight: 19 },
  cardMeta: { fontSize: 11, color: colors.textOnDarkMuted, marginTop: 6 },
  freedBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.darkLine,
  },
  freedText: { flex: 1, fontSize: 11.5, color: colors.textOnDark, fontWeight: '600' },

  navRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.darkAlt,
  },
  navBtnPrimary: { backgroundColor: colors.primary },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { color: colors.textOnDark, fontWeight: '700', fontSize: 13 },

  listTitle: { fontSize: 12, fontWeight: '700', color: colors.textOnDarkMuted, marginBottom: spacing.sm },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 9,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  stepRowActive: { backgroundColor: colors.darkAlt },
  rowBadge: { width: 20, height: 20, borderRadius: radius.full, justifyContent: 'center', alignItems: 'center' },
  rowBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  rowText: { flex: 1, fontSize: 11.5, color: colors.textOnDarkMuted, lineHeight: 16 },
  rowTextActive: { color: colors.textOnDark, fontWeight: '600' },
});