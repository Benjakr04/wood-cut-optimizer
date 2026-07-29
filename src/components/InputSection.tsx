import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Cut, Material } from '../algorithm/packing';

export interface InputSectionProps {
  onCutsChange: (cuts: Cut[]) => void;
  onMaterialsChange: (materials: Material[]) => void;
}

export const InputSection: React.FC<InputSectionProps> = ({ onCutsChange, onMaterialsChange }) => {
  const [cuts, setCuts] = useState<Cut[]>([
    { id: '1', width: 80, height: 40, quantity: 5, name: 'Tablilla 1' },
  ]);

  const [materials, setMaterials] = useState<Material[]>([
    { id: 'm1', width: 200, height: 100, quantity: 2, name: 'Tablero 200x100' },
  ]);

  const [newCutWidth, setNewCutWidth] = useState('');
  const [newCutHeight, setNewCutHeight] = useState('');
  const [newCutQty, setNewCutQty] = useState('');
  const [newCutName, setNewCutName] = useState('');

  const [newMatWidth, setNewMatWidth] = useState('');
  const [newMatHeight, setNewMatHeight] = useState('');
  const [newMatQty, setNewMatQty] = useState('');
  const [newMatName, setNewMatName] = useState('');

  const addCut = () => {
    if (newCutWidth && newCutHeight && newCutQty) {
      const newCut: Cut = {
        id: Date.now().toString(),
        width: parseFloat(newCutWidth),
        height: parseFloat(newCutHeight),
        quantity: parseInt(newCutQty),
        name: newCutName || `Corte ${cuts.length + 1}`,
      };
      const updated = [...cuts, newCut];
      setCuts(updated);
      onCutsChange(updated);
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
        quantity: parseInt(newMatQty),
        name: newMatName || `Material ${materials.length + 1}`,
      };
      const updated = [...materials, newMat];
      setMaterials(updated);
      onMaterialsChange(updated);
      setNewMatWidth('');
      setNewMatHeight('');
      setNewMatQty('');
      setNewMatName('');
    }
  };

  const removeCut = (id: string) => {
    const updated = cuts.filter((c) => c.id !== id);
    setCuts(updated);
    onCutsChange(updated);
  };

  const removeMaterial = (id: string) => {
    const updated = materials.filter((m) => m.id !== id);
    setMaterials(updated);
    onMaterialsChange(updated);
  };

  return (
    <ScrollView style={styles.container}>
      {/* CORTES */}
      <View style={styles.section}>
        <Text style={styles.title}>Cortes Necesarios</Text>

        {cuts.map((cut) => (
          <View key={cut.id} style={styles.item}>
            <View>
              <Text style={styles.itemText}>{cut.name}</Text>
              <Text style={styles.itemSubtext}>{cut.width}x{cut.height}mm × {cut.quantity}u</Text>
            </View>
            <TouchableOpacity onPress={() => removeCut(cut.id)} style={styles.removeBtn}>
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

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

        {materials.map((mat) => (
          <View key={mat.id} style={styles.item}>
            <View>
              <Text style={styles.itemText}>{mat.name}</Text>
              <Text style={styles.itemSubtext}>{mat.width}x{mat.height}mm × {mat.quantity}u</Text>
            </View>
            <TouchableOpacity onPress={() => removeMaterial(mat.id)} style={styles.removeBtn}>
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

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
    </ScrollView>
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
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 8,
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