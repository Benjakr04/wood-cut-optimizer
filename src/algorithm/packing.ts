export interface Cut {
  id: string;
  width: number;
  height: number;
  quantity: number;
  name?: string;
  allowRotation?: boolean; // default true. Poné false si te importa la veta/dirección de la pieza
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
  width: number;       // ancho ocupado en la placa (ya considerando si se rotó)
  height: number;      // alto ocupado en la placa (ya considerando si se rotó)
  originalWidth: number;  // medidas tal cual las cargó el usuario
  originalHeight: number;
  rotated: boolean;
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
  allowRotation: boolean;
}

interface FreeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Bin {
  materialId: string;
  materialLabel: string;
  materialName?: string;
  width: number;
  height: number;
  freeRects: FreeRect[];
  placedCuts: PlacedCut[];
}

interface MaterialUnit {
  id: string;
  width: number;
  height: number;
  name?: string;
  unitLabel: string;
}

interface Placement {
  binIndex: number;
  freeRectIndex: number;
  x: number;
  y: number;
  placedWidth: number;
  placedHeight: number;
  rotated: boolean;
}

interface PlacementScore {
  area: number;
  short: number;
  long: number;
}

const MIN_USABLE = 0.5; // mm — por debajo de esto, un rectángulo libre no sirve para nada

