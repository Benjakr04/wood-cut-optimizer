import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Pressable,
} from 'react-native';
import type { GestureResponderEvent } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { CuttingLayout, PlacedCut } from '../algorithm/packing';
import { colors, spacing, radius, shadow } from '../theme/theme';
import { colorForPiece, pieceKey } from '../utils/pieceColor';

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

const CARD_CANVAS_WIDTH = 300;
const CARD_CANVAS_HEIGHT = 380;

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

/* ---------- Canvas SVG reutilizable (tarjeta chica y pantalla completa) ---------- */

interface SheetCanvasProps {
  layout: CuttingLayout;
  canvasWidth: number;
  canvasHeight: number;
  selectedKey: string | null;
  onSelect: (cut: PlacedCut, color: string) => void;
}

const SheetCanvas: React.FC<SheetCanvasProps> = ({
  layout,
  canvasWidth,
  canvasHeight,
  selectedKey,
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
  // Web tira warnings y a veces rompe ("Cannot find single active touch").
  // Un solo Pressable + hit-testing evita ese problema por completo y
  // funciona igual en iOS, Android y Web.
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
        const showTwoLines = renderedW >= 44 && renderedH >= 32;
        const showOneLine = !showTwoLines && renderedW >= 26 && renderedH >= 16;
        const fontSizeName = Math.min(12, 12 / scale);
        const fontSizeDims = Math.min(10.5, 10.5 / scale);

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
                  y={cut.y + cut.height / 2 - 2 / scale}
                  textAnchor="middle"
                  fontSize={fontSizeName}
                  fontWeight="700"
                  fill="#fff"
                >
                  {cut.rotated ? '↻ ' : ''}
                  {cut.name}
                </SvgText>
                <SvgText
                  x={cut.x + cut.width / 2}
                  y={cut.y + cut.height / 2 + fontSizeDims + 2 / scale}
                  textAnchor="middle"
                  fontSize={fontSizeDims}
                  fill="rgba(255,255,255,0.85)"
                >
                  {cut.originalWidth}×{cut.originalHeight}
                </SvgText>
              </>
            )}
            {showOneLine && (
              <SvgText
                x={cut.x + cut.width / 2}
                y={cut.y + cut.height / 2 + fontSizeDims / 3}
                textAnchor="middle"
                fontSize={fontSizeDims}
                fontWeight="700"
                fill="#fff"
              >
                {cut.originalWidth}×{cut.originalHeight}
              </SvgText>
            )}
          </React.Fragment>
        );
      })}
      </Svg>
    </Pressable>
  );
};

/* ---------- Modal de pantalla completa ---------- */

interface FullScreenLayoutProps {
  layout: CuttingLayout;
  selectedKey: string | null;
  onSelect: (cut: PlacedCut, color: string) => void;
  onClose: () => void;
}

const FullScreenLayout: React.FC<FullScreenLayoutProps> = ({ layout, selectedKey, onSelect, onClose }) => {
  const window = Dimensions.get('window');
  const fitScale = Math.min(
    (window.width - 32) / layout.width,
    (window.height - 180) / layout.height
  );
  const scale = Math.max(fitScale, 0.3);
  const canvasWidth = layout.width * scale;
  const canvasHeight = layout.height * scale;

  return (
    <SafeAreaView style={styles.fullScreenContainer}>
      <View style={styles.fullScreenHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.fullScreenTitle} numberOfLines={1}>
            {layout.materialLabel}
          </Text>
          <Text style={styles.fullScreenSubtitle}>
            {layout.width}×{layout.height}mm
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.fullScreenCloseBtn} hitSlop={10}>
          <Ionicons name="close" size={22} color={colors.textOnDark} />
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={styles.fullScreenScrollContent}
        maximumZoomScale={3}
        minimumZoomScale={1}
        centerContent
      >
        <SheetCanvas
          layout={layout}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          selectedKey={selectedKey}
          onSelect={onSelect}
        />
      </ScrollView>
      <Text style={styles.fullScreenHint}>Pellizcá para hacer zoom · Tocá una pieza para ver el detalle</Text>
    </SafeAreaView>
  );
};

/* ---------- Componente principal ---------- */

export const CuttingVisualization: React.FC<CuttingVisualizationProps> = ({ layouts }) => {
  const [selected, setSelected] = useState<SelectedInfo | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

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

  const selectedKey = selected ? selectionKey(selected.cut) : null;

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
              value={`${selected.cut.originalWidth}×${selected.cut.originalHeight}mm${
                selected.cut.rotated ? ' (girado 90°)' : ''
              }`}
            />
            <DetailField
              label="Área"
              value={`${((selected.cut.width * selected.cut.height) / 1e6).toFixed(3)} m²`}
            />
            <DetailField label="Posición" value={`X: ${selected.cut.x} / Y: ${selected.cut.y}`} />
            <DetailField label="Material" value={selected.materialLabel} />
          </View>
        </View>
      )}

      {layouts.map((layout, layoutIndex) => {
        const tone = wasteTone(layout.wastePercentage);
        const pieceSummary = summarizeLayout(layout);

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
                canvasWidth={CARD_CANVAS_WIDTH}
                canvasHeight={CARD_CANVAS_HEIGHT}
                selectedKey={selectedKey}
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

            <View style={styles.cutsList}>
              <Text style={styles.cutsListTitle}>Cortes en este material</Text>
              {pieceSummary.map((item) => (
                <View key={item.key} style={styles.cutListItem}>
                  <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                  <Text style={styles.cutListText}>
                    {item.name} · {item.width}×{item.height}mm · ×{item.count}
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
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },

  legendCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.subtle,
  },
  legendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '47%',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 4,
  },
  legendName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  legendDims: {
    fontSize: 10,
    color: colors.textMuted,
  },

  detailCard: {
    backgroundColor: colors.dark,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.raised,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  detailColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  detailTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textOnDark,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  detailField: {
    width: '47%',
    backgroundColor: colors.darkAlt,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  detailFieldLabel: {
    fontSize: 10,
    color: colors.textOnDarkMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  detailFieldValue: {
    fontSize: 13,
    color: colors.textOnDark,
    fontWeight: '700',
  },

  layoutCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.card,
  },
  layoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  layoutIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  layoutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  layoutInfo: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  wasteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  wasteBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

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
    marginBottom: spacing.sm,
  },
  dimRowText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },

  expandBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingVertical: 9,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  expandBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },

  cutsList: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  cutsListTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: spacing.sm,
    color: colors.text,
  },
  cutListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 3,
  },
  colorDot: {
    width: 9,
    height: 9,
    borderRadius: 4,
  },
  cutListText: {
    fontSize: 12,
    color: colors.textMuted,
  },

  fullScreenContainer: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  fullScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  fullScreenTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textOnDark,
  },
  fullScreenSubtitle: {
    fontSize: 12,
    color: colors.textOnDarkMuted,
    marginTop: 2,
  },
  fullScreenCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.darkAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  fullScreenHint: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.textOnDarkMuted,
    paddingBottom: spacing.lg,
    fontStyle: 'italic',
  },
});