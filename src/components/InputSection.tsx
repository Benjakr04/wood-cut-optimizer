//InputSection.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Cut, Material } from '../algorithm/packing';
import { colors, spacing, radius, shadow } from '../theme/theme';
import { colorForPiece } from '../utils/pieceColor';

export interface InputSectionProps {
  cuts: Cut[];
  materials: Material[];
  onCutsChange: (cuts: Cut[]) => void;
  onMaterialsChange: (materials: Material[]) => void;
}

type Tab = 'cuts' | 'materials';

const letterName = (index: number): string => {
  let n = index;
  let result = '';
  do {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return result;
};

export const InputSection: React.FC<InputSectionProps> = ({
  cuts,
  materials,
  onCutsChange,
  onMaterialsChange,
}) => {
  const [tab, setTab] = useState<Tab>('cuts');

  const [newCutWidth, setNewCutWidth] = useState('');
  const [newCutHeight, setNewCutHeight] = useState('');
  const [newCutQty, setNewCutQty] = useState('');
  const [newCutName, setNewCutName] = useState('');

  const [newMatWidth, setNewMatWidth] = useState('');
  const [newMatHeight, setNewMatHeight] = useState('');
  const [newMatQty, setNewMatQty] = useState('');
  const [newMatName, setNewMatName] = useState('');

  const [editingCutId, setEditingCutId] = useState<string | null>(null);
  const [editCutWidth, setEditCutWidth] = useState('');
  const [editCutHeight, setEditCutHeight] = useState('');
  const [editCutQty, setEditCutQty] = useState('');
  const [editCutName, setEditCutName] = useState('');

  const [editingMatId, setEditingMatId] = useState<string | null>(null);
  const [editMatWidth, setEditMatWidth] = useState('');
  const [editMatHeight, setEditMatHeight] = useState('');
  const [editMatQty, setEditMatQty] = useState('');
  const [editMatName, setEditMatName] = useState('');

  const addCut = () => {
    if (newCutWidth && newCutHeight && newCutQty) {
      const newCut: Cut = {
        id: Date.now().toString(),
        width: parseFloat(newCutWidth),
        height: parseFloat(newCutHeight),
        quantity: parseInt(newCutQty, 10),
        name: newCutName || letterName(cuts.length),
      };
      onCutsChange([...cuts, newCut]);
      setNewCutWidth('');
      setNewCutHeight('');
      setNewCutQty('');
      setNewCutName('');
    }
  };

  const addMaterial = () => {
    if (newMatWidth && newMatHeight && newMatQty) {
      const newMat: Material = {
        id: Date.now().toString(),
        width: parseFloat(newMatWidth),
        height: parseFloat(newMatHeight),
        quantity: parseInt(newMatQty, 10),
        name: newMatName || `Material ${materials.length + 1}`,
      };
      onMaterialsChange([...materials, newMat]);
      setNewMatWidth('');
      setNewMatHeight('');
      setNewMatQty('');
      setNewMatName('');
    }
  };

  const removeCut = (id: string) => {
    onCutsChange(cuts.filter((c) => c.id !== id));
    if (editingCutId === id) setEditingCutId(null);
  };

  const removeMaterial = (id: string) => {
    onMaterialsChange(materials.filter((m) => m.id !== id));
    if (editingMatId === id) setEditingMatId(null);
  };

  const startEditCut = (cut: Cut) => {
    setEditingCutId(cut.id);
    setEditCutWidth(cut.width.toString());
    setEditCutHeight(cut.height.toString());
    setEditCutQty(cut.quantity.toString());
    setEditCutName(cut.name || '');
  };

  const saveEditCut = () => {
    if (!editingCutId) return;
    const updated = cuts.map((c) =>
      c.id === editingCutId
        ? {
            ...c,
            width: parseFloat(editCutWidth) || c.width,
            height: parseFloat(editCutHeight) || c.height,
            quantity: parseInt(editCutQty, 10) || c.quantity,
            name: editCutName || c.name,
          }
        : c
    );
    onCutsChange(updated);
    setEditingCutId(null);
  };

  const startEditMaterial = (mat: Material) => {
    setEditingMatId(mat.id);
    setEditMatWidth(mat.width.toString());
    setEditMatHeight(mat.height.toString());
    setEditMatQty(mat.quantity.toString());
    setEditMatName(mat.name || '');
  };

  const saveEditMaterial = () => {
    if (!editingMatId) return;
    const updated = materials.map((m) =>
      m.id === editingMatId
        ? {
            ...m,
            width: parseFloat(editMatWidth) || m.width,
            height: parseFloat(editMatHeight) || m.height,
            quantity: parseInt(editMatQty, 10) || m.quantity,
            name: editMatName || m.name,
          }
        : m
    );
    onMaterialsChange(updated);
    setEditingMatId(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TabButton
          icon="cut-outline"
          label="Cortes"
          count={cuts.length}
          active={tab === 'cuts'}
          onPress={() => setTab('cuts')}
        />
        <TabButton
          icon="layers-outline"
          label="Materiales"
          count={materials.length}
          active={tab === 'materials'}
          onPress={() => setTab('materials')}
        />
      </View>

      {tab === 'cuts' ? (
        <View style={styles.section}>
          {cuts.length === 0 && (
            <EmptyState icon="cut-outline" text="Todavía no agregaste ningún corte" />
          )}

          {cuts.map((cut) =>
            editingCutId === cut.id ? (
              <EditBox
                key={cut.id}
                width={editCutWidth}
                height={editCutHeight}
                qty={editCutQty}
                name={editCutName}
                onWidth={setEditCutWidth}
                onHeight={setEditCutHeight}
                onQty={setEditCutQty}
                onName={setEditCutName}
                onSave={saveEditCut}
                onCancel={() => setEditingCutId(null)}
              />
            ) : (
              <ItemCard
                key={cut.id}
                name={cut.name || ''}
                width={cut.width}
                height={cut.height}
                quantity={cut.quantity}
                color={colorForPiece(cut.name || '', cut.width, cut.height)}
                onEdit={() => startEditCut(cut)}
                onRemove={() => removeCut(cut.id)}
              />
            )
          )}

          <AddForm
            width={newCutWidth}
            height={newCutHeight}
            qty={newCutQty}
            name={newCutName}
            onWidth={setNewCutWidth}
            onHeight={setNewCutHeight}
            onQty={setNewCutQty}
            onName={setNewCutName}
            onAdd={addCut}
            label="Agregar Corte"
            namePlaceholder={`Ej: ${letterName(cuts.length)}`}
          />
        </View>
      ) : (
        <View style={styles.section}>
          {materials.length === 0 && (
            <EmptyState icon="cube-outline" text="Todavía no agregaste ningún material" />
          )}

          {materials.map((mat) =>
            editingMatId === mat.id ? (
              <EditBox
                key={mat.id}
                width={editMatWidth}
                height={editMatHeight}
                qty={editMatQty}
                name={editMatName}
                onWidth={setEditMatWidth}
                onHeight={setEditMatHeight}
                onQty={setEditMatQty}
                onName={setEditMatName}
                onSave={saveEditMaterial}
                onCancel={() => setEditingMatId(null)}
              />
            ) : (
              <ItemCard
                key={mat.id}
                name={mat.name || ''}
                width={mat.width}
                height={mat.height}
                quantity={mat.quantity}
                color={colors.primary}
                onEdit={() => startEditMaterial(mat)}
                onRemove={() => removeMaterial(mat.id)}
              />
            )
          )}

          <AddForm
            width={newMatWidth}
            height={newMatHeight}
            qty={newMatQty}
            name={newMatName}
            onWidth={setNewMatWidth}
            onHeight={setNewMatHeight}
            onQty={setNewMatQty}
            onName={setNewMatName}
            onAdd={addMaterial}
            label="Agregar Material"
            namePlaceholder={`Ej: Material ${materials.length + 1}`}
          />
        </View>
      )}
    </View>
  );
};

/* ---------- Subcomponentes internos ---------- */

interface TabButtonProps {
  icon: any;
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ icon, label, count, active, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.tabBtn, active && styles.tabBtnActive]}
    activeOpacity={0.85}
  >
    <Ionicons name={icon} size={16} color={active ? '#fff' : colors.textMuted} />
    <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>{label}</Text>
    {count > 0 && (
      <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
        <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>{count}</Text>
      </View>
    )}
  </TouchableOpacity>
);

