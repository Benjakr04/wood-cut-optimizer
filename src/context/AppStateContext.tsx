//AppStateContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cut, Material, OptimizationResult, optimizeCuts } from '../algorithm/packing';

const STORAGE_KEY = 'wood-cut-optimizer:v1';

interface PersistedState {
  cuts: Cut[];
  materials: Material[];
  kerf: number;
}

interface AppState extends PersistedState {
  result: OptimizationResult | null;
  hydrated: boolean;
  addCut: (cut: Cut) => void;
  updateCut: (id: string, cut: Partial<Cut>) => void;
  removeCut: (id: string) => void;
  addMaterial: (material: Material) => void;
  updateMaterial: (id: string, material: Partial<Material>) => void;
  removeMaterial: (id: string) => void;
  setKerf: (kerf: number) => void;
  runOptimization: () => OptimizationResult;
  resetAll: () => void;
}

const AppStateContext = createContext<AppState | null>(null);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [kerf, setKerfState] = useState<number>(3);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const skipNextSave = useRef(true);

  // Cargar lo guardado al abrir la app
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: PersistedState = JSON.parse(raw);
          setCuts(parsed.cuts || []);
          setMaterials(parsed.materials || []);
          setKerfState(parsed.kerf ?? 3);
        }
      } catch {
        // si falla la lectura, arrancamos con estado vacío sin romper la app
      } finally {
        skipNextSave.current = true;
        setHydrated(true);
      }
    })();
  }, []);

  // Guardar cada vez que cambia algo (salvo el primer render post-hidratación)
  useEffect(() => {
    if (!hydrated) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    const payload: PersistedState = { cuts, materials, kerf };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => {});
  }, [cuts, materials, kerf, hydrated]);

  const addCut = (cut: Cut) => setCuts((prev) => [...prev, cut]);
  const updateCut = (id: string, patch: Partial<Cut>) =>
    setCuts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const removeCut = (id: string) => setCuts((prev) => prev.filter((c) => c.id !== id));

  const addMaterial = (material: Material) => setMaterials((prev) => [...prev, material]);
  const updateMaterial = (id: string, patch: Partial<Material>) =>
    setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const removeMaterial = (id: string) => setMaterials((prev) => prev.filter((m) => m.id !== id));

  const setKerf = (value: number) => setKerfState(value);

  const runOptimization = () => {
    const optimizationResult = optimizeCuts(cuts, materials, kerf);
    setResult(optimizationResult);
    return optimizationResult;
  };

  const resetAll = () => {
    setCuts([]);
    setMaterials([]);
    setResult(null);
  };

  return (
    <AppStateContext.Provider
      value={{
        cuts,
        materials,
        kerf,
        result,
        hydrated,
        addCut,
        updateCut,
        removeCut,
        addMaterial,
        updateMaterial,
        removeMaterial,
        setKerf,
        runOptimization,
        resetAll,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState debe usarse dentro de <AppStateProvider>');
  return ctx;
}