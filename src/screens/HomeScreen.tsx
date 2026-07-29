import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Cut, Material, optimizeCuts, OptimizationResult } from '../algorithm/packing';
import { InputSection } from '../components/InputSection';
import { CuttingVisualization } from '../components/CuttingVisualization';

export const HomeScreen: React.FC = () => {
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [showVisualization, setShowVisualization] = useState(false);

  const handleOptimize = () => {
    if (cuts.length === 0) {
      Alert.alert('Error', 'Debes agregar al menos un corte');
      return;
    }

    if (materials.length === 0) {
      Alert.alert('Error', 'Debes agregar al menos un material');
      return;
    }

    const optimizationResult = optimizeCuts(cuts, materials);
    setResult(optimizationResult);
    setShowVisualization(true);

    if (optimizationResult.success) {
      Alert.alert(
        'Optimización Exitosa',
        `Se pueden hacer todos los cortes.\nMateriales necesarios: ${optimizationResult.materialsNeeded}\nCortes colocados: ${optimizationResult.cutsPlaced}/${optimizationResult.cutsNeeded}`
      );
    } else {
      Alert.alert(
        'Optimización Parcial',
        `Solo se pudieron colocar ${optimizationResult.cutsPlaced}/${optimizationResult.cutsNeeded} cortes.\nNecesitas más material.`
      );
    }
  };

  const handleReset = () => {
    setCuts([]);
    setMaterials([]);
    setResult(null);
    setShowVisualization(false);
  };

  return (
    <View style={styles.container}>
      {!showVisualization ? (
        <ScrollView style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>🪵 Wood Cut Optimizer</Text>
            <Text style={styles.subtitle}>Optimiza tus cortes de madera</Text>
          </View>

          <InputSection onCutsChange={setCuts} onMaterialsChange={setMaterials} />

          <View style={styles.buttonsContainer}>
            <TouchableOpacity onPress={handleOptimize} style={styles.optimizeBtn}>
              <Text style={styles.optimizeBtnText}>Optimizar Cortes</Text>
            </TouchableOpacity>

            {(cuts.length > 0 || materials.length > 0) && (
              <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
                <Text style={styles.resetBtnText}>Limpiar Todo</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.resultContainer}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>Resultado de la Optimización</Text>
            {result && (
              <>
                <Text style={styles.resultStat}>
                  Cortes colocados: {result.cutsPlaced}/{result.cutsNeeded}
                </Text>
                <Text style={styles.resultStat}>
                  Materiales utilizados: {result.materialsNeeded}/{result.materialsAvailable}
                </Text>
                <Text style={styles.resultStat}>
                  Desperdicio total: {result.totalWaste.toFixed(1)}%
                </Text>
              </>
            )}
          </View>

          {result && <CuttingVisualization layouts={result.layouts} />}

          <View style={styles.resultButtons}>
            <TouchableOpacity onPress={() => setShowVisualization(false)} style={styles.backBtn}>
              <Text style={styles.backBtnText}>Atrás</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
              <Text style={styles.resetBtnText}>Nuevo Proyecto</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: '#2c3e50',
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#bdc3c7',
  },
  buttonsContainer: {
    padding: 16,
    gap: 12,
  },
  optimizeBtn: {
    backgroundColor: '#27ae60',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  optimizeBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetBtn: {
    backgroundColor: '#e74c3c',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    flex: 1,
  },
  resultHeader: {
    backgroundColor: '#2c3e50',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  resultStat: {
    color: '#bdc3c7',
    fontSize: 14,
    marginVertical: 4,
  },
  resultButtons: {
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  backBtn: {
    flex: 1,
    backgroundColor: '#3498db',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  backBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
});