const EmptyState: React.FC<{ icon: any; text: string }> = ({ icon, text }) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIconWrap}>
      <Ionicons name={icon} size={26} color={colors.textMuted} />
    </View>
    <Text style={styles.emptyText}>{text}</Text>
  </View>
);

interface ItemCardProps {
  name: string;
  width: number;
  height: number;
  quantity: number;
  color: string;
  onEdit: () => void;
  onRemove: () => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ name, width, height, quantity, color, onEdit, onRemove }) => (
  <View style={styles.itemCard}>
    <View style={[styles.itemColorBar, { backgroundColor: color }]} />
    <View style={styles.itemInfo}>
      <Text style={styles.itemName} numberOfLines={1}>
        {name}
      </Text>
      <View style={styles.itemBadgeRow}>
        <View style={styles.dimBadge}>
          <Ionicons name="resize-outline" size={11} color={colors.textMuted} />
          <Text style={styles.dimBadgeText}>{width}×{height}mm</Text>
        </View>
        <View style={styles.qtyBadge}>
          <Text style={styles.qtyBadgeText}>×{quantity}</Text>
        </View>
      </View>
    </View>
    <View style={styles.itemActions}>
      <TouchableOpacity onPress={onEdit} style={styles.iconBtnEdit} hitSlop={8}>
        <Ionicons name="create-outline" size={16} color={colors.info} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onRemove} style={styles.iconBtnDelete} hitSlop={8}>
        <Ionicons name="trash-outline" size={16} color={colors.danger} />
      </TouchableOpacity>
    </View>
  </View>
);

