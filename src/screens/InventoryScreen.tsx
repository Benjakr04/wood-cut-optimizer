//InventoryScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppState } from '../context/AppStateContext';
import { GrainDirection, Material } from '../algorithm/packing';
import { FormField } from '../components/FormField';
import { ListItemCard } from '../components/ListItemCard';
import { EmptyState } from '../components/EmptyState';
import { GrainSelector } from '../components/GrainSelector';
import { colors, spacing, radius, shadow } from '../theme/theme';

const PRESETS: { label: string; width: number; height: number }[] = [
  { label: '1220×2440mm (placa estándar)', width: 1220, height: 2440 },
  { label: '1830×2750mm (placa grande)', width: 1830, height: 2750 },
  { label: '1220×1220mm (resto/cuadrada)', width: 1220, height: 1220 },
];

interface DraftState {
  width: string;
  height: string;
  quantity: string;
  name: string;
  grain: GrainDirection;
}

const emptyDraft = (): DraftState => ({ width: '', height: '', quantity: '1', name: '', grain: 'none' });

const grainLabel = (g: GrainDirection) =>
  g === 'vertical' ? 'Veta vertical' : g === 'horizontal' ? 'Veta horizontal' : 'Sin veta definida';

export const InventoryScreen: React.FC = () => {
  const { materials, addMaterial, updateMaterial, removeMaterial } = useAppState();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState>(emptyDraft());
  const [formOpen, setFormOpen] = useState(false);

  const startAdd = () => {
    setEditingId(null);
    setDraft(emptyDraft());
    setFormOpen(true);
  };

  const startEdit = (mat: Material) => {
    setEditingId(mat.id);
    setDraft({
      width: String(mat.width),
      height: String(mat.height),
      quantity: String(mat.quantity),
      name: mat.name || '',
      grain: mat.grain || 'none',
    });
    setFormOpen(true);
  };

  const cancelForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setDraft(emptyDraft());
  };

  const applyPreset = (preset: { width: number; height: number }) => {
    setDraft((d) => ({ ...d, width: String(preset.width), height: String(preset.height) }));
  };

  const saveDraft = () => {
    if (!draft.width || !draft.height || !draft.quantity) return;
    const payload: Material = {
      id: editingId || Date.now().toString(),
      width: parseFloat(draft.width),
      height: parseFloat(draft.height),
      quantity: parseInt(draft.quantity, 10) || 1,
      name: draft.name || `Placa ${materials.length + 1}`,
      grain: draft.grain,
    };
    if (editingId) {
      updateMaterial(editingId, payload);
    } else {
      addMaterial(payload);
    }
    cancelForm();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Inventario</Text>
          <Text style={styles.headerSubtitle}>Las placas que tenés disponibles</Text>
        </View>
        {!formOpen && (
          <TouchableOpacity style={styles.addBtn} onPress={startAdd} activeOpacity={0.85}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {formOpen && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{editingId ? 'Editar placa' : 'Nueva placa'}</Text>

            <Text style={styles.presetLabel}>Tamaños comunes (opcional)</Text>
            <View style={styles.presetRow}>
              {PRESETS.map((p) => (
                <TouchableOpacity
                  key={p.label}
                  style={styles.presetChip}
                  onPress={() => applyPreset(p)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.presetChipText}>{p.width}×{p.height}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <FormField
                  label="Ancho"
                  value={draft.width}
                  onChangeText={(v) => setDraft((d) => ({ ...d, width: v }))}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  suffix="mm"
                />
              </View>
              <View style={{ flex: 1 }}>
                <FormField
                  label="Alto"
                  value={draft.height}
                  onChangeText={(v) => setDraft((d) => ({ ...d, height: v }))}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  suffix="mm"
                />
              </View>
              <View style={{ width: 78 }}>
                <FormField
                  label="Cant."
                  value={draft.quantity}
                  onChangeText={(v) => setDraft((d) => ({ ...d, quantity: v }))}
                  keyboardType="number-pad"
                  placeholder="1"
                />
              </View>
            </View>
            <FormField
              label="Nombre (opcional)"
              value={draft.name}
              onChangeText={(v) => setDraft((d) => ({ ...d, name: v }))}
              placeholder={`Ej: Placa ${materials.length + 1}`}
            />

            <Text style={styles.grainSectionLabel}>Dirección de la veta</Text>
            <Text style={styles.grainSectionHint}>
              Definí para qué lado corre la veta de esta placa. Las piezas marcadas como "sigue la veta" van a
              respetarla automáticamente.
            </Text>
            <GrainSelector value={draft.grain} onChange={(g) => setDraft((d) => ({ ...d, grain: g }))} />

            <View style={styles.formButtons}>
              <TouchableOpacity style={styles.saveBtn} onPress={saveDraft} activeOpacity={0.85}>
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={styles.saveBtnText}>{editingId ? 'Guardar cambios' : 'Agregar placa'}</Text>
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

        {materials.map((mat) => (
          <ListItemCard
            key={mat.id}
            color={colors.primary}
            title={mat.name || 'Placa'}
            badges={[
              { icon: 'resize-outline', text: `${mat.width}×${mat.height}mm` },
              { icon: undefined, text: `×${mat.quantity}`, tone: 'accent' },
              { icon: 'git-commit-outline', text: grainLabel(mat.grain || 'none') },
            ]}
            onEdit={() => startEdit(mat)}
            onRemove={() => removeMaterial(mat.id)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
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
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },

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

  presetLabel: { fontSize: 11, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md },
  presetChip: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  presetChipText: { fontSize: 11, fontWeight: '700', color: colors.primaryDark },

  row: { flexDirection: 'row', gap: spacing.sm },

  grainSectionLabel: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  grainSectionHint: { fontSize: 11, color: colors.textMuted, marginTop: 2, marginBottom: spacing.sm, lineHeight: 15 },

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
});