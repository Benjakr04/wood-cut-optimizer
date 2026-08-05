//packing.ts

/**
 * Dirección de la veta de un material (placa):
 * - 'vertical'   -> la veta corre de arriba a abajo (paralela al lado "alto" de la placa)
 * - 'horizontal' -> la veta corre de izquierda a derecha (paralela al lado "ancho" de la placa)
 * - 'none'       -> no importa la veta: cualquier pieza puede rotarse libremente en esta placa
 */
export type GrainDirection = 'vertical' | 'horizontal' | 'none';

export interface Cut {
  id: string;
  width: number;
  height: number;
  quantity: number;
  name?: string;
  /**
   * Si es true, esta pieza le importa la veta: su lado "Alto" (height, tal
   * como lo ingresó el usuario) tiene que quedar SIEMPRE paralelo a la veta
   * de la placa donde se corte. Si la placa tiene grain: 'none', esta
   * restricción no aplica (no hay veta que respetar) y la pieza puede
   * rotarse libremente igual que cualquier otra.
   * Default: false (a esta pieza no le importa la veta, rota libre).
   */
  grainSensitive?: boolean;
}

export interface Material {
  id: string;
  width: number;
  height: number;
  quantity: number;
  name?: string;
  /** Dirección de la veta de este material. Default: 'none'. */
  grain?: GrainDirection;
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
  grainSensitive: boolean;
}

/**
 * Un paso de corte físico: una línea recta de borde a borde (corte
 * guillotina) que hay que hacer sobre la placa. Los pasos están numerados
 * en el orden en que conviene hacerlos.
 */
export interface CutStep {
  order: number;
  orientation: 'horizontal' | 'vertical';
  /** Coordenada fija del corte: Y si es horizontal, X si es vertical. */
  position: number;
  /** Extremos del corte a lo largo de la línea (en el otro eje). */
  from: number;
  to: number;
  length: number;
}

export interface CuttingLayout {
  materialId: string;
  materialLabel: string;
  width: number;
  height: number;
  grain: GrainDirection;
  placedCuts: PlacedCut[];
  cutSteps: CutStep[];
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
  grainSensitive: boolean;
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
  grain: GrainDirection;
  freeRects: FreeRect[];
  placedCuts: PlacedCut[];
  cutSteps: CutStep[];
}

interface MaterialUnit {
  id: string;
  width: number;
  height: number;
  name?: string;
  grain: GrainDirection;
  unitLabel: string;
}

interface Orientation {
  w: number;
  h: number;
  rotated: boolean;
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

const MIN_USABLE = 0.5; // mm — por debajo de esto, un rectángulo libre (o un corte) no sirve para nada

/**
 * Determina qué orientaciones están permitidas para una pieza sobre una
 * placa con una determinada veta.
 *
 * Regla: si a la pieza le importa la veta (grainSensitive) y la placa TIENE
 * una veta definida, el lado "height" de la pieza (el que el usuario definió
 * como el que sigue la veta) tiene que quedar paralelo a esa veta:
 *  - veta 'vertical'   -> sin rotar (height se mantiene vertical, igual que la veta)
 *  - veta 'horizontal' -> forzosamente rotada 90° (height pasa a quedar horizontal)
 * En cualquier otro caso (a la pieza no le importa la veta, o la placa no
 * tiene veta definida) se permiten ambas orientaciones.
 */
function allowedOrientations(cut: { width: number; height: number; grainSensitive: boolean }, grain: GrainDirection): Orientation[] {
  const normal: Orientation = { w: cut.width, h: cut.height, rotated: false };
  const rotated: Orientation = { w: cut.height, h: cut.width, rotated: true };

  if (cut.width === cut.height) {
    return [normal];
  }

  if (!cut.grainSensitive || grain === 'none') {
    return [normal, rotated];
  }

  return grain === 'vertical' ? [normal] : [rotated];
}

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
        grain: m.grain || 'none',
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

