//src/components/CuttingVisualization.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  useWindowDimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CuttingLayout, PlacedCut } from '../algorithm/packing';
import { SheetCanvas, selectionKey, grainLabel } from './SheetCanvas';
import { CutGuideModal } from './CutGuide';
import { colors, spacing, radius, shadow } from '../theme/theme';
import { colorForPiece, pieceKey } from '../utils/pieceColor';
import { formatSize, formatAreaM2, formatMmUnit } from '../utils/unitConversion';

export interface CuttingVisualizationProps {
  layouts: CuttingLayout[];
}

interface SelectedInfo {
  cut: PlacedCut;
  materialLabel: string;
  color: string;
}

interface PieceTypeSummary {
  key: string;
  name: string;
  width: number;
  height: number;
  unit: PlacedCut['unit'];
  color: string;
  count: number;
}

function wasteTone(pct: number): { bg: string; fg: string; icon: any } {
  if (pct <= 15) return { bg: colors.successLight, fg: colors.success, icon: 'checkmark-circle-outline' };
  if (pct <= 30) return { bg: colors.warningLight, fg: colors.warning, icon: 'alert-circle-outline' };
  return { bg: colors.dangerLight, fg: colors.danger, icon: 'warning-outline' };
}

function summarize(cuts: PlacedCut[]): PieceTypeSummary[] {
  const map = new Map<string, PieceTypeSummary>();
  cuts.forEach((cut) => {
    const key = pieceKey(cut.name, cut.originalWidth, cut.originalHeight);
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, {
        key,
        name: cut.name,
        width: cut.originalWidth,
        height: cut.originalHeight,
        unit: cut.unit || 'mm',
        color: colorForPiece(cut.name, cut.originalWidth, cut.originalHeight),
        count: 1,
      });
    }
  });
  return Array.from(map.values());
}

/* ---------- Pantalla completa ---------- */

const FullScreenLayout: React.FC<{
  layout: CuttingLayout;
  selectedKey: string | null;
  showSteps: boolean;
  showOffcuts: boolean;
  onSelect: (cut: PlacedCut, color: string) => void;
  onClose: () => void;
}> = ({ layout, selectedKey, showSteps, showOffcuts, onSelect, onClose }) => {
  const window = Dimensions.get('window');
  const fitScale = Math.min(
    (window.width - 32) / layout.width,
    (window.height - 180) / layout.height
  );
  const scale = Math.max(fitScale, 0.3);

  return (
    <SafeAreaView style={fsStyles.container}>
      <View style={fsStyles.header}>
        <View style={{ flex: 1 }}>
          <Text style={fsStyles.title} numberOfLines={1}>
            {layout.materialLabel}
          </Text>
          <Text style={fsStyles.subtitle}>
            {formatSize(layout.width, layout.height, layout.unit)}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={fsStyles.closeBtn} hitSlop={10}>
          <Ionicons name="close" size={22} color={colors.textOnDark} />
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={fsStyles.scrollContent}
        maximumZoomScale={3}
        minimumZoomScale={1}
        centerContent
      >
        <SheetCanvas
          layout={layout}
          canvasWidth={layout.width * scale}
          canvasHeight={layout.height * scale}
          selectedKey={selectedKey}
          showAllSteps={showSteps}
          showOffcuts={showOffcuts}
          onSelect={onSelect}
        />
      </ScrollView>
      <Text style={fsStyles.hint}>Pellizcá para hacer zoom · Tocá una pieza para ver el detalle</Text>
    </SafeAreaView>
  );
};

/* ---------- Componente principal ---------- */

