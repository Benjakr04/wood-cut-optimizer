//src/screens/CutsScreen.tsx
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/ScreenContainer';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAppState } from '../context/AppStateContext';
import { Cut, Unit } from '../algorithm/packing';
import { FormField } from '../components/FormField';
import { ListItemCard } from '../components/ListItemCard';
import { EmptyState } from '../components/EmptyState';
import { UnitSelector } from '../components/UnitSelector';
import { colorForPiece } from '../utils/pieceColor';
import { toMm, formatMm, formatSize, unitSymbol } from '../utils/unitConversion';
import { parseDecimal } from '../utils/number';
import { colors, spacing, radius, shadow } from '../theme/theme';
import type { RootTabParamList } from '../navigation/RootNavigator';

const letterName = (index: number): string => {
  let n = index;
  let result = '';
  do {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return result;
};

interface DraftState {
  width: string;
  height: string;
  quantity: string;
  name: string;
  grainSensitive: boolean;
  unit: Unit;
}

const emptyDraft = (): DraftState => ({
  width: '',
  height: '',
  quantity: '1',
  name: '',
  grainSensitive: false,
  unit: 'mm',
});

export const CutsScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const { cuts, materials, addCut, updateCut, removeCut, runOptimization } = useAppState();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState>(emptyDraft());
  const [formOpen, setFormOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const openForm = () => {
    setFormOpen(true);
    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 60);
  };

  const startAdd = () => {
    setEditingId(null);
    setDraft(emptyDraft());
    openForm();
  };

  const startEdit = (cut: Cut) => {
    const unit = cut.unit || 'mm';
    setEditingId(cut.id);
    setDraft({
      width: formatMm(cut.width, unit),
      height: formatMm(cut.height, unit),
      quantity: String(cut.quantity),
      name: cut.name || '',
      grainSensitive: !!cut.grainSensitive,
      unit,
    });
    openForm();
  };

  const cancelForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setDraft(emptyDraft());
  };

  const saveDraft = () => {
    const w = parseDecimal(draft.width);
    const h = parseDecimal(draft.height);
    const q = parseInt(draft.quantity, 10);
    if (!Number.isFinite(w) || w <= 0 || !Number.isFinite(h) || h <= 0) {
      Alert.alert('Medidas inválidas', 'Poné el ancho y el alto. Podés usar decimales: 60,5 o 60.5');
      return;
    }
    const payload: Cut = {
      id: editingId || Date.now().toString(),
      width: toMm(w, draft.unit),
      height: toMm(h, draft.unit),
      quantity: q > 0 ? q : 1,
      name: draft.name || letterName(cuts.length),
      grainSensitive: draft.grainSensitive,
      unit: draft.unit,
    };
    if (editingId) updateCut(editingId, payload);
    else addCut(payload);
    cancelForm();
  };

  const totalPieces = cuts.reduce((sum, c) => sum + c.quantity, 0);

  const handleOptimize = () => {
    if (materials.length === 0) {
      Alert.alert('Falta inventario', 'Agregá al menos una placa en la pestaña "Inventario".');
      return;
    }
    runOptimization();
    navigation.navigate('Resultados');
  };

  return (
    <ScreenContainer style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Cortes</Text>
            <Text style={styles.headerSubtitle}>Las piezas que necesitás sacar de tus placas</Text>
          </View>
          {!formOpen && (
            <TouchableOpacity style={styles.addBtn} onPress={startAdd} activeOpacity={0.85}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {formOpen && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{editingId ? 'Editar pieza' : 'Nueva pieza'}</Text>
              <Text style={styles.unitLabel}>Unidad de medida</Text>
              <UnitSelector value={draft.unit} onChange={(u) => setDraft((d) => ({ ...d, unit: u }))} />

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="Ancho"
                    value={draft.width}
                    onChangeText={(v) => setDraft((d) => ({ ...d, width: v }))}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    suffix={unitSymbol(draft.unit)}
                    decimal
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="Alto"
                    value={draft.height}
                    onChangeText={(v) => setDraft((d) => ({ ...d, height: v }))}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    suffix={unitSymbol(draft.unit)}
                    decimal
                  />
                </View>
                <View style={{ width: 78 }}>
                  <FormField
                    label="Cant."
                    value={draft.quantity}
                    onChangeText={(v) => setDraft((d) => ({ ...d, quantity: v }))}
                    keyboardType="number-pad"
                    placeholder="1"
                    integer
                  />
                </View>
              </View>
              <Text style={styles.decimalHint}>
                Podés usar decimales con coma o punto: 60,5 · 1.62
              </Text>

              <FormField
                label="Nombre (opcional)"
                value={draft.name}
                onChangeText={(v) => setDraft((d) => ({ ...d, name: v }))}
                placeholder={`Ej: ${letterName(cuts.length)}`}
              />

              <View style={styles.grainRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.grainLabel}>Esta pieza sigue la veta</Text>
                  <Text style={styles.grainHint}>
                    El lado "Alto" va a quedar siempre paralelo a la veta de la placa donde se corte.
                  </Text>
                </View>
                <Switch
                  value={draft.grainSensitive}
                  onValueChange={(v) => setDraft((d) => ({ ...d, grainSensitive: v }))}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={draft.grainSensitive ? colors.primary : '#fff'}
                />
              </View>

              <View style={styles.formButtons}>
                <TouchableOpacity style={styles.saveBtn} onPress={saveDraft} activeOpacity={0.85}>
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  <Text style={styles.saveBtnText}>
                    {editingId ? 'Guardar cambios' : 'Agregar pieza'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={cancelForm} activeOpacity={0.85}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {cuts.length === 0 && !formOpen && (
            <EmptyState
              icon="cut-outline"
              title="Todavía no agregaste ninguna pieza"
              hint='Tocá el botón "+" para cargar la primera pieza que necesitás cortar.'
            />
          )}

          {cuts.map((cut) => {
            const unit = cut.unit || 'mm';
            return (
              <ListItemCard
                key={cut.id}
                color={colorForPiece(cut.name || '', cut.width, cut.height)}
                title={cut.name || 'Corte'}
                badges={[
                  { icon: 'resize-outline', text: formatSize(cut.width, cut.height, unit) },
                  { icon: undefined, text: `×${cut.quantity}`, tone: 'accent' },
                  ...(cut.grainSensitive
                    ? [{ icon: 'git-commit-outline' as const, text: 'Sigue la veta' }]
                    : []),
                ]}
                onEdit={() => startEdit(cut)}
                onRemove={() => removeCut(cut.id)}
              />
            );
          })}
        </ScrollView>

        {cuts.length > 0 && (
          <View style={styles.footer}>
            <View style={{ flex: 1 }}>
              <Text style={styles.footerValue}>{totalPieces}</Text>
              <Text style={styles.footerLabel}>
                pieza{totalPieces === 1 ? '' : 's'} · {cuts.length} tipo{cuts.length === 1 ? '' : 's'}
              </Text>
            </View>
            <TouchableOpacity style={styles.footerBtn} onPress={handleOptimize} activeOpacity={0.88}>
              <Ionicons name="flash" size={16} color="#fff" />
              <Text style={styles.footerBtnText}>Optimizar</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  headerSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.raised,
  },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, flexGrow: 1 },

  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  formTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  unitLabel: { fontSize: 11, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  decimalHint: { fontSize: 10.5, color: colors.textMuted, marginBottom: spacing.sm },

  grainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  grainLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
  grainHint: { fontSize: 11, color: colors.textMuted, marginTop: 2, lineHeight: 15 },

  formButtons: { flexDirection: 'row', gap: spacing.sm },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.success,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  cancelBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  footerLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 11,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    ...shadow.raised,
  },
  footerBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});