  // Detectar cortes que no entran en NINGÚN material (ni rotados, ni respetando veta)
  if (materials.length > 0) {
    cuts.forEach((cut) => {
      const cutUnitLike = { width: cut.width, height: cut.height, grainSensitive: !!cut.grainSensitive };
      const fitsSomewhere = materials.some((m) => pieceFitsSheet(cutUnitLike, m.width, m.height, m.grain || 'none'));
      if (!fitsSomewhere) {
        warnings.push(
          `El corte "${cut.name || 'sin nombre'}" (${cut.width}×${cut.height}mm) no entra en ningún material disponible${
            cut.grainSensitive ? ' respetando la veta' : ''
          }.`
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
        grainSensitive: !!cut.grainSensitive,
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
      pieceFitsSheet(cut, m.width, m.height, m.grain)
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
      grain: material.grain,
      freeRects: [{ x: 0, y: 0, w: material.width, h: material.height }],
      placedCuts: [],
      cutSteps: [],
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
      grain: bin.grain,
      placedCuts: bin.placedCuts,
      cutSteps: bin.cutSteps,
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

function pieceFitsSheet(
  cut: { width: number; height: number; grainSensitive: boolean },
  sheetW: number,
  sheetH: number,
  grain: GrainDirection
): boolean {
  return allowedOrientations(cut, grain).some((o) => o.w <= sheetW && o.h <= sheetH);
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

// Busca la mejor posición dentro de UN bin, probando las orientaciones que
// la veta de esa placa le permite a la pieza.
function findBestPlacementInBin(
  bin: Bin,
  cut: CutUnit,
  kerf: number
): Omit<Placement, 'binIndex'> | null {
  let best: Omit<Placement, 'binIndex'> | null = null;
  let bestScore: PlacementScore | null = null;

  const orientations = allowedOrientations(cut, bin.grain);

  bin.freeRects.forEach((free, freeRectIndex) => {
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

// Coloca la pieza en el bin, parte el rectángulo libre usado en 2 nuevos
// (corte guillotina) y registra los pasos de corte físicos que hay que
// hacer para lograrlo.
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
    grainSensitive: cut.grainSensitive,
  });

  const usedW = placement.placedWidth + kerf;
  const usedH = placement.placedHeight + kerf;
  const leftoverW = free.w - usedW;
  const leftoverH = free.h - usedH;

  const newRects: FreeRect[] = [];
  const pushStep = (step: Omit<CutStep, 'order'>) => {
    if (step.length > MIN_USABLE) {
      bin.cutSteps.push({ ...step, order: bin.cutSteps.length + 1 });
    }
  };

  // Regla del eje más corto: partimos por el eje que deja el sobrante más chico.
  // Cada partición del rectángulo libre corresponde a UN corte real de borde
  // a borde sobre lo que queda de esa sección de la placa (corte guillotina).
  if (leftoverW <= leftoverH) {
    // 1) corte horizontal que separa la franja de arriba (donde va la pieza)
    //    del sobrante de abajo, a lo ancho de todo el rectángulo libre.
    pushStep({
      orientation: 'horizontal',
      position: free.y + usedH,
      from: free.x,
      to: free.x + free.w,
      length: free.w,
    });
    // 2) corte vertical dentro de la franja de arriba, que separa la pieza
    //    del sobrante a su derecha.
    pushStep({
      orientation: 'vertical',
      position: free.x + usedW,
      from: free.y,
      to: free.y + usedH,
      length: usedH,
    });

    newRects.push({ x: free.x, y: free.y + usedH, w: free.w, h: free.h - usedH });
    newRects.push({ x: free.x + usedW, y: free.y, w: free.w - usedW, h: usedH });
  } else {
    // 1) corte vertical que separa la franja izquierda (donde va la pieza)
    //    del sobrante de la derecha, a todo el alto del rectángulo libre.
    pushStep({
      orientation: 'vertical',
      position: free.x + usedW,
      from: free.y,
      to: free.y + free.h,
      length: free.h,
    });
    // 2) corte horizontal dentro de la franja izquierda, que separa la pieza
    //    del sobrante debajo suyo.
    pushStep({
      orientation: 'horizontal',
      position: free.y + usedH,
      from: free.x,
      to: free.x + usedW,
      length: usedW,
    });

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