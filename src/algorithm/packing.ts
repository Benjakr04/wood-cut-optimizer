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
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  materialId: string;
}

export interface CuttingLayout {
  materialId: string;
  materialLabel: string;
  width: number;
  height: number;
  placedCuts: PlacedCut[];
  wastePercentage: number;
  name?: string;
}

export interface OptimizationResult {
  success: boolean;
  layouts: CuttingLayout[];
  totalWaste: number;
  cutsPlaced: number;
  cutsNeeded: number;
  materialsNeeded: number;
  materialsAvailable: number;
  warnings: string[];
}

interface CutUnit {
  id: string;
  name: string;
  width: number;
  height: number;
}

export function optimizeCuts(
  cuts: Cut[],
  materials: Material[],
  kerf: number = 3
): OptimizationResult {
  const warnings: string[] = [];
  const cutsNeeded = cuts.reduce((sum, c) => sum + c.quantity, 0);

  // Expandir materiales en unidades físicas individuales (respeta cantidad)
  const materialUnits: Array<Material & { unitLabel: string }> = [];
  materials.forEach((m) => {
    for (let i = 0; i < m.quantity; i++) {
      materialUnits.push({
        ...m,
        id: `${m.id}__unit${i}`,
        quantity: 1,
        unitLabel:
          m.quantity > 1
            ? `${m.name || 'Material'} (${i + 1}/${m.quantity})`
            : m.name || 'Material',
      });
    }
  });

  const result: OptimizationResult = {
    success: false,
    layouts: [],
    totalWaste: 0,
    cutsPlaced: 0,
    cutsNeeded,
    materialsNeeded: 0,
    materialsAvailable: materialUnits.length,
    warnings,
  };

  // Detectar cortes que no entran en NINGÚN material (ni rotados)
  if (materials.length > 0) {
    const maxMatW = Math.max(...materials.map((m) => m.width));
    const maxMatH = Math.max(...materials.map((m) => m.height));
    cuts.forEach((cut) => {
      const fitsNormal = cut.width <= maxMatW && cut.height <= maxMatH;
      const fitsRotated = cut.height <= maxMatW && cut.width <= maxMatH;
      if (!fitsNormal && !fitsRotated) {
        warnings.push(
          `El corte "${cut.name || 'sin nombre'}" (${cut.width}×${cut.height}mm) no entra en ningún material disponible.`
        );
      }
    });
  }

  // Expandir cortes por cantidad y ordenar por área (mayor primero)
  const cutUnits: CutUnit[] = [];
  cuts.forEach((cut) => {
    for (let i = 0; i < cut.quantity; i++) {
      cutUnits.push({
        id: cut.id,
        name: cut.name || 'Corte',
        width: cut.width,
        height: cut.height,
      });
    }
  });
  cutUnits.sort((a, b) => b.width * b.height - a.width * a.height);

  const pending = [...cutUnits];

  for (const material of materialUnits) {
    if (pending.length === 0) break;

    const layout: CuttingLayout = {
      materialId: material.id,
      materialLabel: material.unitLabel,
      width: material.width,
      height: material.height,
      placedCuts: [],
      wastePercentage: 0,
      name: material.name,
    };

    const occupiedRects: Array<{ x: number; y: number; w: number; h: number }> = [];

    for (let i = pending.length - 1; i >= 0; i--) {
      const cut = pending[i];
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
          name: cut.name,
          x: position.x,
          y: position.y,
          width: cut.width,
          height: cut.height,
          materialId: material.id,
        });

        occupiedRects.push({
          x: position.x,
          y: position.y,
          w: cut.width + kerf,
          h: cut.height + kerf,
        });

        result.cutsPlaced++;
        pending.splice(i, 1);
      }
    }

    if (layout.placedCuts.length > 0) {
      result.layouts.push(layout);
      const usedArea = layout.placedCuts.reduce((sum, pc) => sum + pc.width * pc.height, 0);
      const totalArea = layout.width * layout.height;
      layout.wastePercentage = ((totalArea - usedArea) / totalArea) * 100;
      result.totalWaste += layout.wastePercentage;
    }
  }

  result.materialsNeeded = result.layouts.length;
  result.success = result.cutsPlaced === result.cutsNeeded;

  if (result.layouts.length > 0) {
    result.totalWaste = result.totalWaste / result.layouts.length;
  }

  if (!result.success && cutsNeeded > 0) {
    const missing = result.cutsNeeded - result.cutsPlaced;
    warnings.push(
      `Faltan ${missing} corte${missing === 1 ? '' : 's'} por colocar: necesitás más material.`
    );
  }

  return result;
}

function findBestPosition(
  cutWidth: number,
  cutHeight: number,
  materialWidth: number,
  materialHeight: number,
  occupied: Array<{ x: number; y: number; w: number; h: number }>
): { x: number; y: number } | null {
  for (let y = 0; y <= materialHeight - cutHeight; y++) {
    for (let x = 0; x <= materialWidth - cutWidth; x++) {
      if (canPlace(x, y, cutWidth, cutHeight, occupied, materialWidth, materialHeight)) {
        return { x, y };
      }
    }
  }
  return null;
}

function canPlace(
  x: number,
  y: number,
  width: number,
  height: number,
  occupied: Array<{ x: number; y: number; w: number; h: number }>,
  materialWidth: number,
  materialHeight: number
): boolean {
  if (x + width > materialWidth || y + height > materialHeight) {
    return false;
  }
  for (const rect of occupied) {
    if (
      !(x + width <= rect.x || x >= rect.x + rect.w || y + height <= rect.y || y >= rect.y + rect.h)
    ) {
      return false;
    }
  }
  return true;
}