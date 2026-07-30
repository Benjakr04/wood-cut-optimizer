import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Cut, Material } from '../algorithm/packing';
import { colors, spacing, radius, shadow } from '../theme/theme';

export interface InputSectionProps {
  cuts: Cut[];
  materials: Material[];
  onCutsChange: (cuts: Cut[]) => void;
  onMaterialsChange: (materials: Material[]) => void;
}

export const InputSection: React.FC<InputSectionProps> = ({
  cuts,
  materials,
  onCutsChange,
  onMaterialsChange,
}) => {
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
        name: newCutName || `Corte ${cuts.length + 1}`,
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
      {/* ===== CORTES ===== */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconWrap}>
            <Ionicons name="cut-outline" size={18} color={colors.primary} />
          </View>
          <Text style={styles.title}>Cortes Necesarios</Text>
        </View>

        {cuts.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="cut-outline" size={28} color={colors.textMuted} />
            <Text style={styles.emptyText}>Todavía no agregaste ningún corte</Text>
          </View>
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
        />
      </View>

      {/* ===== MATERIALES ===== */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconWrap}>
            <Ionicons name="layers-outline" size={18} color={colors.primary} />
          </View>
          <Text style={styles.title}>Materiales Disponibles</Text>
        </View>

        {materials.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={28} color={colors.textMuted} />
            <Text style={styles.emptyText}>Todavía no agregaste ningún material</Text>
          </View>
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
        />
      </View>
    </View>
  );
};

/* ---------- Subcomponentes internos ---------- */

interface ItemCardProps {
  name: string;
  width: number;
  height: number;
  quantity: number;
  onEdit: () => void;
  onRemove: () => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ name, width, height, quantity, onEdit, onRemove }) => (
  <View style={styles.itemCard}>
    <View style={styles.itemIconWrap}>
      <Ionicons name="square-outline" size={20} color={colors.primaryDark} />
    </View>
    <View style={styles.itemInfo}>
      <Text style={styles.itemName}>{name}</Text>
      <View style={styles.itemBadgeRow}>
        <View style={styles.dimBadge}>
          <Ionicons name="resize-outline" size={12} color={colors.textMuted} />
          <Text style={styles.dimBadgeText}>{width}×{height}mm</Text>
        </View>
        <View style={styles.qtyBadge}>
          <Text style={styles.qtyBadgeText}>×{quantity}</Text>
        </View>
      </View>
    </View>
    <View style={styles.itemActions}>
      <TouchableOpacity onPress={onEdit} style={styles.iconBtnEdit} hitSlop={8}>
        <Ionicons name="create-outline" size={17} color={colors.info} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onRemove} style={styles.iconBtnDelete} hitSlop={8}>
        <Ionicons name="trash-outline" size={17} color={colors.danger} />
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
}

const FormFields: React.FC<FormFieldsProps> = ({ width, height, qty, name, onWidth, onHeight, onQty, onName }) => (
  <>
    <View style={styles.row}>
      <View style={styles.rowField}>
        <Text style={styles.fieldLabel}>Ancho (mm)</Text>
        <TextInput value={width} onChangeText={onWidth} keyboardType="decimal-pad" style={styles.input} placeholder="0" placeholderTextColor={colors.textMuted} />
      </View>
      <View style={styles.rowField}>
        <Text style={styles.fieldLabel}>Alto (mm)</Text>
        <TextInput value={height} onChangeText={onHeight} keyboardType="decimal-pad" style={styles.input} placeholder="0" placeholderTextColor={colors.textMuted} />
      </View>
      <View style={styles.rowFieldSmall}>
        <Text style={styles.fieldLabel}>Cant.</Text>
        <TextInput value={qty} onChangeText={onQty} keyboardType="number-pad" style={styles.input} placeholder="0" placeholderTextColor={colors.textMuted} />
      </View>
    </View>
    <Text style={styles.fieldLabel}>Nombre (opcional)</Text>
    <TextInput value={name} onChangeText={onName} style={styles.input} placeholder="Ej: Tablilla lateral" placeholderTextColor={colors.textMuted} />
  </>
);

interface AddFormProps extends FormFieldsProps {
  onAdd: () => void;
  label: string;
}

const AddForm: React.FC<AddFormProps> = ({ onAdd, label, ...fieldProps }) => (
  <View style={styles.addFormBox}>
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
  section: {
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  sectionHeader: {
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
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  itemInfo: {
    flex: 1,
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
    gap: spacing.xs,
  },
  iconBtnEdit: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.infoLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnDelete: {
    width: 32,
    height: 32,
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
  addFormBox: {
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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