//src/screens/HomeScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAppState } from '../context/AppStateContext';
import { colors, spacing, radius, shadow, gradients } from '../theme/theme';
import type { RootTabParamList } from '../navigation/RootNavigator';

const KERF_OPTIONS = [1, 2, 3, 4, 5];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const { cuts, materials, kerf, setKerf, runOptimization, resetAll } = useAppState();

  const totalPieces = cuts.reduce((sum, c) => sum + c.quantity, 0);
  const totalSheets = materials.reduce((sum, m) => sum + m.quantity, 0);

  const handleOptimize = () => {
    if (cuts.length === 0) {
      Alert.alert('Faltan cortes', 'Agregá al menos una pieza para cortar en la pestaña "Cortes".');
      return;
    }
    if (materials.length === 0) {
      Alert.alert('Falta inventario', 'Agregá al menos una placa disponible en la pestaña "Inventario".');
      return;
    }
    const optimizationResult = runOptimization();
    navigation.navigate('Resultados');
    if (!optimizationResult.success) {
      // Aviso suave; el detalle completo ya se muestra en la pantalla de Resultados
      setTimeout(() => {
        Alert.alert(
          'Optimización parcial',
          `Se colocaron ${optimizationResult.cutsPlaced} de ${optimizationResult.cutsNeeded} cortes. Revisá los avisos en Resultados.`
        );
      }, 300);
    }
  };

  const handleReset = () => {
    Alert.alert('Limpiar todo', '¿Borrar todos los cortes, el inventario y el resultado?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: resetAll },
    ]);
  };

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={gradients.header} style={styles.header}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="cut" size={26} color={colors.primary} />
          </View>
          <Text style={styles.title}>Wood Cut Optimizer</Text>
          <Text style={styles.subtitle}>Sacale el máximo provecho a cada placa</Text>
        </LinearGradient>

        {/* RESUMEN RÁPIDO */}
        <View style={styles.summaryRow}>
          <SummaryCard
            icon="cut-outline"
            label="Piezas a cortar"
            value={String(totalPieces)}
            onPress={() => navigation.navigate('Cortes')}
          />
          <SummaryCard
            icon="layers-outline"
            label="Placas en inventario"
            value={String(totalSheets)}
            onPress={() => navigation.navigate('Inventario')}
          />
        </View>

        {(cuts.length === 0 || materials.length === 0) && (
          <View style={styles.tipCard}>
            <Ionicons name="bulb-outline" size={18} color={colors.primaryDark} />
            <Text style={styles.tipText}>
              {cuts.length === 0 && materials.length === 0
                ? 'Para arrancar: cargá las piezas que necesitás en "Cortes" y las placas que tenés en "Inventario".'
                : cuts.length === 0
                ? 'Te falta cargar las piezas que necesitás cortar en la pestaña "Cortes".'
                : 'Te falta cargar las placas disponibles en la pestaña "Inventario".'}
            </Text>
          </View>
        )}

        {/* KERF */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="options-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Pérdida por corte (kerf)</Text>
              <Text style={styles.cardSubtitle}>Grosor de la sierra que se pierde en cada corte</Text>
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

        {/* CÓMO FUNCIONA */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Cómo funciona</Text>
          </View>
          <Step number={1} text='Cargá tus piezas en "Cortes" (ancho, alto y cantidad).' />
          <Step number={2} text='Cargá tus placas en "Inventario" (tamaño, cantidad y veta si importa).' />
          <Step number={3} text='Tocá "Optimizar" y mirá el plano y los pasos de corte en "Resultados".' />
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity onPress={handleOptimize} activeOpacity={0.88}>
            <LinearGradient colors={gradients.primaryButton} style={styles.optimizeBtn}>
              <Ionicons name="flash" size={18} color="#fff" />
              <Text style={styles.optimizeBtnText}>Optimizar Cortes</Text>
            </LinearGradient>
          </TouchableOpacity>

          {(cuts.length > 0 || materials.length > 0) && (
            <TouchableOpacity onPress={handleReset} style={styles.resetBtn} activeOpacity={0.85}>
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
              <Text style={styles.resetBtnText}>Limpiar Todo</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const SummaryCard: React.FC<{ icon: any; label: string; value: string; onPress: () => void }> = ({
  icon,
  label,
  value,
  onPress,
}) => (
  <TouchableOpacity style={styles.summaryCard} onPress={onPress} activeOpacity={0.85}>
    <Ionicons name={icon} size={18} color={colors.primaryDark} />
    <Text style={styles.summaryValue}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </TouchableOpacity>
);

const Step: React.FC<{ number: number; text: string }> = ({ number, text }) => (
  <View style={styles.stepRow}>
    <View style={styles.stepNumber}>
      <Text style={styles.stepNumberText}>{number}</Text>
    </View>
    <Text style={styles.stepText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
  title: { fontSize: 22, fontWeight: '800', color: colors.textOnDark, marginBottom: 4 },
  subtitle: { fontSize: 13, color: colors.textOnDarkMuted },

  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
    ...shadow.card,
  },
  summaryValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  summaryLabel: { fontSize: 11, color: colors.textMuted, textAlign: 'center', fontWeight: '600' },

  tipCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: colors.primaryLight,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  tipText: { flex: 1, fontSize: 12, color: colors.primaryDark, fontWeight: '600', lineHeight: 17 },

  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  cardHeader: {
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
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  cardSubtitle: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  kerfOptions: { flexDirection: 'row', gap: spacing.sm },
  kerfPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  kerfPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  kerfPillText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  kerfPillTextActive: { color: '#fff' },

  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: { fontSize: 11, fontWeight: '800', color: colors.primaryDark },
  stepText: { flex: 1, fontSize: 12.5, color: colors.text, lineHeight: 18, paddingTop: 2 },

  buttonsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
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
  optimizeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
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
  resetBtnText: { color: colors.danger, fontSize: 13, fontWeight: '700' },
});