export const CuttingVisualization: React.FC<CuttingVisualizationProps> = ({ layouts }) => {
  const { width: windowWidth } = useWindowDimensions();
  const [selected, setSelected] = useState<SelectedInfo | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [guideIndex, setGuideIndex] = useState<number | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [showOffcuts, setShowOffcuts] = useState(true);

  const cardCanvasWidth = Math.min(360, windowWidth - spacing.lg * 2 - spacing.md * 2 - spacing.sm * 2);
  const cardCanvasHeight = cardCanvasWidth * 1.25;

  const globalLegend = useMemo(
    () => summarize(layouts.flatMap((l) => l.placedCuts)).sort((a, b) => a.name.localeCompare(b.name)),
    [layouts]
  );

  if (layouts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="grid-outline" size={32} color={colors.textMuted} />
        <Text style={styles.emptyText}>Sin datos para visualizar</Text>
      </View>
    );
  }

  const handleSelect = (cut: PlacedCut, materialLabel: string, color: string) =>
    setSelected({ cut, materialLabel, color });

  const selectedKey = selected ? selectionKey(selected.cut) : null;
  const totalSteps = layouts.reduce((sum, l) => sum + l.cutSteps.length, 0);

  return (
    <View style={styles.container}>
      {globalLegend.length > 0 && (
        <View style={styles.legendCard}>
          <View style={styles.legendHeader}>
            <Ionicons name="color-palette-outline" size={16} color={colors.primaryDark} />
            <Text style={styles.legendTitle}>Referencia de piezas</Text>
          </View>
          <View style={styles.legendGrid}>
            {globalLegend.map((item) => (
              <View key={item.key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.legendName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.legendDims}>
                    {formatSize(item.width, item.height, item.unit || 'mm')} · ×{item.count}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.toggleRow}>
        {totalSteps > 0 && (
          <TouchableOpacity
            style={[styles.toggle, showSteps && styles.toggleActive]}
            onPress={() => setShowSteps((v) => !v)}
            activeOpacity={0.85}
          >
            <Ionicons name="git-network-outline" size={15} color={showSteps ? '#fff' : colors.primaryDark} />
            <Text style={[styles.toggleText, showSteps && styles.toggleTextActive]}>Líneas de corte</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.toggle, showOffcuts && styles.toggleActive]}
          onPress={() => setShowOffcuts((v) => !v)}
          activeOpacity={0.85}
        >
          <Ionicons name="albums-outline" size={15} color={showOffcuts ? '#fff' : colors.primaryDark} />
          <Text style={[styles.toggleText, showOffcuts && styles.toggleTextActive]}>Sobrantes</Text>
        </TouchableOpacity>
      </View>

      {selected && (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={[styles.detailColorDot, { backgroundColor: selected.color }]} />
            <Text style={styles.detailTitle} numberOfLines={1}>
              {selected.cut.name}
            </Text>
            <TouchableOpacity onPress={() => setSelected(null)} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color={colors.textOnDarkMuted} />
            </TouchableOpacity>
          </View>
          <View style={styles.detailGrid}>
            <DetailField
              label="Medidas"
              value={`${formatSize(
                selected.cut.originalWidth,
                selected.cut.originalHeight,
                selected.cut.unit || 'mm'
              )}${selected.cut.rotated ? ' (girado 90°)' : ''}`}
            />
            <DetailField label="Área" value={formatAreaM2(selected.cut.width, selected.cut.height)} />
            <DetailField
              label="Posición"
              value={`X: ${Math.round(selected.cut.x)} / Y: ${Math.round(selected.cut.y)} mm`}
            />
            <DetailField label="Material" value={selected.materialLabel} />
            {selected.cut.freedAtStep > 0 && (
              <DetailField label="Queda lista" value={`En el paso ${selected.cut.freedAtStep}`} />
            )}
            {selected.cut.grainSensitive && (
              <DetailField label="Veta" value="Respeta la veta de la placa" />
            )}
          </View>
        </View>
      )}

      {layouts.map((layout, layoutIndex) => {
        const tone = wasteTone(layout.wastePercentage);
        const pieceSummary = summarize(layout.placedCuts);
        const offcut = layout.biggestOffcut;

        return (
          <View key={layout.materialId} style={styles.layoutCard}>
            <View style={styles.layoutHeader}>
              <View style={styles.layoutIconWrap}>
                <Ionicons name="square-outline" size={16} color={colors.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.layoutTitle} numberOfLines={1}>
                  {layout.materialLabel}
                </Text>
                <Text style={styles.layoutInfo}>
                  {formatSize(layout.width, layout.height, layout.unit)}
                  {grainLabel(layout.grain) ? ` · ${grainLabel(layout.grain)}` : ''}
                </Text>
              </View>
              <View style={[styles.wasteBadge, { backgroundColor: tone.bg }]}>
                <Ionicons name={tone.icon} size={12} color={tone.fg} />
                <Text style={[styles.wasteBadgeText, { color: tone.fg }]}>
                  {layout.wastePercentage.toFixed(1)}%
                </Text>
              </View>
            </View>

            <View style={styles.canvasFrame}>
              <SheetCanvas
                layout={layout}
                canvasWidth={cardCanvasWidth}
                canvasHeight={cardCanvasHeight}
                selectedKey={selectedKey}
                showAllSteps={showSteps}
                showOffcuts={showOffcuts}
                onSelect={(cut, color) => handleSelect(cut, layout.materialLabel, color)}
              />
            </View>
            <View style={styles.dimRow}>
              <Text style={styles.dimRowText}>↔ {formatMmUnit(layout.width, layout.unit)}</Text>
              <Text style={styles.dimRowText}>↕ {formatMmUnit(layout.height, layout.unit)}</Text>
            </View>

            {offcut && (
              <View style={styles.offcutRow}>
                <Ionicons name="bookmark-outline" size={13} color={colors.accentDark} />
                <Text style={styles.offcutText}>
                  Sobrante más grande reutilizable:{' '}
                  {formatSize(offcut.w, offcut.h, layout.unit)} ({formatAreaM2(offcut.w, offcut.h)})
                </Text>
              </View>
            )}

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setExpandedIndex(layoutIndex)}
                activeOpacity={0.85}
              >
                <Ionicons name="scan-outline" size={14} color={colors.primaryDark} />
                <Text style={styles.secondaryBtnText}>Pantalla completa</Text>
              </TouchableOpacity>
              {layout.cutSteps.length > 0 && (
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => setGuideIndex(layoutIndex)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="footsteps-outline" size={14} color="#fff" />
                  <Text style={styles.primaryBtnText}>
                    Guía paso a paso ({layout.cutSteps.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.cutsList}>
              <Text style={styles.cutsListTitle}>Cortes en este material</Text>
              {pieceSummary.map((item) => (
                <View key={item.key} style={styles.cutListItem}>
                  <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                  <Text style={styles.cutListText}>
                    {item.name} · {formatSize(item.width, item.height, item.unit || 'mm')} · ×{item.count}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}

      <Modal
        visible={expandedIndex !== null}
        animationType="slide"
        onRequestClose={() => setExpandedIndex(null)}
      >
        {expandedIndex !== null && (
          <FullScreenLayout
            layout={layouts[expandedIndex]}
            selectedKey={selectedKey}
            showSteps={showSteps}
            showOffcuts={showOffcuts}
            onSelect={(cut, color) => handleSelect(cut, layouts[expandedIndex].materialLabel, color)}
            onClose={() => setExpandedIndex(null)}
          />
        )}
      </Modal>

      <CutGuideModal
        visible={guideIndex !== null}
        layout={guideIndex !== null ? layouts[guideIndex] : null}
        onClose={() => setGuideIndex(null)}
      />
    </View>
  );
};

const DetailField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.detailField}>
    <Text style={styles.detailFieldLabel}>{label}</Text>
    <Text style={styles.detailFieldValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { padding: spacing.lg, backgroundColor: colors.background },
  emptyContainer: { padding: spacing.xl, justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  emptyText: { fontSize: 14, color: colors.textMuted },

  legendCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.subtle,
  },
  legendHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  legendTitle: { fontSize: 12, fontWeight: '700', color: colors.text },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '47%' },
  legendDot: { width: 12, height: 12, borderRadius: 4 },
  legendName: { fontSize: 11, fontWeight: '700', color: colors.text },
  legendDims: { fontSize: 10, color: colors.textMuted },

  toggleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  toggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingVertical: 10,
  },
  toggleActive: { backgroundColor: colors.primaryDark },
  toggleText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
  toggleTextActive: { color: '#fff' },

  detailCard: {
    backgroundColor: colors.dark,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.raised,
  },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  detailColorDot: { width: 12, height: 12, borderRadius: 6 },
  detailTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.textOnDark },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  detailField: { width: '47%', backgroundColor: colors.darkAlt, borderRadius: radius.sm, padding: spacing.sm },
  detailFieldLabel: { fontSize: 10, color: colors.textOnDarkMuted, fontWeight: '600', marginBottom: 2 },
  detailFieldValue: { fontSize: 13, color: colors.textOnDark, fontWeight: '700' },

  layoutCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.card,
  },
  layoutHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  layoutIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  layoutTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  layoutInfo: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  wasteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  wasteBadgeText: { fontSize: 11, fontWeight: '700' },

  canvasFrame: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  dimRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    marginTop: spacing.xs,
  },
  dimRowText: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },

  offcutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentLight,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  offcutText: { flex: 1, fontSize: 11, color: colors.accentDark, fontWeight: '600' },

  btnRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.sm },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  secondaryBtnText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
  primaryBtn: {
    flex: 1.3,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  primaryBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  cutsList: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md },
  cutsListTitle: { fontSize: 12, fontWeight: '700', marginBottom: spacing.sm, color: colors.text },
  cutListItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 3 },
  colorDot: { width: 9, height: 9, borderRadius: 4 },
  cutListText: { fontSize: 12, color: colors.textMuted },
});

const fsStyles = StyleSheet.create({
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
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  hint: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.textOnDarkMuted,
    paddingBottom: spacing.lg,
    fontStyle: 'italic',
  },
});