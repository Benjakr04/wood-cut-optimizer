//src/screens/ResultsScreen.tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAppState } from '../context/AppStateContext';
import { CuttingVisualization } from '../components/CuttingVisualization';
import { EmptyState } from '../components/EmptyState';
import { colors, spacing, radius, shadow, gradients } from '../theme/theme';
import type { RootTabParamList } from '../navigation/RootNavigator';

export const ResultsScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const { result, runOptimization, cuts, materials } = useAppState();

  if (!result) {
    return (
      <ScreenContainer style={styles.container}>
        <View style={styles.centeredContent}>
          <EmptyState
            icon="stats-chart-outline"
            title="Todavía no optimizaste ningún corte"
            hint='Cargá tus piezas y placas, y volvé a "Inicio" para tocar "Optimizar Cortes".'
          />
          <TouchableOpacity style={styles.goHomeBtn} onPress={() => navigation.navigate('Inicio')} activeOpacity={0.85}>
            <Ionicons name="home-outline" size={16} color="#fff" />
            <Text style={styles.goHomeBtnText}>Ir a Inicio</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const utilization = Math.max(0, 100 - result.totalWaste);
  const canReoptimize = cuts.length > 0 && materials.length > 0;

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={gradients.darkCard} style={styles.resultHeader}>
          <View style={styles.resultTitleRow}>
            <Ionicons name="stats-chart" size={18} color={colors.textOnDark} />
            <Text style={styles.resultTitle}>Resultado de la Optimización</Text>
          </View>

          <View style={styles.statsRow}>
            <StatCard icon="cut-outline" label="Cortes" value={`${result.cutsPlaced}/${result.cutsNeeded}`} />
            <StatCard icon="layers-outline" label="Materiales" value={`${result.materialsNeeded}/${result.materialsAvailable}`} />
            <StatCard icon="alert-circle-outline" label="Desperdicio" value={`${result.totalWaste.toFixed(1)}%`} />
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

          {canReoptimize && (
            <TouchableOpacity style={styles.reoptimizeBtn} onPress={runOptimization} activeOpacity={0.85}>
              <Ionicons name="refresh" size={14} color={colors.textOnDark} />
              <Text style={styles.reoptimizeBtnText}>Re-optimizar</Text>
            </TouchableOpacity>
          )}
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
      </ScrollView>
    </ScreenContainer>
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
  container: { flex: 1, backgroundColor: colors.background },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  goHomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    ...shadow.raised,
  },
  goHomeBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  resultHeader: { paddingVertical: spacing.lg, paddingHorizontal: spacing.lg },
  resultTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  resultTitle: { fontSize: 17, fontWeight: '700', color: colors.textOnDark },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: colors.darkAlt,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { fontSize: 15, fontWeight: '800', color: colors.textOnDark },
  statLabel: { fontSize: 10, color: colors.textOnDarkMuted, fontWeight: '600' },

  utilizationBlock: { marginTop: spacing.lg },
  utilizationLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  utilizationLabel: { fontSize: 11, color: colors.textOnDarkMuted, fontWeight: '600' },
  utilizationValue: { fontSize: 12, color: colors.textOnDark, fontWeight: '800' },
  progressTrack: { height: 8, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.primary },

  reoptimizeBtn: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.lg,
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  reoptimizeBtnText: { color: colors.textOnDark, fontWeight: '700', fontSize: 12 },

  warningsBox: {
    backgroundColor: colors.dangerLight,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  warningRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  warningText: { flex: 1, fontSize: 12, color: colors.danger, fontWeight: '600' },
});