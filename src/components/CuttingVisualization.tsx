import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { CuttingLayout, PlacedCut } from '../algorithm/packing';
import { colors, spacing, radius, shadow } from '../theme/theme';

export interface CuttingVisualizationProps {
  layouts: CuttingLayout[];
}

const COLORS = [
  '#C2703D',
  '#4ECDC4',
  '#45B7D1',
  '#E8A87C',
  '#98D8C8',
  '#D4A574',
  '#BB8FCE',
  '#85C1E2',
];

interface SelectedInfo {
  cut: PlacedCut;
  materialLabel: string;
  color: string;
}

export const CuttingVisualization: React.FC<CuttingVisualizationProps> = ({ layouts }) => {
  const [selected, setSelected] = useState<SelectedInfo | null>(null);

  if (layouts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="grid-outline" size={32} color={colors.textMuted} />
        <Text style={styles.emptyText}>Sin datos para visualizar</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {selected && (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={[styles.detailColorDot, { backgroundColor: selected.color }]} />
            <Text style={styles.detailTitle}>{selected.cut.name}</Text>
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.textMuted}
              onPress={() => setSelected(null)}
            />
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
        const maxWidth = 340;
        const maxHeight = 480;
        const scaleX = maxWidth / layout.width;
        const scaleY = maxHeight / layout.height;
        const scale = Math.min(scaleX, scaleY, 1);

        return (
          <View key={layout.materialId} style={styles.layoutCard}>
            <View style={styles.layoutHeader}>
              <View style={styles.layoutIconWrap}>
                <Ionicons name="square-outline" size={16} color={colors.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.layoutTitle}>{layout.materialLabel}</Text>
                <Text style={styles.layoutInfo}>
                  {layout.width}×{layout.height}mm
                </Text>
              </View>
              <View style={styles.wasteBadge}>
                <Ionicons name="trash-outline" size={12} color={colors.danger} />
                <Text style={styles.wasteBadgeText}>{layout.wastePercentage.toFixed(1)}%</Text>
              </View>
            </View>

            <View style={styles.svgWrapper}>
              <Svg
                width={Math.min(layout.width * scale, maxWidth)}
                height={Math.min(layout.height * scale, maxHeight)}
                viewBox={`0 0 ${layout.width} ${layout.height}`}
                style={styles.svg}
              >
                <Rect
                  x="0"
                  y="0"
                  width={layout.width}
                  height={layout.height}
                  fill={colors.surfaceAlt}
                  stroke={colors.dark}
                  strokeWidth="2"
                />

                {layout.placedCuts.map((cut, cutIndex) => {
                  const color = COLORS[cutIndex % COLORS.length];
                  const renderedW = cut.width * scale;
                  const renderedH = cut.height * scale;
                  const showLabel = renderedW >= 34 && renderedH >= 18;
                  const labelFontSize = Math.min(28, 13 / scale);
                  const isSelected =
                    selected?.cut.x === cut.x &&
                    selected?.cut.y === cut.y &&
                    selected?.cut.name === cut.name;

                  return (
                    <React.Fragment key={`${layout.materialId}-${cutIndex}`}>
                      <Rect
                        x={cut.x}
                        y={cut.y}
                        width={cut.width}
                        height={cut.height}
                        fill={color}
                        stroke={isSelected ? '#fff' : colors.dark}
                        strokeWidth={isSelected ? 3 / scale : 1}
                        opacity="0.9"
                        onPress={() =>
                          setSelected({ cut, materialLabel: layout.materialLabel, color })
                        }
                      />
                      {showLabel && (
                        <SvgText
                          x={cut.x + cut.width / 2}
                          y={cut.y + cut.height / 2 + labelFontSize / 3}
                          textAnchor="middle"
                          fontSize={labelFontSize}
                          fill="#fff"
                          fontWeight="bold"
                          onPress={() =>
                            setSelected({ cut, materialLabel: layout.materialLabel, color })
                          }
                        >
                          {cut.rotated ? '↻ ' : ''}
                          {cut.originalWidth}×{cut.originalHeight}
                        </SvgText>
                      )}
                    </React.Fragment>
                  );
                })}
              </Svg>
            </View>

            <Text style={styles.tapHint}>Tocá un corte para ver más detalles</Text>

            <View style={styles.cutsList}>
              <Text style={styles.cutsListTitle}>Cortes en este material</Text>
              {layout.placedCuts.map((cut, idx) => (
                <View key={idx} style={styles.cutListItem}>
                  <View style={[styles.colorDot, { backgroundColor: COLORS[idx % COLORS.length] }]} />
                  <Text style={styles.cutListText}>
                    {cut.name} · {cut.originalWidth}×{cut.originalHeight}mm
                    {cut.rotated ? ' ↻' : ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}
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
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  wasteBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger,
  },
  svgWrapper: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  svg: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
  },
  tapHint: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontStyle: 'italic',
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
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cutListText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});