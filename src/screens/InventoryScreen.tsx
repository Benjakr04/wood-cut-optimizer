//src/screens/InventoryScreen.tsx
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/ScreenContainer';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAppState, SavedSheet } from '../context/AppStateContext';
import { GrainDirection, Material, Unit } from '../algorithm/packing';
import { FormField } from '../components/FormField';
import { ListItemCard } from '../components/ListItemCard';
import { EmptyState } from '../components/EmptyState';
import { GrainSelector } from '../components/GrainSelector';
import { UnitSelector } from '../components/UnitSelector';
import { toMm, formatMm, formatSize, unitSymbol } from '../utils/unitConversion';
import { parseDecimal } from '../utils/number';
import { colors, spacing, radius, shadow } from '../theme/theme';
import type { RootTabParamList } from '../navigation/RootNavigator';

interface DraftState {
  width: string;
  height: string;
  quantity: string;
  name: string;
  grain: GrainDirection;
  unit: Unit;
}

const emptyDraft = (): DraftState => ({
  width: '',
  height: '',
  quantity: '1',
  name: '',
  grain: 'none',
  unit: 'mm',
});

const grainLabel = (g: GrainDirection) =>
  g === 'vertical' ? 'Veta vertical' : g === 'horizontal' ? 'Veta horizontal' : 'Sin veta definida';

