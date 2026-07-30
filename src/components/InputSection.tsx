import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Cut, Material } from '../algorithm/packing';

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
      {/* CORTES */}
      <View style={styles.section}>
        <Text style={styles.title}>Cortes Necesarios</Text>

        {cuts.length === 0 && (
          <Text style={styles.emptyText}>Todavía no agregaste ningún corte</Text>
        )}

        {cuts.map((cut) =>
          editingCutId === cut.id ? (
            <View key={cut.id} style={styles.editBox}>
              <TextInput
                placeholder="Ancho (mm)"
                value={editCutWidth}
                onChangeText={setEditCutWidth}
                keyboardType="decimal-pad"
                style={styles.input}
              />
              <TextInput
                placeholder="Alto (mm)"
                value={editCutHeight}
                onChangeText={setEditCutHeight}
                keyboardType="decimal-pad"
                style={styles.input}
              />
              <TextInput
                placeholder="Cantidad"
                value={editCutQty}
                onChangeText={setEditCutQty}
                keyboardType="number-pad"
                style={styles.input}
              />
              <TextInput
                placeholder="Nombre"
                value={editCutName}
                onChangeText={setEditCutName}
                style={styles.input}
              />
              <View style={styles.editButtonsRow}>
                <TouchableOpacity onPress={saveEditCut} style={styles.saveBtn}>
                  <Text style={styles.saveBtnText}>Guardar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditingCutId(null)} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View key={cut.id} style={styles.item}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemText}>{cut.name}</Text>
                <Text style={styles.itemSubtext}>
                  {cut.width}x{cut.height}mm × {cut.quantity}u
                </Text>
              </View>
              <View style={styles.itemActions}>
                <TouchableOpacity onPress={() => startEditCut(cut)} style={styles.editBtn}>
                  <Text style={styles.editBtnText}>✎</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeCut(cut.id)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        )}

        <View style={styles.inputGroup}>
          <TextInput
            placeholder="Ancho (mm)"
            value={newCutWidth}
            onChangeText={setNewCutWidth}
            keyboardType="decimal-pad"
            style={styles.input}
          />
          <TextInput
            placeholder="Alto (mm)"
            value={newCutHeight}
            onChangeText={setNewCutHeight}
            keyboardType="decimal-pad"
            style={styles.input}
          />
          <TextInput
            placeholder="Cantidad"
            value={newCutQty}
            onChangeText={setNewCutQty}
            keyboardType="number-pad"
            style={styles.input}
          />
          <TextInput
            placeholder="Nombre (opcional)"
            value={newCutName}
            onChangeText={setNewCutName}
            style={styles.input}
          />
          <TouchableOpacity onPress={addCut} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Agregar Corte</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MATERIALES */}
      <View style={styles.section}>
        <Text style={styles.title}>Materiales Disponibles</Text>

        {materials.length === 0 && (
          <Text style={styles.emptyText}>Todavía no agregaste ningún material</Text>
        )}

        {materials.map((mat) =>
          editingMatId === mat.id ? (
            <View key={mat.id} style={styles.editBox}>
              <TextInput
                placeholder="Ancho (mm)"
                value={editMatWidth}
                onChangeText={setEditMatWidth}
                keyboardType="decimal-pad"
                style={styles.input}
              />
              <TextInput
                placeholder="Alto (mm)"
                value={editMatHeight}
                onChangeText={setEditMatHeight}
                keyboardType="decimal-pad"
                style={styles.input}
              />
              <TextInput
                placeholder="Cantidad"
                value={editMatQty}
                onChangeText={setEditMatQty}
                keyboardType="number-pad"
                style={styles.input}
              />
              <TextInput
                placeholder="Nombre"
                value={editMatName}
                onChangeText={setEditMatName}
                style={styles.input}
              />
              <View style={styles.editButtonsRow}>
                <TouchableOpacity onPress={saveEditMaterial} style={styles.saveBtn}>
                  <Text style={styles.saveBtnText}>Guardar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditingMatId(null)} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View key={mat.id} style={styles.item}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemText}>{mat.name}</Text>
                <Text style={styles.itemSubtext}>
                  {mat.width}x{mat.height}mm × {mat.quantity}u
                </Text>
              </View>
              <View style={styles.itemActions}>
                <TouchableOpacity onPress={() => startEditMaterial(mat)} style={styles.editBtn}>
                  <Text style={styles.editBtnText}>✎</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeMaterial(mat.id)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        )}

        <View style={styles.inputGroup}>
          <TextInput
            placeholder="Ancho (mm)"
            value={newMatWidth}
            onChangeText={setNewMatWidth}
            keyboardType="decimal-pad"
            style={styles.input}
          />
          <TextInput
            placeholder="Alto (mm)"
            value={newMatHeight}
            onChangeText={setNewMatHeight}
            keyboardType="decimal-pad"
            style={styles.input}
          />
          <TextInput
            placeholder="Cantidad"
            value={newMatQty}
            onChangeText={setNewMatQty}
            keyboardType="number-pad"
            style={styles.input}
          />
          <TextInput
            placeholder="Nombre (opcional)"
            value={newMatName}
            onChangeText={setNewMatName}
            style={styles.input}
          />
          <TouchableOpacity onPress={addMaterial} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Agregar Material</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  itemSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtnText: {
    color: 'white',
    fontSize: 14,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  editBox: {
    backgroundColor: '#eef6fc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  editButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#27ae60',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#95a5a6',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  inputGroup: {
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  addBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  addBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});