//HomeScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Cut, Material, optimizeCuts, OptimizationResult } from '../algorithm/packing';
import { InputSection } from '../components/InputSection';
import { CuttingVisualization } from '../components/CuttingVisualization';
import { colors, spacing, radius, shadow, gradients } from '../theme/theme';

const KERF_OPTIONS = [1, 2, 3, 4, 5];

export const HomeScreen: React.FC = () => {
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [kerf, setKerf] = useState<number>(3);
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

    const optimizationResult = optimizeCuts(cuts, materials, kerf);
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

  const utilization = result ? Math.max(0, 100 - result.totalWaste) : 0;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={gradients.header} style={styles.header}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="cut" size={26} color={colors.primary} />
          </View>
          <Text style={styles.title}>Wood Cut Optimizer</Text>
          <Text style={styles.subtitle}>Optimizá tus cortes de madera</Text>
        </LinearGradient>

        {/* KERF */}
        <View style={styles.kerfCard}>
          <View style={styles.kerfHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="options-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.kerfTitle}>Pérdida por corte (kerf)</Text>
              <Text style={styles.kerfSubtitle}>Grosor de la sierra que se pierde en cada corte</Text>
            </View>
          </View>
          <View style={styles.kerfOptions}>
            {KERF_OPTIONS.map((val) => (
              <TouchableOpacity
                key={val}
                onPress={() => setKerf(val)}
                style={[styles.kerfPill, kerf === val && styles.kerfPillActive]}
                activeOpacity={0.85}
              >
                <Text style={[styles.kerfPillText, kerf === val && styles.kerfPillTextActive]}>
                  {val}mm
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <InputSection
          cuts={cuts}
          materials={materials}
          onCutsChange={setCuts}
          onMaterialsChange={setMaterials}
        />

        {/* BOTONES */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity onPress={handleOptimize} activeOpacity={0.88}>
            <LinearGradient colors={gradients.primaryButton} style={styles.optimizeBtn}>
              <Ionicons name={result ? 'refresh' : 'flash'} size={18} color="#fff" />
              <Text style={styles.optimizeBtnText}>
                {result ? 'Re-optimizar' : 'Optimizar Cortes'}
              </Text>
            </LinearGradient>
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
            <LinearGradient colors={gradients.darkCard} style={styles.resultHeader}>
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

              <View style={styles.utilizationBlock}>
                <View style={styles.utilizationLabelRow}>
                  <Text style={styles.utilizationLabel}>Aprovechamiento del material</Text>
                  <Text style={styles.utilizationValue}>{utilization.toFixed(1)}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.min(100, utilization)}%` }]} />
                </View>
              </View>
            </LinearGradient>

            {result.warnings.length > 0 && (
              <View style={styles.warningsBox}>
                {result.warnings.map((w, idx) => (
                  <View key={idx} style={styles.warningRow}>
                    <Ionicons name="warning-outline" size={16} color={colors.danger} />
                    <Text style={styles.warningText}>{w}</Text>
                  </View>
                ))}
              </View>
            )}

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
  kerfCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  kerfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kerfTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  kerfSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  kerfOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  kerfPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  kerfPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  kerfPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  kerfPillTextActive: {
    color: '#fff',
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
  utilizationBlock: {
    marginTop: spacing.lg,
  },
  utilizationLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  utilizationLabel: {
    fontSize: 11,
    color: colors.textOnDarkMuted,
    fontWeight: '600',
  },
  utilizationValue: {
    fontSize: 12,
    color: colors.textOnDark,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  warningsBox: {
    backgroundColor: colors.dangerLight,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: colors.danger,
    fontWeight: '600',
  },
});