import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Cut, Material, optimizeCuts, OptimizationResult } from '../algorithm/packing';
import { InputSection } from '../components/InputSection';
import { CuttingVisualization } from '../components/CuttingVisualization';
import { colors, spacing, radius, shadow } from '../theme/theme';

export const HomeScreen: React.FC = () => {
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [result, setResult] = useState<OptimizationResult | null>(null);

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
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="cut" size={26} color={colors.primary} />
          </View>
          <Text style={styles.title}>Wood Cut Optimizer</Text>
          <Text style={styles.subtitle}>Optimizá tus cortes de madera</Text>
        </View>

        <InputSection
          cuts={cuts}
          materials={materials}
          onCutsChange={setCuts}
          onMaterialsChange={setMaterials}
        />

        {/* BOTONES */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity onPress={handleOptimize} style={styles.optimizeBtn} activeOpacity={0.85}>
            <Ionicons name={result ? 'refresh' : 'flash'} size={18} color="#fff" />
            <Text style={styles.optimizeBtnText}>
              {result ? 'Re-optimizar' : 'Optimizar Cortes'}
            </Text>
          </TouchableOpacity>

          {(cuts.length > 0 || materials.length > 0) && (
            <TouchableOpacity onPress={handleReset} style={styles.resetBtn} activeOpacity={0.85}>
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
              <Text style={styles.resetBtnText}>Limpiar Todo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* RESULTADOS */}
        {result && (
          <View style={styles.resultSection}>
            <View style={styles.resultHeader}>
              <View style={styles.resultTitleRow}>
                <Ionicons name="stats-chart" size={18} color={colors.textOnDark} />
                <Text style={styles.resultTitle}>Resultado de la Optimización</Text>
              </View>

              <View style={styles.statsRow}>
                <StatCard
                  icon="cut-outline"
                  label="Cortes"
                  value={`${result.cutsPlaced}/${result.cutsNeeded}`}
                />
                <StatCard
                  icon="layers-outline"
                  label="Materiales"
                  value={`${result.materialsNeeded}/${result.materialsAvailable}`}
                />
                <StatCard
                  icon="alert-circle-outline"
                  label="Desperdicio"
                  value={`${result.totalWaste.toFixed(1)}%`}
                />
              </View>
            </View>

            <CuttingVisualization layouts={result.layouts} />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const StatCard: React.FC<{ icon: any; label: string; value: string }> = ({ icon, label, value }) => (
  <View style={styles.statCard}>
    <Ionicons name={icon} size={16} color={colors.textOnDarkMuted} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.dark,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textOnDark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textOnDarkMuted,
  },
  buttonsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  optimizeBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: radius.md,
    ...shadow.raised,
  },
  optimizeBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  resetBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetBtnText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  resultSection: {
    marginTop: spacing.sm,
  },
  resultHeader: {
    backgroundColor: colors.dark,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  resultTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textOnDark,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.darkAlt,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textOnDark,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textOnDarkMuted,
    fontWeight: '600',
  },
});