// Tipos de datos
export interface Cut {
  id: string;
  width: number;
  height: number;
  quantity: number;
  name?: string;
}

export interface Material {
  id: string;
  width: number;
  height: number;
  quantity: number;
  name?: string;
}

export interface PlacedCut {
  cutId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  materialId: string;
}

export interface CuttingLayout {
  materialId: string;
  width: number;
  height: number;
  placedCuts: PlacedCut[];
  wastePercentage: number;
}

export interface OptimizationResult {
  success: boolean;
  layouts: CuttingLayout[];
  totalWaste: number;
  cutsPlaced: number;
  cutsNeeded: number;
  materialsNeeded: number;
  materialsAvailable: number;
}

const KERF = 3; // mm de pérdida por corte (grosor de sierra)

// Función principal de optimización
export function optimizeCuts(
  cuts: Cut[],
  materials: Material[]
): OptimizationResult {
  const result: OptimizationResult = {
    success: false,
    layouts: [],
    totalWaste: 0,
    cutsPlaced: 0,
    cutsNeeded: cuts.reduce((sum, c) => sum + c.quantity, 0),
    materialsNeeded: 0,
    materialsAvailable: materials.reduce((sum, m) => sum + m.quantity, 0),
  };

  // Copiar materiales para no mutar el original
  const availableMaterials: Array<Material & { used: boolean }> = materials.map((m) => ({
    ...m,
    used: false,
  }));

  // Ordenar cortes por tamaño (mayor primero) - heurística First Fit Decreasing
  const sortedCuts = [...cuts].sort((a, b) => {
    const areaA = a.width * a.height;
    const areaB = b.width * b.height;
    return areaB - areaA;
  });

  // Para cada material, intentar colocar cortes
  for (const material of availableMaterials) {
    const layout: CuttingLayout = {
      materialId: material.id,
      width: material.width,
      height: material.height,
      placedCuts: [],
      wastePercentage: 0,
    };

    // Mantener track de espacios ocupados
    const occupiedRects: Array<{ x: number; y: number; w: number; h: number }> = [];

    // Intentar colocar cada corte
    for (const cut of sortedCuts) {
      for (let i = 0; i < cut.quantity; i++) {
        // Intentar colocar una unidad de este corte
        const position = findBestPosition(
          cut.width,
          cut.height,
          material.width,
          material.height,
          occupiedRects
        );

        if (position) {
          layout.placedCuts.push({
            cutId: cut.id,
            x: position.x,
            y: position.y,
            width: cut.width,
            height: cut.height,
            materialId: material.id,
          });

          result.cutsPlaced++;

          // Marcar como ocupado (con espacio de kerf)
          occupiedRects.push({
            x: position.x,
            y: position.y,
            w: cut.width + KERF,
            h: cut.height + KERF,
          });
        }
      }
    }

    if (layout.placedCuts.length > 0) {
      result.layouts.push(layout);
      // Calcular desperdicio
      const usedArea = layout.placedCuts.reduce((sum, pc) => sum + pc.width * pc.height, 0);
      const totalArea = layout.width * layout.height;
      layout.wastePercentage = ((totalArea - usedArea) / totalArea) * 100;
      result.totalWaste += layout.wastePercentage;
    }
  }

  result.success = result.cutsPlaced === result.cutsNeeded;
  result.materialsNeeded = result.layouts.length;

  return result;
}

// Buscar la mejor posición para un corte (bottom-left heuristic)
function findBestPosition(
  cutWidth: number,
  cutHeight: number,
  materialWidth: number,
  materialHeight: number,
  occupied: Array<{ x: number; y: number; w: number; h: number }>
): { x: number; y: number } | null {
  // Intentar desde abajo a la izquierda
  for (let y = 0; y <= materialHeight - cutHeight; y++) {
    for (let x = 0; x <= materialWidth - cutWidth; x++) {
      if (canPlace(x, y, cutWidth, cutHeight, occupied, materialWidth, materialHeight)) {
        return { x, y };
      }
    }
  }

  return null;
}

// Verificar si se puede colocar un corte en una posición
function canPlace(
  x: number,
  y: number,
  width: number,
  height: number,
  occupied: Array<{ x: number; y: number; w: number; h: number }>,
  materialWidth: number,
  materialHeight: number
): boolean {
  // Verificar límites del material
  if (x + width > materialWidth || y + height > materialHeight) {
    return false;
  }

  // Verificar que no intersecte con otros cortes
  for (const rect of occupied) {
    if (!(x + width <= rect.x || x >= rect.x + rect.w || y + height <= rect.y || y >= rect.y + rect.h)) {
      return false;
    }
  }

  return true;
}