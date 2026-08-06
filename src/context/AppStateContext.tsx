//src/context/AppStateContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Cut,
  GrainDirection,
  Material,
  OptimizationResult,
  Unit,
  optimizeCuts,
} from '../algorithm/packing';

const STORAGE_KEY = 'wood-cut-optimizer:v2';
const LEGACY_KEY = 'wood-cut-optimizer:v1';

/** Medida de placa guardada por el usuario para cargarla de un toque. */
export interface SavedSheet {
  id: string;
  name: string;
  width: number; // mm
  height: number; // mm
  unit: Unit;
  grain: GrainDirection;
}

interface PersistedState {
  cuts: Cut[];
  materials: Material[];
  kerf: number;
  savedSheets: SavedSheet[];
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
  addSavedSheet: (sheet: SavedSheet) => void;
  removeSavedSheet: (id: string) => void;
  setKerf: (kerf: number) => void;
  runOptimization: () => OptimizationResult;
  resetAll: () => void;
}

const AppStateContext = createContext<AppState | null>(null);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [savedSheets, setSavedSheets] = useState<SavedSheet[]>([]);
  const [kerf, setKerfState] = useState<number>(3);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const skipNextSave = useRef(true);

  useEffect(() => {
    (async () => {
      try {
        let raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) raw = await AsyncStorage.getItem(LEGACY_KEY); // migración desde v1
        if (raw) {
          const parsed: Partial<PersistedState> = JSON.parse(raw);
          setCuts(parsed.cuts || []);
          setMaterials(parsed.materials || []);
          setSavedSheets(parsed.savedSheets || []);
          setKerfState(parsed.kerf ?? 3);
        }
      } catch {
        // si falla la lectura, arrancamos vacío sin romper la app
      } finally {
        skipNextSave.current = true;
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    const payload: PersistedState = { cuts, materials, kerf, savedSheets };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => {});
  }, [cuts, materials, kerf, savedSheets, hydrated]);

  const addCut = (cut: Cut) => setCuts((prev) => [...prev, cut]);
  const updateCut = (id: string, patch: Partial<Cut>) =>
    setCuts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const removeCut = (id: string) => setCuts((prev) => prev.filter((c) => c.id !== id));

  const addMaterial = (material: Material) => setMaterials((prev) => [...prev, material]);
  const updateMaterial = (id: string, patch: Partial<Material>) =>
    setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const removeMaterial = (id: string) => setMaterials((prev) => prev.filter((m) => m.id !== id));

  const addSavedSheet = (sheet: SavedSheet) =>
    setSavedSheets((prev) => {
      const duplicated = prev.some(
        (s) => Math.abs(s.width - sheet.width) < 0.5 && Math.abs(s.height - sheet.height) < 0.5
      );
      return duplicated ? prev : [...prev, sheet];
    });
  const removeSavedSheet = (id: string) =>
    setSavedSheets((prev) => prev.filter((s) => s.id !== id));

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
    // Las medidas guardadas NO se borran: son la biblioteca del carpintero.
  };

  return (
    <AppStateContext.Provider
      value={{
        cuts,
        materials,
        savedSheets,
        kerf,
        result,
        hydrated,
        addCut,
        updateCut,
        removeCut,
        addMaterial,
        updateMaterial,
        removeMaterial,
        addSavedSheet,
        removeSavedSheet,
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