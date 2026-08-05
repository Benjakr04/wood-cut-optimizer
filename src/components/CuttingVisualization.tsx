//CuttingVisualization.tsx
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
  Pressable,
} from 'react-native';
import type { GestureResponderEvent } from 'react-native';
import Svg, { Rect, Text as SvgText, Line, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { CuttingLayout, PlacedCut, CutStep } from '../algorithm/packing';
import { colors, spacing, radius, shadow } from '../theme/theme';
import { colorForPiece, pieceKey } from '../utils/pieceColor';
import { fromMm, unitSymbol } from '../utils/unitConversion';

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
  color: string;
  count: number;
}

// Elige un paso de grilla "prolijo" (10, 20, 25, 50, 100mm, etc.) según el
// tamaño de la placa, para que siempre se vean entre 4 y 8 líneas de referencia.
function calcGridStep(total: number): number {
  const target = total / 6;
  const steps = [10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000];
  for (const step of steps) {
    if (target <= step) return step;
  }
  return steps[steps.length - 1];
}

function wasteTone(pct: number): { bg: string; fg: string; icon: any } {
  if (pct <= 15) return { bg: colors.successLight, fg: colors.success, icon: 'checkmark-circle-outline' };
  if (pct <= 30) return { bg: colors.warningLight, fg: colors.warning, icon: 'alert-circle-outline' };
  return { bg: colors.dangerLight, fg: colors.danger, icon: 'warning-outline' };
}

function selectionKey(cut: PlacedCut): string {
  return `${cut.materialId}-${cut.x}-${cut.y}-${cut.name}`;
}

function summarizeLayout(layout: CuttingLayout): PieceTypeSummary[] {
  const map = new Map<string, PieceTypeSummary>();
  layout.placedCuts.forEach((cut) => {
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
        color: colorForPiece(cut.name, cut.originalWidth, cut.originalHeight),
        count: 1,
      });
    }
  });
  return Array.from(map.values());
}

function grainLabel(grain: CuttingLayout['grain']): string | null {
  if (grain === 'vertical') return 'Veta ↕';
  if (grain === 'horizontal') return 'Veta ↔';
  return null;
}

/* ---------- Canvas SVG reutilizable (tarjeta chica y pantalla completa) ---------- */

interface SheetCanvasProps {
  layout: CuttingLayout;
  canvasWidth: number;
  canvasHeight: number;
  selectedKey: string | null;
  showSteps: boolean;
  onSelect: (cut: PlacedCut, color: string) => void;
}

