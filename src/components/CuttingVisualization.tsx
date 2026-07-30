import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { CuttingLayout } from '../algorithm/packing';

export interface CuttingVisualizationProps {
  layouts: CuttingLayout[];
}

const COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E2',
];

export const CuttingVisualization: React.FC<CuttingVisualizationProps> = ({ layouts }) => {
  if (layouts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Sin datos para visualizar</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {layouts.map((layout, layoutIndex) => {
        const maxWidth = 350;
        const maxHeight = 500;
        const scaleX = maxWidth / layout.width;
        const scaleY = maxHeight / layout.height;
        const scale = Math.min(scaleX, scaleY, 1);

        return (
          <View key={layout.materialId} style={styles.layoutContainer}>
            <Text style={styles.layoutTitle}>
              Material {layoutIndex + 1}: {layout.name || layout.materialId}
            </Text>

            <Text style={styles.layoutInfo}>
              Dimensiones: {layout.width}×{layout.height}mm | Desperdicio: {layout.wastePercentage.toFixed(1)}%
            </Text>

            <View style={styles.svgWrapper}>
              <Svg
                width={Math.min(layout.width * scale, 350)}
                height={Math.min(layout.height * scale, 500)}
                viewBox={`0 0 ${layout.width} ${layout.height}`}
                style={styles.svg}
              >
                <Rect
                  x="0"
                  y="0"
                  width={layout.width}
                  height={layout.height}
                  fill="#f0f0f0"
                  stroke="#333"
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
                        stroke="#333"
                        strokeWidth="1"
                        opacity="0.7"
                      />

                      <SvgText
                        x={cut.x + cut.width / 2}
                        y={cut.y + cut.height / 2 + 5}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#000"
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
              <Text style={styles.cutsListTitle}>Cortes en este material:</Text>
              {layout.placedCuts.map((cut, idx) => (
                <Text key={idx} style={styles.cutListItem}>
                  • {cut.width}×{cut.height}mm
                </Text>
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
    padding: 16,
    backgroundColor: '#fff',
  },
  emptyContainer: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  layoutContainer: {
    marginBottom: 24,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  layoutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  layoutInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  svgWrapper: {
    alignItems: 'center',
    marginBottom: 12,
  },
  svg: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  cutsList: {
    backgroundColor: 'white',
    borderRadius: 4,
    padding: 8,
  },
  cutsListTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  cutListItem: {
    fontSize: 11,
    color: '#666',
    paddingVertical: 2,
  },
});