interface FormFieldsProps {
  width: string;
  height: string;
  qty: string;
  name: string;
  onWidth: (v: string) => void;
  onHeight: (v: string) => void;
  onQty: (v: string) => void;
  onName: (v: string) => void;
  namePlaceholder?: string;
}

const FormFields: React.FC<FormFieldsProps> = ({
  width,
  height,
  qty,
  name,
  onWidth,
  onHeight,
  onQty,
  onName,
  namePlaceholder,
}) => {
  const [focused, setFocused] = useState<string | null>(null);
  return (
    <>
      <View style={styles.row}>
        <View style={styles.rowField}>
          <Text style={styles.fieldLabel}>Ancho (mm)</Text>
          <TextInput
            value={width}
            onChangeText={onWidth}
            keyboardType="decimal-pad"
            style={[styles.input, focused === 'w' && styles.inputFocused]}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            onFocus={() => setFocused('w')}
            onBlur={() => setFocused(null)}
          />
        </View>
        <View style={styles.rowField}>
          <Text style={styles.fieldLabel}>Alto (mm)</Text>
          <TextInput
            value={height}
            onChangeText={onHeight}
            keyboardType="decimal-pad"
            style={[styles.input, focused === 'h' && styles.inputFocused]}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            onFocus={() => setFocused('h')}
            onBlur={() => setFocused(null)}
          />
        </View>
        <View style={styles.rowFieldSmall}>
          <Text style={styles.fieldLabel}>Cant.</Text>
          <TextInput
            value={qty}
            onChangeText={onQty}
            keyboardType="number-pad"
            style={[styles.input, focused === 'q' && styles.inputFocused]}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            onFocus={() => setFocused('q')}
            onBlur={() => setFocused(null)}
          />
        </View>
      </View>
      <Text style={styles.fieldLabel}>Nombre (opcional)</Text>
      <TextInput
        value={name}
        onChangeText={onName}
        style={[styles.input, focused === 'n' && styles.inputFocused]}
        placeholder={namePlaceholder || 'Nombre'}
        placeholderTextColor={colors.textMuted}
        onFocus={() => setFocused('n')}
        onBlur={() => setFocused(null)}
      />
    </>
  );
};

interface AddFormProps extends FormFieldsProps {
  onAdd: () => void;
  label: string;
}

const AddForm: React.FC<AddFormProps> = ({ onAdd, label, ...fieldProps }) => (
  <View style={styles.addFormBox}>
    <View style={styles.addFormHeader}>
      <Ionicons name="add-circle-outline" size={14} color={colors.primaryDark} />
      <Text style={styles.addFormHeaderText}>{label}</Text>
    </View>
    <FormFields {...fieldProps} />
    <TouchableOpacity onPress={onAdd} style={styles.addBtn} activeOpacity={0.85}>
      <Ionicons name="add-circle" size={18} color="#fff" />
      <Text style={styles.addBtnText}>{label}</Text>
    </TouchableOpacity>
  </View>
);

interface EditBoxProps extends FormFieldsProps {
  onSave: () => void;
  onCancel: () => void;
}

const EditBox: React.FC<EditBoxProps> = ({ onSave, onCancel, ...fieldProps }) => (
  <View style={styles.editBox}>
    <View style={styles.editBoxHeader}>
      <Ionicons name="create-outline" size={15} color={colors.info} />
      <Text style={styles.editBoxTitle}>Editando</Text>
    </View>
    <FormFields {...fieldProps} />
    <View style={styles.editButtonsRow}>
      <TouchableOpacity onPress={onSave} style={styles.saveBtn} activeOpacity={0.85}>
        <Ionicons name="checkmark-circle" size={16} color="#fff" />
        <Text style={styles.saveBtnText}>Guardar</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onCancel} style={styles.cancelBtn} activeOpacity={0.85}>
        <Ionicons name="close-circle" size={16} color={colors.textMuted} />
        <Text style={styles.cancelBtnText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  </View>
);

/* ---------- Estilos ---------- */

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.lg,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
    ...shadow.subtle,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  tabBtnTextActive: {
    color: '#fff',
  },
  tabBadge: {
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  tabBadgeTextActive: {
    color: '#fff',
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  itemColorBar: {
    width: 6,
  },
  itemInfo: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingLeft: spacing.md,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  itemBadgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dimBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dimBadgeText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  qtyBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  qtyBadgeText: {
    fontSize: 11,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  iconBtnEdit: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.infoLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnDelete: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowField: {
    flex: 1,
  },
  rowFieldSmall: {
    width: 70,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 4,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  addFormBox: {
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  addFormHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  addBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  editBox: {
    backgroundColor: colors.infoLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.info,
  },
  editBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  editBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.info,
  },
  editButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.success,
    paddingVertical: 11,
    borderRadius: radius.sm,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingVertical: 11,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
});