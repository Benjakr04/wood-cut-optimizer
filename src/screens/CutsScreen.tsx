//CutsScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppState } from '../context/AppStateContext';
import { Cut } from '../algorithm/packing';
import { FormField } from '../components/FormField';
import { ListItemCard } from '../components/ListItemCard';
import { EmptyState } from '../components/EmptyState';
import { colorForPiece } from '../utils/pieceColor';
import { colors, spacing, radius, shadow } from '../theme/theme';

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
}

const emptyDraft = (): DraftState => ({ width: '', height: '', quantity: '1', name: '', grainSensitive: false });

export const CutsScreen: React.FC = () => {
  const { cuts, addCut, updateCut, removeCut } = useAppState();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState>(emptyDraft());
  const [formOpen, setFormOpen] = useState(false);

  const startAdd = () => {
    setEditingId(null);
    setDraft(emptyDraft());
    setFormOpen(true);
  };

  const startEdit = (cut: Cut) => {
    setEditingId(cut.id);
    setDraft({
      width: String(cut.width),
      height: String(cut.height),
      quantity: String(cut.quantity),
      name: cut.name || '',
      grainSensitive: !!cut.grainSensitive,
    });
    setFormOpen(true);
  };

  const cancelForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setDraft(emptyDraft());
  };

  const saveDraft = () => {
    if (!draft.width || !draft.height || !draft.quantity) return;
    const payload: Cut = {
      id: editingId || Date.now().toString(),
      width: parseFloat(draft.width),
      height: parseFloat(draft.height),
      quantity: parseInt(draft.quantity, 10) || 1,
      name: draft.name || letterName(cuts.length),
      grainSensitive: draft.grainSensitive,
    };
    if (editingId) {
      updateCut(editingId, payload);
    } else {
      addCut(payload);
    }
    cancelForm();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Cortes</Text>
          <Text style={styles.headerSubtitle}>Las piezas que necesitás sacar de tus placas</Text>
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
            <Text style={styles.formTitle}>{editingId ? 'Editar pieza' : 'Nueva pieza'}</Text>
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
                <Text style={styles.saveBtnText}>{editingId ? 'Guardar cambios' : 'Agregar pieza'}</Text>
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

        {cuts.map((cut) => (
          <ListItemCard
            key={cut.id}
            color={colorForPiece(cut.name || '', cut.width, cut.height)}
            title={cut.name || 'Corte'}
            badges={[
              { icon: 'resize-outline', text: `${cut.width}×${cut.height}mm` },
              { icon: undefined, text: `×${cut.quantity}`, tone: 'accent' },
              ...(cut.grainSensitive ? [{ icon: 'git-commit-outline' as const, text: 'Sigue la veta' }] : []),
            ]}
            onEdit={() => startEdit(cut)}
            onRemove={() => removeCut(cut.id)}
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
  row: { flexDirection: 'row', gap: spacing.sm },

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
});