import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
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

  const scale = 0.3; // Escala para que quepa en pantalla

  return (
    <ScrollView style={styles.container}>
      {layouts.map((layout, layoutIndex) => (
        <View key={layout.materialId} style={styles.layoutContainer}>
          <Text style={styles.layoutTitle}>
            Material {layoutIndex + 1}: {layout.name || layout.materialId}
          </Text>

          <Text style={styles.layoutInfo}>
            Dimensiones: {layout.width}×{layout.height}mm | Desperdicio: {layout.wastePercentage.toFixed(1)}%
          </Text>

          <Svg
            width={layout.width * scale}
            height={layout.height * scale}
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            style={styles.svg}
          >
            {/* Material background */}
            <Rect
              x="0"
              y="0"
              width={layout.width}
              height={layout.height}
              fill="#f0f0f0"
              stroke="#333"
              strokeWidth="2"
            />

            {/* Cortes */}
            {layout.placedCuts.map((cut, cutIndex) => {
              const color = COLORS[cutIndex % COLORS.length];
              return (
                <g key={`${layout.materialId}-${cutIndex}`}>
                  {/* Rectángulo del corte */}
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

                  {/* Texto con dimensiones */}
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

          {/* Lista de cortes en este material */}
          <View style={styles.cutsList}>
            <Text style={styles.cutsListTitle}>Cortes en este material:</Text>
            {layout.placedCuts.map((cut, idx) => (
              <Text key={idx} style={styles.cutListItem}>
                • {cut.width}×{cut.height}mm
              </Text>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
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
  svg: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginBottom: 12,
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