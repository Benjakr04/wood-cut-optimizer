import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { CuttingLayout } from '../algorithm/packing';
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

export const CuttingVisualization: React.FC<CuttingVisualizationProps> = ({ layouts }) => {
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
                <Text style={styles.layoutTitle}>
                  Material {layoutIndex + 1}
                </Text>
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
                  return (
                    <g key={`${layout.materialId}-${cutIndex}`}>
                      <Rect
                        x={cut.x}
                        y={cut.y}
                        width={cut.width}
                        height={cut.height}
                        fill={color}
                        stroke={colors.dark}
                        strokeWidth="1"
                        opacity="0.85"
                      />
                      <SvgText
                        x={cut.x + cut.width / 2}
                        y={cut.y + cut.height / 2 + 5}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#fff"
                        fontWeight="bold"
                      >
                        {cut.width}×{cut.height}
                      </SvgText>
                    </g>
                  );
                })}
              </Svg>
            </View>

            <View style={styles.cutsList}>
              <Text style={styles.cutsListTitle}>Cortes en este material</Text>
              {layout.placedCuts.map((cut, idx) => (
                <View key={idx} style={styles.cutListItem}>
                  <View style={[styles.colorDot, { backgroundColor: COLORS[idx % COLORS.length] }]} />
                  <Text style={styles.cutListText}>{cut.width}×{cut.height}mm</Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
};

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
    marginBottom: spacing.md,
  },
  svg: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
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