const SheetCanvas: React.FC<SheetCanvasProps> = ({
  layout,
  canvasWidth,
  canvasHeight,
  selectedKey,
  showSteps,
  onSelect,
}) => {
  const scale = Math.min(canvasWidth / layout.width, canvasHeight / layout.height, 1);
  const renderW = layout.width * scale;
  const renderH = layout.height * scale;
  const gridStep = calcGridStep(Math.max(layout.width, layout.height));

  const gridLinesX: number[] = [];
  for (let x = gridStep; x < layout.width; x += gridStep) gridLinesX.push(x);
  const gridLinesY: number[] = [];
  for (let y = gridStep; y < layout.height; y += gridStep) gridLinesY.push(y);

  // Detectamos qué pieza se tocó por coordenadas, en vez de poner onPress
  // en cada elemento del SVG. react-native-svg resuelve onPress en los
  // primitivos (Rect/Text) con un sistema de touch viejo y deprecado que en
  // Web tira warnings y a veces rompe. Un solo Pressable + hit-testing evita
  // ese problema por completo y funciona igual en iOS, Android y Web.
  const handlePress = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    const sheetX = locationX / scale;
    const sheetY = locationY / scale;
    const hit = layout.placedCuts.find(
      (cut) =>
        sheetX >= cut.x &&
        sheetX <= cut.x + cut.width &&
        sheetY >= cut.y &&
        sheetY <= cut.y + cut.height
    );
    if (hit) {
      const color = colorForPiece(hit.name, hit.originalWidth, hit.originalHeight);
      onSelect(hit, color);
    }
  };

  // Tamaños de fuente pensados para que el texto se vea SIEMPRE del mismo
  // tamaño en pantalla (en píxeles), sin importar cuán grande sea la placa
  // ni cuánto se haya reducido el dibujo para que entre en la tarjeta.
  // Como el SVG usa viewBox en milímetros, "tamaño en mm" x "scale" = px.
  const nameFontPx = 13.5;
  const dimsFontPx = 12;
  const fontSizeName = nameFontPx / scale;
  const fontSizeDims = dimsFontPx / scale;
  const strokeW = 2.4 / scale;
  const gLabel = grainLabel(layout.grain);

  return (
    <Pressable onPress={handlePress} style={{ width: renderW, height: renderH }}>
      <Svg width={renderW} height={renderH} viewBox={`0 0 ${layout.width} ${layout.height}`}>
        <Rect
          x={0}
          y={0}
          width={layout.width}
          height={layout.height}
          fill={colors.surfaceSunken}
          stroke={colors.dark}
          strokeWidth={2 / scale}
        />

        {gridLinesX.map((x) => (
          <Line
            key={`gx-${x}`}
            x1={x}
            y1={0}
            x2={x}
            y2={layout.height}
            stroke={colors.borderStrong}
            strokeWidth={1 / scale}
            strokeDasharray={`${3 / scale},${3 / scale}`}
          />
        ))}
        {gridLinesY.map((y) => (
          <Line
            key={`gy-${y}`}
            x1={0}
            y1={y}
            x2={layout.width}
            y2={y}
            stroke={colors.borderStrong}
            strokeWidth={1 / scale}
            strokeDasharray={`${3 / scale},${3 / scale}`}
          />
        ))}

        {layout.placedCuts.map((cut, idx) => {
          const color = colorForPiece(cut.name, cut.originalWidth, cut.originalHeight);
          const isSelected = selectedKey === selectionKey(cut);
          const renderedW = cut.width * scale;
          const renderedH = cut.height * scale;
          const showTwoLines = renderedW >= 50 && renderedH >= 40;
          const showOneLine = !showTwoLines && renderedW >= 28 && renderedH >= 18;

          return (
            <React.Fragment key={`${layout.materialId}-${idx}`}>
              <Rect
                x={cut.x}
                y={cut.y}
                width={cut.width}
                height={cut.height}
                rx={2 / scale}
                fill={color}
                stroke={isSelected ? colors.dark : 'rgba(0,0,0,0.28)'}
                strokeWidth={isSelected ? 3 / scale : 1 / scale}
              />
              {isSelected && (
                <Rect
                  x={cut.x + 2 / scale}
                  y={cut.y + 2 / scale}
                  width={Math.max(0, cut.width - 4 / scale)}
                  height={Math.max(0, cut.height - 4 / scale)}
                  rx={1.5 / scale}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={1.5 / scale}
                  strokeDasharray={`${3 / scale},${3 / scale}`}
                />
              )}
              {showTwoLines && (
                <>
                  <SvgText
                    x={cut.x + cut.width / 2}
                    y={cut.y + cut.height / 2 - fontSizeDims / 2}
                    textAnchor="middle"
                    fontSize={fontSizeName}
                    fontWeight="800"
                    fill="#fff"
                    stroke="rgba(0,0,0,0.45)"
                    strokeWidth={strokeW}
                  >
                    {cut.rotated ? '↻ ' : ''}
                    {cut.name}
                  </SvgText>
                  <SvgText
                    x={cut.x + cut.width / 2}
                    y={cut.y + cut.height / 2 + fontSizeDims + 2 / scale}
                    textAnchor="middle"
                    fontSize={fontSizeDims}
                    fontWeight="700"
                    fill="#fff"
                    stroke="rgba(0,0,0,0.45)"
                    strokeWidth={strokeW}
                  >
                    {fromMm(cut.originalWidth, cut.unit).toFixed(1)}×{fromMm(cut.originalHeight, cut.unit).toFixed(1)}{unitSymbol(cut.unit || 'mm')}
                  </SvgText>
                </>
              )}
              {showOneLine && (
                <SvgText
                  x={cut.x + cut.width / 2}
                  y={cut.y + cut.height / 2 + fontSizeDims / 3}
                  textAnchor="middle"
                  fontSize={fontSizeDims}
                  fontWeight="800"
                  fill="#fff"
                  stroke="rgba(0,0,0,0.45)"
                  strokeWidth={strokeW}
                >
                  {fromMm(cut.originalWidth, cut.unit).toFixed(1)}×{fromMm(cut.originalHeight, cut.unit).toFixed(1)}{unitSymbol(cut.unit || 'mm')}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}

        {showSteps &&
          layout.cutSteps.map((step) => {
            const isHorizontal = step.orientation === 'horizontal';
            const x1 = isHorizontal ? step.from : step.position;
            const y1 = isHorizontal ? step.position : step.from;
            const x2 = isHorizontal ? step.to : step.position;
            const y2 = isHorizontal ? step.position : step.to;
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const badgeR = 9 / scale;
            const stepColor = isHorizontal ? colors.info : colors.primaryDark;
            return (
              <React.Fragment key={`step-${step.order}`}>
                <Line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={stepColor}
                  strokeWidth={2.2 / scale}
                  strokeDasharray={`${6 / scale},${4 / scale}`}
                />
                <Circle cx={midX} cy={midY} r={badgeR} fill={stepColor} stroke="#fff" strokeWidth={1.2 / scale} />
                <SvgText
                  x={midX}
                  y={midY + 3.4 / scale}
                  textAnchor="middle"
                  fontSize={10.5 / scale}
                  fontWeight="800"
                  fill="#fff"
                >
                  {step.order}
                </SvgText>
              </React.Fragment>
            );
          })}

        {gLabel && (
          <>
            <Rect x={6 / scale} y={6 / scale} width={54 / scale} height={20 / scale} rx={4 / scale} fill="rgba(38,33,29,0.72)" />
            <SvgText
              x={33 / scale}
              y={20 / scale}
              textAnchor="middle"
              fontSize={11 / scale}
              fontWeight="700"
              fill="#fff"
            >
              {gLabel}
            </SvgText>
          </>
        )}
      </Svg>
    </Pressable>
  );
};

/* ---------- Lista de pasos de corte en texto ---------- */

const CutStepsList: React.FC<{ steps: CutStep[] }> = ({ steps }) => {
  if (steps.length === 0) return null;
  return (
    <View style={styles.stepsList}>
      <View style={styles.stepsListHeader}>
        <Ionicons name="list-outline" size={14} color={colors.primaryDark} />
        <Text style={styles.stepsListTitle}>Pasos de corte ({steps.length})</Text>
      </View>
      {steps.map((step) => (
        <View key={step.order} style={styles.stepRow}>
          <View
            style={[
              styles.stepBadge,
              { backgroundColor: step.orientation === 'horizontal' ? colors.info : colors.primaryDark },
            ]}
          >
            <Text style={styles.stepBadgeText}>{step.order}</Text>
          </View>
          <Ionicons
            name={step.orientation === 'horizontal' ? 'remove-outline' : 'reorder-four-outline'}
            size={13}
            color={colors.textMuted}
          />
          <Text style={styles.stepText}>
            Corte {step.orientation === 'horizontal' ? 'horizontal' : 'vertical'} en{' '}
            {step.orientation === 'horizontal' ? 'Y' : 'X'} = {Math.round(step.position)}mm
            {'  '}(largo: {Math.round(step.length)}mm)
          </Text>
        </View>
      ))}
    </View>
  );
};

/* ---------- Modal de pantalla completa ---------- */

interface FullScreenLayoutProps {
  layout: CuttingLayout;
  selectedKey: string | null;
  showSteps: boolean;
  onSelect: (cut: PlacedCut, color: string) => void;
  onClose: () => void;
}

const FullScreenLayout: React.FC<FullScreenLayoutProps> = ({ layout, selectedKey, showSteps, onSelect, onClose }) => {
  const window = Dimensions.get('window');
  const fitScale = Math.min(
    (window.width - 32) / layout.width,
    (window.height - 180) / layout.height
  );
  const scale = Math.max(fitScale, 0.3);
  const canvasWidth = layout.width * scale;
  const canvasHeight = layout.height * scale;

  return (
    <SafeAreaView style={fsStyles.container}>
      <View style={fsStyles.header}>
        <View style={{ flex: 1 }}>
          <Text style={fsStyles.title} numberOfLines={1}>
            {layout.materialLabel}
          </Text>
          <Text style={fsStyles.subtitle}>
            {layout.width}×{layout.height}mm
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
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          selectedKey={selectedKey}
          showSteps={showSteps}
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
  const [showSteps, setShowSteps] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});

  const cardCanvasWidth = Math.min(360, windowWidth - spacing.lg * 2 - spacing.md * 2 - spacing.sm * 2);
  const cardCanvasHeight = cardCanvasWidth * 1.25;

  const globalLegend = useMemo(() => {
    const map = new Map<string, PieceTypeSummary>();
    layouts.forEach((layout) => {
      layout.placedCuts.forEach((cut) => {
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
            color: colorForPiece(cut.name, cut.originalWidth, cut.originalHeight),
            count: 1,
          });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [layouts]);

  if (layouts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="grid-outline" size={32} color={colors.textMuted} />
        <Text style={styles.emptyText}>Sin datos para visualizar</Text>
      </View>
    );
  }

  const handleSelect = (cut: PlacedCut, materialLabel: string, color: string) => {
    setSelected({ cut, materialLabel, color });
  };

  const toggleSteps = (materialId: string) =>
    setExpandedSteps((prev) => ({ ...prev, [materialId]: !prev[materialId] }));

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
                    {item.width}×{item.height}mm · ×{item.count}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {totalSteps > 0 && (
        <TouchableOpacity
          style={[styles.stepsToggle, showSteps && styles.stepsToggleActive]}
          onPress={() => setShowSteps((v) => !v)}
          activeOpacity={0.85}
        >
          <Ionicons name="git-network-outline" size={16} color={showSteps ? '#fff' : colors.primaryDark} />
          <Text style={[styles.stepsToggleText, showSteps && styles.stepsToggleTextActive]}>
            {showSteps ? 'Ocultar pasos de corte en el plano' : 'Mostrar pasos de corte en el plano'}
          </Text>
        </TouchableOpacity>
      )}

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
              value={`${fromMm(selected.cut.originalWidth, selected.cut.unit).toFixed(1)}×${fromMm(selected.cut.originalHeight, selected.cut.unit).toFixed(1)}${unitSymbol(selected.cut.unit || 'mm')}${
                selected.cut.rotated ? ' (girado 90°)' : ''
              }`}
            />
            <DetailField
              label="Área"
              value={`${((selected.cut.width * selected.cut.height) / 1e6).toFixed(3)} m²`}
            />
            <DetailField label="Posición" value={`X: ${selected.cut.x} / Y: ${selected.cut.y}`} />
            <DetailField label="Material" value={selected.materialLabel} />
            {selected.cut.grainSensitive && (
              <DetailField label="Veta" value="Esta pieza respeta la veta de la placa" />
            )}
          </View>
        </View>
      )}

      {layouts.map((layout, layoutIndex) => {
        const tone = wasteTone(layout.wastePercentage);
        const pieceSummary = summarizeLayout(layout);
        const stepsOpen = !!expandedSteps[layout.materialId];

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
                  {layout.width}×{layout.height}mm
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
                showSteps={showSteps}
                onSelect={(cut, color) => handleSelect(cut, layout.materialLabel, color)}
              />
            </View>
            <View style={styles.dimRow}>
              <Text style={styles.dimRowText}>↔ {layout.width}mm</Text>
              <Text style={styles.dimRowText}>↕ {layout.height}mm</Text>
            </View>

            <TouchableOpacity
              style={styles.expandBtn}
              onPress={() => setExpandedIndex(layoutIndex)}
              activeOpacity={0.85}
            >
              <Ionicons name="scan-outline" size={14} color={colors.primaryDark} />
              <Text style={styles.expandBtnText}>Ver en pantalla completa</Text>
            </TouchableOpacity>

            {layout.cutSteps.length > 0 && (
              <TouchableOpacity
                style={styles.stepsCollapseBtn}
                onPress={() => toggleSteps(layout.materialId)}
                activeOpacity={0.85}
              >
                <Ionicons name={stepsOpen ? 'chevron-up-outline' : 'chevron-down-outline'} size={14} color={colors.textMuted} />
                <Text style={styles.stepsCollapseBtnText}>
                  {stepsOpen ? 'Ocultar' : 'Ver'} pasos de corte de esta placa ({layout.cutSteps.length})
                </Text>
              </TouchableOpacity>
            )}
            {stepsOpen && <CutStepsList steps={layout.cutSteps} />}

            <View style={styles.cutsList}>
              <Text style={styles.cutsListTitle}>Cortes en este material</Text>
              {pieceSummary.map((item) => {
                const cut = layout.placedCuts.find((c) => c.originalWidth === item.width && c.originalHeight === item.height);
                const unit = cut?.unit || 'mm';
                return (
                  <View key={item.key} style={styles.cutListItem}>
                    <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                    <Text style={styles.cutListText}>
                      {item.name} · {fromMm(item.width, unit).toFixed(1)}×{fromMm(item.height, unit).toFixed(1)}{unitSymbol(unit)} · ×{item.count}
                    </Text>
                  </View>
                );
              })}
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
            onSelect={(cut, color) => handleSelect(cut, layouts[expandedIndex].materialLabel, color)}
            onClose={() => setExpandedIndex(null)}
          />
        )}
      </Modal>
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
  container: {
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  emptyContainer: {
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
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

  stepsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingVertical: 10,
    marginBottom: spacing.md,
  },
  stepsToggleActive: { backgroundColor: colors.primaryDark },
  stepsToggleText: { fontSize: 12.5, fontWeight: '700', color: colors.primaryDark },
  stepsToggleTextActive: { color: '#fff' },

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
  wasteBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full },
  wasteBadgeText: { fontSize: 11, fontWeight: '700' },

  canvasFrame: { alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.sm },
  dimRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.xs, marginTop: spacing.xs, marginBottom: spacing.sm },
  dimRowText: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },

  expandBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingVertical: 9,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  expandBtnText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },

  stepsCollapseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: spacing.sm,
  },
  stepsCollapseBtnText: { fontSize: 11.5, fontWeight: '700', color: colors.textMuted },

  stepsList: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  stepsListHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  stepsListTitle: { fontSize: 12, fontWeight: '700', color: colors.text },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: 4 },
  stepBadge: { width: 18, height: 18, borderRadius: radius.full, justifyContent: 'center', alignItems: 'center' },
  stepBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  stepText: { flex: 1, fontSize: 11.5, color: colors.text },

  cutsList: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md },
  cutsListTitle: { fontSize: 12, fontWeight: '700', marginBottom: spacing.sm, color: colors.text },
  cutListItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 3 },
  colorDot: { width: 9, height: 9, borderRadius: 4 },
  cutListText: { fontSize: 12, color: colors.textMuted },
});

const fsStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
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
  hint: { textAlign: 'center', fontSize: 11, color: colors.textOnDarkMuted, paddingBottom: spacing.lg, fontStyle: 'italic' },
});