export const InventoryScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const {
    materials,
    savedSheets,
    addMaterial,
    updateMaterial,
    removeMaterial,
    addSavedSheet,
    removeSavedSheet,
    cuts,
    runOptimization,
  } = useAppState();

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

  const startEdit = (mat: Material) => {
    const unit = mat.unit || 'mm';
    setEditingId(mat.id);
    setDraft({
      width: formatMm(mat.width, unit),
      height: formatMm(mat.height, unit),
      quantity: String(mat.quantity),
      name: mat.name || '',
      grain: mat.grain || 'none',
      unit,
    });
    openForm();
  };

  const cancelForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setDraft(emptyDraft());
  };

  const readDraft = (): { width: number; height: number; quantity: number } | null => {
    const w = parseDecimal(draft.width);
    const h = parseDecimal(draft.height);
    const q = parseInt(draft.quantity, 10);
    if (!Number.isFinite(w) || w <= 0 || !Number.isFinite(h) || h <= 0) {
      Alert.alert('Medidas inválidas', 'Poné el ancho y el alto. Podés usar decimales: 2,2 o 2.2');
      return null;
    }
    return { width: toMm(w, draft.unit), height: toMm(h, draft.unit), quantity: q > 0 ? q : 1 };
  };

  const saveDraft = () => {
    const parsed = readDraft();
    if (!parsed) return;
    const payload: Material = {
      id: editingId || Date.now().toString(),
      width: parsed.width,
      height: parsed.height,
      quantity: parsed.quantity,
      name: draft.name || `Placa ${materials.length + 1}`,
      grain: draft.grain,
      unit: draft.unit,
    };
    if (editingId) updateMaterial(editingId, payload);
    else addMaterial(payload);
    cancelForm();
  };

  const saveMeasure = () => {
    const parsed = readDraft();
    if (!parsed) return;
    const sheet: SavedSheet = {
      id: `saved-${Date.now()}`,
      name: draft.name || `${formatSize(parsed.width, parsed.height, draft.unit)}`,
      width: parsed.width,
      height: parsed.height,
      unit: draft.unit,
      grain: draft.grain,
    };
    addSavedSheet(sheet);
    Alert.alert('Medida guardada', `Ahora podés cargar ${formatSize(parsed.width, parsed.height, draft.unit)} de un toque.`);
  };

  const applySaved = (sheet: SavedSheet) => {
    setDraft((d) => ({
      ...d,
      width: formatMm(sheet.width, sheet.unit),
      height: formatMm(sheet.height, sheet.unit),
      unit: sheet.unit,
      grain: sheet.grain,
    }));
    if (!formOpen) {
      setEditingId(null);
      openForm();
    }
  };

  const confirmDeleteSaved = (sheet: SavedSheet) =>
    Alert.alert('Borrar medida', `¿Sacar "${sheet.name}" de tus medidas guardadas?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: () => removeSavedSheet(sheet.id) },
    ]);

  const totalSheets = materials.reduce((sum, m) => sum + m.quantity, 0);

  const handleOptimize = () => {
    if (cuts.length === 0) {
      Alert.alert('Faltan cortes', 'Agregá al menos una pieza en la pestaña "Cortes".');
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
            <Text style={styles.headerTitle}>Inventario</Text>
            <Text style={styles.headerSubtitle}>Las placas que tenés disponibles</Text>
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
          {/* MIS MEDIDAS GUARDADAS */}
          <View style={styles.savedCard}>
            <View style={styles.savedHeader}>
              <Ionicons name="bookmark" size={15} color={colors.primaryDark} />
              <Text style={styles.savedTitle}>Mis medidas</Text>
            </View>
            {savedSheets.length === 0 ? (
              <Text style={styles.savedHint}>
                Guardá acá las placas que usás siempre (por ejemplo 2,2 × 1,62 m) y después las
                cargás de un toque. Se guardan con su veta y todo.
              </Text>
            ) : (
              <View style={styles.savedRow}>
                {savedSheets.map((sheet) => (
                  <View key={sheet.id} style={styles.savedChip}>
                    <TouchableOpacity
                      onPress={() => applySaved(sheet)}
                      activeOpacity={0.85}
                      style={styles.savedChipMain}
                    >
                      <Text style={styles.savedChipTitle} numberOfLines={1}>
                        {sheet.name}
                      </Text>
                      <Text style={styles.savedChipDims}>
                        {formatSize(sheet.width, sheet.height, sheet.unit)}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => confirmDeleteSaved(sheet)}
                      hitSlop={8}
                      style={styles.savedChipDelete}
                    >
                      <Ionicons name="close" size={13} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {formOpen && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{editingId ? 'Editar placa' : 'Nueva placa'}</Text>

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
                Podés usar decimales con coma o punto: 2,2 · 1.62
              </Text>

              <FormField
                label="Nombre (opcional)"
                value={draft.name}
                onChangeText={(v) => setDraft((d) => ({ ...d, name: v }))}
                placeholder={`Ej: Placa ${materials.length + 1}`}
              />

              <Text style={styles.grainSectionLabel}>Dirección de la veta</Text>
              <Text style={styles.grainSectionHint}>
                Definí para qué lado corre la veta de esta placa. Las piezas marcadas como "sigue la
                veta" van a respetarla automáticamente.
              </Text>
              <GrainSelector value={draft.grain} onChange={(g) => setDraft((d) => ({ ...d, grain: g }))} />

              <TouchableOpacity style={styles.saveMeasureBtn} onPress={saveMeasure} activeOpacity={0.85}>
                <Ionicons name="bookmark-outline" size={14} color={colors.primaryDark} />
                <Text style={styles.saveMeasureText}>Guardar esta medida en "Mis medidas"</Text>
              </TouchableOpacity>

              <View style={styles.formButtons}>
                <TouchableOpacity style={styles.saveBtn} onPress={saveDraft} activeOpacity={0.85}>
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  <Text style={styles.saveBtnText}>
                    {editingId ? 'Guardar cambios' : 'Agregar placa'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={cancelForm} activeOpacity={0.85}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {materials.length === 0 && !formOpen && (
            <EmptyState
              icon="layers-outline"
              title="Todavía no cargaste ninguna placa"
              hint='Tocá el botón "+" para agregar la primera placa que tenés disponible.'
            />
          )}

          {materials.map((mat) => {
            const unit = mat.unit || 'mm';
            return (
              <ListItemCard
                key={mat.id}
                color={colors.primary}
                title={mat.name || 'Placa'}
                badges={[
                  { icon: 'resize-outline', text: formatSize(mat.width, mat.height, unit) },
                  { icon: undefined, text: `×${mat.quantity}`, tone: 'accent' },
                  { icon: 'git-commit-outline', text: grainLabel(mat.grain || 'none') },
                ]}
                onEdit={() => startEdit(mat)}
                onRemove={() => removeMaterial(mat.id)}
              />
            );
          })}
        </ScrollView>

        {materials.length > 0 && (
          <View style={styles.footer}>
            <View style={{ flex: 1 }}>
              <Text style={styles.footerValue}>{totalSheets}</Text>
              <Text style={styles.footerLabel}>
                placa{totalSheets === 1 ? '' : 's'} · {materials.length} tipo
                {materials.length === 1 ? '' : 's'}
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

  savedCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.subtle,
  },
  savedHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  savedTitle: { fontSize: 12.5, fontWeight: '700', color: colors.text },
  savedHint: { fontSize: 11.5, color: colors.textMuted, lineHeight: 16 },
  savedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  savedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingLeft: 10,
    paddingRight: 4,
    paddingVertical: 6,
    maxWidth: '100%',
  },
  savedChipMain: { maxWidth: 170 },
  savedChipTitle: { fontSize: 11.5, fontWeight: '700', color: colors.text },
  savedChipDims: { fontSize: 10.5, color: colors.primaryDark, fontWeight: '600' },
  savedChipDelete: { paddingHorizontal: 6, paddingVertical: 4 },

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

  grainSectionLabel: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  grainSectionHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.sm,
    lineHeight: 15,
  },

  saveMeasureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },
  saveMeasureText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },

  formButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
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