export function optimizeCuts(
  cuts: Cut[],
  materials: Material[],
  kerf: number = 3
): OptimizationResult {
  const warnings: string[] = [];
  const cutsNeeded = cuts.reduce((sum, c) => sum + c.quantity, 0);

  // Expandir materiales en unidades físicas individuales (respeta cantidad)
  const materialQueue: MaterialUnit[] = [];
  materials.forEach((m) => {
    for (let i = 0; i < m.quantity; i++) {
      materialQueue.push({
        id: `${m.id}__unit${i}`,
        width: m.width,
        height: m.height,
        name: m.name,
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
    materialsAvailable: materialQueue.length,
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

  // Expandir cortes por cantidad y ordenar por área (mayor primero) -> First Fit Decreasing
  const cutUnits: CutUnit[] = [];
  cuts.forEach((cut) => {
    for (let i = 0; i < cut.quantity; i++) {
      cutUnits.push({
        id: cut.id,
        name: cut.name || 'Corte',
        width: cut.width,
        height: cut.height,
        allowRotation: cut.allowRotation !== false,
      });
    }
  });
  cutUnits.sort((a, b) => {
    const areaDiff = b.width * b.height - a.width * a.height;
    if (areaDiff !== 0) return areaDiff;
    return Math.max(b.width, b.height) - Math.max(a.width, a.height);
  });

  const bins: Bin[] = [];

  for (const cut of cutUnits) {
    const placement = findBestPlacement(bins, cut, kerf);

    if (placement) {
      applyPlacement(bins[placement.binIndex], cut, placement, kerf);
      result.cutsPlaced++;
      continue;
    }

    // Ningún bin abierto tiene lugar: abrimos la próxima placa que le entre a esta pieza
    const materialIndex = materialQueue.findIndex((m) =>
      pieceFitsSheet(cut, m.width, m.height)
    );

    if (materialIndex === -1) {
      continue; // no hay material que la reciba
    }

    const material = materialQueue.splice(materialIndex, 1)[0];
    const newBin: Bin = {
      materialId: material.id,
      materialLabel: material.unitLabel,
      materialName: material.name,
      width: material.width,
      height: material.height,
      freeRects: [{ x: 0, y: 0, w: material.width, h: material.height }],
      placedCuts: [],
    };
    bins.push(newBin);

    const newBinPlacement = findBestPlacementInBin(newBin, cut, kerf);
    if (newBinPlacement) {
      applyPlacement(newBin, cut, { binIndex: bins.length - 1, ...newBinPlacement }, kerf);
      result.cutsPlaced++;
    }
  }

  // Armar resultado final
  bins.forEach((bin) => {
    if (bin.placedCuts.length === 0) return;
    const usedArea = bin.placedCuts.reduce((sum, pc) => sum + pc.width * pc.height, 0);
    const totalArea = bin.width * bin.height;
    const wastePercentage = ((totalArea - usedArea) / totalArea) * 100;

    result.layouts.push({
      materialId: bin.materialId,
      materialLabel: bin.materialLabel,
      width: bin.width,
      height: bin.height,
      placedCuts: bin.placedCuts,
      wastePercentage,
      name: bin.materialName,
    });
    result.totalWaste += wastePercentage;
  });

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

function pieceFitsSheet(cut: CutUnit, sheetW: number, sheetH: number): boolean {
  const fitsNormal = cut.width <= sheetW && cut.height <= sheetH;
  const fitsRotated = cut.allowRotation && cut.height <= sheetW && cut.width <= sheetH;
  return fitsNormal || fitsRotated;
}

// Calcula el "costo" de poner una pieza w×h en un rectángulo libre `free`.
// Best Area Fit: prioriza dejar la MENOR área desperdiciada posible en ese rect.
// Esto hace que las piezas chicas prefieran huecos chicos y ajustados,
// en vez de comerse un pedazo de un rectángulo libre grande (que fragmentaría
// lo que podría quedar como un sobrante grande y reutilizable).
function scorePlacement(free: FreeRect, w: number, h: number): PlacementScore {
  const leftoverW = free.w - w;
  const leftoverH = free.h - h;
  return {
    area: free.w * free.h - w * h,
    short: Math.min(leftoverW, leftoverH),
    long: Math.max(leftoverW, leftoverH),
  };
}

function isBetter(a: PlacementScore, b: PlacementScore): boolean {
  if (a.area !== b.area) return a.area < b.area;
  if (a.short !== b.short) return a.short < b.short;
  return a.long < b.long;
}

// Busca la mejor posición para una pieza entre TODOS los bins ya abiertos
function findBestPlacement(bins: Bin[], cut: CutUnit, kerf: number): Placement | null {
  let best: Placement | null = null;
  let bestScore: PlacementScore | null = null;

  bins.forEach((bin, binIndex) => {
    const candidate = findBestPlacementInBin(bin, cut, kerf);
    if (!candidate) return;
    const free = bin.freeRects[candidate.freeRectIndex];
    const score = scorePlacement(free, candidate.placedWidth, candidate.placedHeight);
    if (!bestScore || isBetter(score, bestScore)) {
      bestScore = score;
      best = { binIndex, ...candidate };
    }
  });

  return best;
}

// Busca la mejor posición dentro de UN bin, probando rotación si está permitida
function findBestPlacementInBin(
  bin: Bin,
  cut: CutUnit,
  kerf: number
): Omit<Placement, 'binIndex'> | null {
  let best: Omit<Placement, 'binIndex'> | null = null;
  let bestScore: PlacementScore | null = null;

  bin.freeRects.forEach((free, freeRectIndex) => {
    const orientations: Array<{ w: number; h: number; rotated: boolean }> = [
      { w: cut.width, h: cut.height, rotated: false },
    ];
    if (cut.allowRotation && cut.width !== cut.height) {
      orientations.push({ w: cut.height, h: cut.width, rotated: true });
    }

    orientations.forEach((o) => {
      if (o.w > free.w || o.h > free.h) return;
      const score = scorePlacement(free, o.w, o.h);
      if (!bestScore || isBetter(score, bestScore)) {
        bestScore = score;
        best = {
          freeRectIndex,
          x: free.x,
          y: free.y,
          placedWidth: o.w,
          placedHeight: o.h,
          rotated: o.rotated,
        };
      }
    });
  });

  return best;
}

// Coloca la pieza en el bin y parte el rectángulo libre usado en 2 nuevos (corte guillotina)
function applyPlacement(bin: Bin, cut: CutUnit, placement: Placement, kerf: number): void {
  const free = bin.freeRects[placement.freeRectIndex];

  bin.placedCuts.push({
    cutId: cut.id,
    name: cut.name,
    x: placement.x,
    y: placement.y,
    width: placement.placedWidth,
    height: placement.placedHeight,
    originalWidth: cut.width,
    originalHeight: cut.height,
    rotated: placement.rotated,
    materialId: bin.materialId,
  });

  const usedW = placement.placedWidth + kerf;
  const usedH = placement.placedHeight + kerf;
  const leftoverW = free.w - usedW;
  const leftoverH = free.h - usedH;

  const newRects: FreeRect[] = [];

  // Regla del eje más corto: partimos por el eje que deja el sobrante más chico
  if (leftoverW <= leftoverH) {
    newRects.push({ x: free.x, y: free.y + usedH, w: free.w, h: free.h - usedH });
    newRects.push({ x: free.x + usedW, y: free.y, w: free.w - usedW, h: usedH });
  } else {
    newRects.push({ x: free.x + usedW, y: free.y, w: free.w - usedW, h: free.h });
    newRects.push({ x: free.x, y: free.y + usedH, w: usedW, h: free.h - usedH });
  }

  bin.freeRects.splice(placement.freeRectIndex, 1);
  newRects.forEach((r) => {
    if (r.w > MIN_USABLE && r.h > MIN_USABLE) {
      bin.freeRects.push(r);
    }
  });

  // Fusionar rectángulos libres vecinos que en conjunto forman uno más grande.
  // Esto es lo que evita que dos huecos chicos y contiguos (ej: los 300×247mm
  // que quedan debajo de dos piezas altas puestas una al lado de la otra)
  // se traten como espacios separados: se convierten en UN sobrante grande
  // y reutilizable, en vez de invitar a que piezas chicas los fragmenten.
  bin.freeRects = mergeFreeRects(bin.freeRects);
}

function mergeFreeRects(rects: FreeRect[]): FreeRect[] {
  const merged = [...rects];
  let didMerge = true;

  while (didMerge) {
    didMerge = false;

    outer: for (let i = 0; i < merged.length; i++) {
      for (let j = i + 1; j < merged.length; j++) {
        const a = merged[i];
        const b = merged[j];

        // Mismo x y mismo ancho -> se pueden fusionar verticalmente si son contiguos
        if (a.x === b.x && a.w === b.w) {
          if (Math.abs(a.y + a.h - b.y) < 0.01) {
            merged[i] = { x: a.x, y: a.y, w: a.w, h: a.h + b.h };
            merged.splice(j, 1);
            didMerge = true;
            break outer;
          }
          if (Math.abs(b.y + b.h - a.y) < 0.01) {
            merged[i] = { x: b.x, y: b.y, w: b.w, h: b.h + a.h };
            merged.splice(j, 1);
            didMerge = true;
            break outer;
          }
        }

        // Mismo y y misma altura -> se pueden fusionar horizontalmente si son contiguos
        if (a.y === b.y && a.h === b.h) {
          if (Math.abs(a.x + a.w - b.x) < 0.01) {
            merged[i] = { x: a.x, y: a.y, w: a.w + b.w, h: a.h };
            merged.splice(j, 1);
            didMerge = true;
            break outer;
          }
          if (Math.abs(b.x + b.w - a.x) < 0.01) {
            merged[i] = { x: b.x, y: b.y, w: b.w + a.w, h: a.h };
            merged.splice(j, 1);
            didMerge = true;
            break outer;
          }
        }
      }
    }
  }

  return merged;
}