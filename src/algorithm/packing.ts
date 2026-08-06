//src/algorithm/packing.ts

/**
 * Dirección de la veta de un material (placa):
 * - 'vertical'   -> la veta corre de arriba a abajo
 * - 'horizontal' -> la veta corre de izquierda a derecha
 * - 'none'       -> no importa la veta
 */
export type GrainDirection = 'vertical' | 'horizontal' | 'none';

/** Unidad de medida. Internamente TODO se guarda en mm. */
export type Unit = 'mm' | 'cm' | 'm';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Cut {
  id: string;
  width: number;
  height: number;
  quantity: number;
  name?: string;
  /** Si es true, el lado "Alto" queda siempre paralelo a la veta de la placa. */
  grainSensitive?: boolean;
  unit?: Unit;
}

export interface Material {
  id: string;
  width: number;
  height: number;
  quantity: number;
  name?: string;
  grain?: GrainDirection;
  unit?: Unit;
}

export interface PlacedCut {
  /** Índice de esta pieza dentro de la placa (sirve para referenciarla en los pasos). */
  index: number;
  cutId: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  rotated: boolean;
  materialId: string;
  grainSensitive: boolean;
  unit?: Unit;
  /** Número de paso después del cual esta pieza queda suelta en la mano. */
  freedAtStep: number;
}

/**
 * Un corte físico real: una pasada de sierra de borde a borde SOBRE UN PANEL
 * concreto (`panel`), que lo divide en `partA` y `partB`. Los pasos están en
 * el orden en el que hay que hacerlos.
 */
export interface CutStep {
  order: number;
  orientation: 'horizontal' | 'vertical';
  /** Coordenada fija del corte (Y si es horizontal, X si es vertical), en mm de la placa. */
  position: number;
  from: number;
  to: number;
  length: number;
  /** Panel sobre el que se apoya la sierra en este paso. */
  panel: Rect;
  partA: Rect;
  partB: Rect;
  /** Índices de piezas que quedan terminadas con este corte. */
  frees: number[];
}

export interface CuttingLayout {
  materialId: string;
  materialLabel: string;
  name?: string;
  width: number;
  height: number;
  grain: GrainDirection;
  unit: Unit;
  placedCuts: PlacedCut[];
  cutSteps: CutStep[];
  /** Sobrantes utilizables que quedan en la placa, de mayor a menor. */
  freeRects: Rect[];
  biggestOffcut: Rect | null;
  wastePercentage: number;
  /** false si el plano no se pudo resolver 100% con cortes de borde a borde. */
  guillotineOk: boolean;
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

/* ------------------------------------------------------------------ */
/* Internos                                                            */
/* ------------------------------------------------------------------ */

const EPS = 0.01;
const MIN_USABLE = 1; // mm: por debajo de esto un sobrante no sirve para nada
const EXACT_TOL = 0.5; // mm: tolerancia para decir "este panel YA es la pieza"

interface CutUnit {
  id: string;
  name: string;
  width: number;
  height: number;
  grainSensitive: boolean;
  unit: Unit;
}

interface MaterialUnit {
  id: string;
  width: number;
  height: number;
  name?: string;
  grain: GrainDirection;
  unit: Unit;
  unitLabel: string;
}

interface Bin {
  materialId: string;
  materialLabel: string;
  materialName?: string;
  width: number;
  height: number;
  grain: GrainDirection;
  unit: Unit;
  freeRects: Rect[];
  placed: PlacedCut[];
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

type SortKey = 'area' | 'maxSide' | 'height' | 'perimeter';
type ScoreRule = 'area' | 'short' | 'topleft';
type SplitRule = 'shorter' | 'longer' | 'maxArea';
type SheetRule = 'largest' | 'smallest';

interface Strategy {
  sort: SortKey;
  score: ScoreRule;
  split: SplitRule;
  sheet: SheetRule;
}

interface RunResult {
  bins: Bin[];
  placed: number;
}

interface Metrics {
  placed: number;
  sheets: number;
  sheetArea: number;
  biggestOffcut: number;
  fragments: number;
}

/**
 * Orientaciones permitidas para una pieza sobre una placa con determinada veta.
 */
function allowedOrientations(
  cut: { width: number; height: number; grainSensitive: boolean },
  grain: GrainDirection
): Orientation[] {
  const normal: Orientation = { w: cut.width, h: cut.height, rotated: false };
  const rotated: Orientation = { w: cut.height, h: cut.width, rotated: true };

  if (Math.abs(cut.width - cut.height) < EPS) return [normal];
  if (!cut.grainSensitive || grain === 'none') return [normal, rotated];
  return grain === 'vertical' ? [normal] : [rotated];
}

function pieceFitsSheet(
  cut: { width: number; height: number; grainSensitive: boolean },
  sheetW: number,
  sheetH: number,
  grain: GrainDirection
): boolean {
  return allowedOrientations(cut, grain).some(
    (o) => o.w <= sheetW + EPS && o.h <= sheetH + EPS
  );
}

/** Comparación lexicográfica con tolerancia. */
function lessThan(a: number[], b: number[]): boolean {
  for (let i = 0; i < a.length; i++) {
    if (Math.abs(a[i] - b[i]) > EPS) return a[i] < b[i];
  }
  return false;
}

/**
 * Puntaje de poner una pieza w×h en el rectángulo libre `free`.
 * Todos los criterios terminan desempatando por Y y después por X: eso es lo
 * que hace que la placa se llene DE ARRIBA HACIA ABAJO y que el sobrante
 * quede junto abajo, en un solo pedazo grande y reutilizable.
 */
function scoreFor(rule: ScoreRule, free: Rect, w: number, h: number): number[] {
  const leftW = free.w - w;
  const leftH = free.h - h;
  const shortSide = Math.min(leftW, leftH);
  const longSide = Math.max(leftW, leftH);
  const wasted = free.w * free.h - w * h;

  switch (rule) {
    case 'area':
      return [wasted, shortSide, free.y, free.x];
    case 'short':
      return [shortSide, longSide, free.y, free.x];
    case 'topleft':
    default:
      return [free.y, free.x, wasted, shortSide];
  }
}

function sortUnits(units: CutUnit[], key: SortKey): CutUnit[] {
  const arr = [...units];
  arr.sort((a, b) => {
    let diff = 0;
    switch (key) {
      case 'area':
        diff = b.width * b.height - a.width * a.height;
        break;
      case 'maxSide':
        diff = Math.max(b.width, b.height) - Math.max(a.width, a.height);
        break;
      case 'height':
        diff = b.height - a.height;
        break;
      case 'perimeter':
        diff = b.width + b.height - (a.width + a.height);
        break;
    }
    if (Math.abs(diff) > EPS) return diff;
    const areaDiff = b.width * b.height - a.width * a.height;
    if (Math.abs(areaDiff) > EPS) return areaDiff;
    return Math.max(b.width, b.height) - Math.max(a.width, a.height);
  });
  return arr;
}

function findBestPlacementInBin(
  bin: Bin,
  cut: CutUnit,
  rule: ScoreRule
): Omit<Placement, 'binIndex'> | null {
  let best: Omit<Placement, 'binIndex'> | null = null;
  let bestScore: number[] | null = null;

  const orientations = allowedOrientations(cut, bin.grain);

  bin.freeRects.forEach((free, freeRectIndex) => {
    orientations.forEach((o) => {
      if (o.w > free.w + EPS || o.h > free.h + EPS) return;
      const score = scoreFor(rule, free, o.w, o.h);
      if (!bestScore || lessThan(score, bestScore)) {
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

function findBestPlacement(bins: Bin[], cut: CutUnit, rule: ScoreRule): Placement | null {
  let best: Placement | null = null;
  let bestScore: number[] | null = null;

  bins.forEach((bin, binIndex) => {
    const candidate = findBestPlacementInBin(bin, cut, rule);
    if (!candidate) return;
    const free = bin.freeRects[candidate.freeRectIndex];
    // Penalizamos abrir placas nuevas: preferimos terminar de llenar las que ya están.
    const score = [binIndex, ...scoreFor(rule, free, candidate.placedWidth, candidate.placedHeight)];
    if (!bestScore || lessThan(score, bestScore)) {
      bestScore = score;
      best = { binIndex, ...candidate };
    }
  });

  return best;
}

function splitHorizontalFirst(
  rule: SplitRule,
  free: Rect,
  usedW: number,
  usedH: number,
  leftoverW: number,
  leftoverH: number
): boolean {
  switch (rule) {
    case 'shorter':
      return leftoverW <= leftoverH;
    case 'longer':
      return leftoverW > leftoverH;
    case 'maxArea':
    default: {
      const horizFirst = Math.max(free.w * leftoverH, leftoverW * usedH);
      const vertFirst = Math.max(leftoverW * free.h, usedW * leftoverH);
      return horizFirst >= vertFirst;
    }
  }
}

function applyPlacement(
  bin: Bin,
  cut: CutUnit,
  placement: Omit<Placement, 'binIndex'>,
  kerf: number,
  rule: SplitRule
): void {
  const free = bin.freeRects[placement.freeRectIndex];

  bin.placed.push({
    index: bin.placed.length,
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
    unit: cut.unit,
    freedAtStep: 0,
  });

  // Kerf consciente del borde: si lo que sobra al costado no alcanza ni para
  // la sierra + un sobrante mínimo, no descontamos kerf (no hay nada que cortar).
  const gapW = free.w - placement.placedWidth;
  const gapH = free.h - placement.placedHeight;
  const usedW = gapW > kerf + MIN_USABLE ? placement.placedWidth + kerf : free.w;
  const usedH = gapH > kerf + MIN_USABLE ? placement.placedHeight + kerf : free.h;
  const leftoverW = free.w - usedW;
  const leftoverH = free.h - usedH;

  const newRects: Rect[] = [];
  if (splitHorizontalFirst(rule, free, usedW, usedH, leftoverW, leftoverH)) {
    newRects.push({ x: free.x, y: free.y + usedH, w: free.w, h: leftoverH });
    newRects.push({ x: free.x + usedW, y: free.y, w: leftoverW, h: usedH });
  } else {
    newRects.push({ x: free.x + usedW, y: free.y, w: leftoverW, h: free.h });
    newRects.push({ x: free.x, y: free.y + usedH, w: usedW, h: leftoverH });
  }

  bin.freeRects.splice(placement.freeRectIndex, 1);
  newRects.forEach((r) => {
    if (r.w > MIN_USABLE && r.h > MIN_USABLE) bin.freeRects.push(r);
  });

  bin.freeRects = mergeFreeRects(bin.freeRects);
}

/** Fusiona sobrantes vecinos que juntos forman un rectángulo más grande. */
function mergeFreeRects(rects: Rect[]): Rect[] {
  const merged = [...rects];
  let didMerge = true;
  const near = (a: number, b: number) => Math.abs(a - b) < 0.05;

  while (didMerge) {
    didMerge = false;
    outer: for (let i = 0; i < merged.length; i++) {
      for (let j = i + 1; j < merged.length; j++) {
        const a = merged[i];
        const b = merged[j];

        if (near(a.x, b.x) && near(a.w, b.w)) {
          if (near(a.y + a.h, b.y)) {
            merged[i] = { x: a.x, y: a.y, w: a.w, h: a.h + b.h };
            merged.splice(j, 1);
            didMerge = true;
            break outer;
          }
          if (near(b.y + b.h, a.y)) {
            merged[i] = { x: b.x, y: b.y, w: b.w, h: b.h + a.h };
            merged.splice(j, 1);
            didMerge = true;
            break outer;
          }
        }

        if (near(a.y, b.y) && near(a.h, b.h)) {
          if (near(a.x + a.w, b.x)) {
            merged[i] = { x: a.x, y: a.y, w: a.w + b.w, h: a.h };
            merged.splice(j, 1);
            didMerge = true;
            break outer;
          }
          if (near(b.x + b.w, a.x)) {
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

function runStrategy(
  cutUnits: CutUnit[],
  materialPool: MaterialUnit[],
  kerf: number,
  strat: Strategy
): RunResult {
  const queue = [...materialPool];
  const units = sortUnits(cutUnits, strat.sort);
  const bins: Bin[] = [];
  let placed = 0;

  for (const cut of units) {
    let placement = findBestPlacement(bins, cut, strat.score);

    if (!placement) {
      // Elegimos qué placa nueva abrir entre las que le entran a esta pieza.
      let chosen = -1;
      let chosenArea = 0;
      queue.forEach((m, idx) => {
        if (!pieceFitsSheet(cut, m.width, m.height, m.grain)) return;
        const area = m.width * m.height;
        if (chosen === -1) {
          chosen = idx;
          chosenArea = area;
          return;
        }
        if (strat.sheet === 'smallest' ? area < chosenArea : area > chosenArea) {
          chosen = idx;
          chosenArea = area;
        }
      });
      if (chosen === -1) continue;

      const material = queue.splice(chosen, 1)[0];
      bins.push({
        materialId: material.id,
        materialLabel: material.unitLabel,
        materialName: material.name,
        width: material.width,
        height: material.height,
        grain: material.grain,
        unit: material.unit,
        freeRects: [{ x: 0, y: 0, w: material.width, h: material.height }],
        placed: [],
      });
      placement = findBestPlacement(bins, cut, strat.score);
      if (!placement) continue;
    }

    const { binIndex, ...rest } = placement;
    applyPlacement(bins[binIndex], cut, rest, kerf, strat.split);
    placed++;
  }

  return { bins, placed };
}

function evaluate(run: RunResult): Metrics {
  const used = run.bins.filter((b) => b.placed.length > 0);
  let sheetArea = 0;
  let biggestOffcut = 0;
  let fragments = 0;
  used.forEach((b) => {
    sheetArea += b.width * b.height;
    fragments += b.freeRects.length;
    b.freeRects.forEach((r) => {
      biggestOffcut = Math.max(biggestOffcut, r.w * r.h);
    });
  });
  return { placed: run.placed, sheets: used.length, sheetArea, biggestOffcut, fragments };
}

function betterThan(a: Metrics, b: Metrics): boolean {
  if (a.placed !== b.placed) return a.placed > b.placed;
  if (a.sheets !== b.sheets) return a.sheets < b.sheets;
  if (Math.abs(a.sheetArea - b.sheetArea) > EPS) return a.sheetArea < b.sheetArea;
  // A igualdad de todo: gana el que deja el sobrante MÁS GRANDE de una pieza.
  if (Math.abs(a.biggestOffcut - b.biggestOffcut) > EPS) return a.biggestOffcut > b.biggestOffcut;
  return a.fragments < b.fragments;
}

/* ------------------------------------------------------------------ */
/* Secuencia real de cortes (descomposición guillotina del plano final) */
/* ------------------------------------------------------------------ */

interface Candidate {
  orientation: 'horizontal' | 'vertical';
  position: number;
  from: number;
  to: number;
  a: Rect;
  b: Rect;
  aIdxs: number[];
  bIdxs: number[];
  aligned: number;
  full: boolean;
}

/**
 * A partir de las piezas ya ubicadas, reconstruye la secuencia de cortes de
 * borde a borde que hay que hacer, en orden, y para cada corte sabe sobre qué
 * panel se hace y qué piezas quedan liberadas.
 */
function buildCutSequence(
  sheet: Rect,
  pieces: PlacedCut[],
  kerf: number
): { steps: CutStep[]; ok: boolean } {
  const steps: CutStep[] = [];
  let ok = true;

  const isExact = (r: Rect, p: PlacedCut) =>
    Math.abs(r.x - p.x) < EXACT_TOL &&
    Math.abs(r.y - p.y) < EXACT_TOL &&
    Math.abs(r.w - p.width) < EXACT_TOL &&
    Math.abs(r.h - p.height) < EXACT_TOL;

  const chooseCut = (region: Rect, idxs: number[]): Candidate | null => {
    const right = region.x + region.w;
    const bottom = region.y + region.h;
    const candidates: Candidate[] = [];

    const xs = new Set<number>();
    const ys = new Set<number>();
    idxs.forEach((i) => {
      const p = pieces[i];
      xs.add(p.x);
      xs.add(p.x + p.width);
      ys.add(p.y);
      ys.add(p.y + p.height);
    });

    xs.forEach((X) => {
      if (X <= region.x + EPS || X >= right - EPS) return;
      const aIdxs: number[] = [];
      const bIdxs: number[] = [];
      let straddle = false;
      idxs.forEach((i) => {
        const p = pieces[i];
        if (p.x + p.width <= X + EPS) aIdxs.push(i);
        else if (p.x >= X - EPS) bIdxs.push(i);
        else straddle = true;
      });
      if (straddle) return;

      let bStart = X + (aIdxs.length > 0 ? kerf : 0);
      if (bIdxs.length) {
        const minB = Math.min(...bIdxs.map((i) => pieces[i].x));
        if (minB < bStart) bStart = minB;
      }
      if (bStart > right) bStart = right;

      const aligned = idxs.filter((i) => {
        const p = pieces[i];
        return Math.abs(p.x - X) < EPS || Math.abs(p.x + p.width - X) < EPS;
      }).length;

      candidates.push({
        orientation: 'vertical',
        position: X,
        from: region.y,
        to: bottom,
        a: { x: region.x, y: region.y, w: X - region.x, h: region.h },
        b: { x: bStart, y: region.y, w: Math.max(0, right - bStart), h: region.h },
        aIdxs,
        bIdxs,
        aligned,
        full: aIdxs.length > 0 && bIdxs.length > 0,
      });
    });

    ys.forEach((Y) => {
      if (Y <= region.y + EPS || Y >= bottom - EPS) return;
      const aIdxs: number[] = [];
      const bIdxs: number[] = [];
      let straddle = false;
      idxs.forEach((i) => {
        const p = pieces[i];
        if (p.y + p.height <= Y + EPS) aIdxs.push(i);
        else if (p.y >= Y - EPS) bIdxs.push(i);
        else straddle = true;
      });
      if (straddle) return;

      let bStart = Y + (aIdxs.length > 0 ? kerf : 0);
      if (bIdxs.length) {
        const minB = Math.min(...bIdxs.map((i) => pieces[i].y));
        if (minB < bStart) bStart = minB;
      }
      if (bStart > bottom) bStart = bottom;

      const aligned = idxs.filter((i) => {
        const p = pieces[i];
        return Math.abs(p.y - Y) < EPS || Math.abs(p.y + p.height - Y) < EPS;
      }).length;

      candidates.push({
        orientation: 'horizontal',
        position: Y,
        from: region.x,
        to: right,
        a: { x: region.x, y: region.y, w: region.w, h: Y - region.y },
        b: { x: region.x, y: bStart, w: region.w, h: Math.max(0, bottom - bStart) },
        aIdxs,
        bIdxs,
        aligned,
        full: aIdxs.length > 0 && bIdxs.length > 0,
      });
    });

    if (candidates.length === 0) return null;

    candidates.sort((c1, c2) => {
      if (c1.full !== c2.full) return c1.full ? -1 : 1;
      if (c1.aligned !== c2.aligned) return c2.aligned - c1.aligned;
      if (c1.orientation !== c2.orientation) return c1.orientation === 'horizontal' ? -1 : 1;
      return c1.position - c2.position;
    });

    return candidates[0];
  };

  const process = (region: Rect, idxs: number[], parentOrder: number, depth: number) => {
    if (idxs.length === 0) return; // recorte / sobrante, no hay más nada que hacer
    if (idxs.length === 1 && isExact(region, pieces[idxs[0]])) {
      pieces[idxs[0]].freedAtStep = parentOrder;
      if (parentOrder > 0) steps[parentOrder - 1].frees.push(idxs[0]);
      return;
    }
    if (depth > 80 || steps.length > 400) {
      ok = false;
      return;
    }

    const cand = chooseCut(region, idxs);
    if (!cand) {
      ok = false;
      return;
    }

    const order = steps.length + 1;
    steps.push({
      order,
      orientation: cand.orientation,
      position: cand.position,
      from: cand.from,
      to: cand.to,
      length: cand.to - cand.from,
      panel: { ...region },
      partA: { ...cand.a },
      partB: { ...cand.b },
      frees: [],
    });

    process(cand.a, cand.aIdxs, order, depth + 1);
    process(cand.b, cand.bIdxs, order, depth + 1);
  };

  pieces.forEach((p) => {
    p.freedAtStep = 0;
  });
  process({ ...sheet }, pieces.map((_, i) => i), 0, 0);

  if (!ok) {
    // Fallback prudente: marcamos las piezas sin liberar como listas al final.
    pieces.forEach((p) => {
      if (p.freedAtStep === 0 && steps.length > 0) p.freedAtStep = steps.length;
    });
  }

  return { steps, ok };
}

/* ------------------------------------------------------------------ */
/* API pública                                                         */
/* ------------------------------------------------------------------ */

export function optimizeCuts(
  cuts: Cut[],
  materials: Material[],
  kerf: number = 3
): OptimizationResult {
  const warnings: string[] = [];
  const cutsNeeded = cuts.reduce((sum, c) => sum + Math.max(0, c.quantity), 0);

  const materialPool: MaterialUnit[] = [];
  materials.forEach((m) => {
    for (let i = 0; i < Math.max(0, m.quantity); i++) {
      materialPool.push({
        id: `${m.id}__unit${i}`,
        width: m.width,
        height: m.height,
        name: m.name,
        grain: m.grain || 'none',
        unit: m.unit || 'mm',
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
    materialsAvailable: materialPool.length,
    warnings,
  };

  if (materials.length > 0) {
    cuts.forEach((cut) => {
      const like = {
        width: cut.width,
        height: cut.height,
        grainSensitive: !!cut.grainSensitive,
      };
      const fits = materials.some((m) =>
        pieceFitsSheet(like, m.width, m.height, m.grain || 'none')
      );
      if (!fits) {
        warnings.push(
          `El corte "${cut.name || 'sin nombre'}" (${cut.width}×${cut.height}mm) no entra en ningún material disponible${
            cut.grainSensitive ? ' respetando la veta' : ''
          }.`
        );
      }
    });
  }

  const cutUnits: CutUnit[] = [];
  cuts.forEach((cut) => {
    for (let i = 0; i < Math.max(0, cut.quantity); i++) {
      cutUnits.push({
        id: cut.id,
        name: cut.name || 'Corte',
        width: cut.width,
        height: cut.height,
        grainSensitive: !!cut.grainSensitive,
        unit: cut.unit || 'mm',
      });
    }
  });

  if (cutUnits.length === 0 || materialPool.length === 0) {
    if (cutsNeeded > 0) {
      warnings.push('No hay material disponible para colocar los cortes.');
    }
    return result;
  }

  // Probamos muchas combinaciones y nos quedamos con la mejor.
  const heavy = cutUnits.length > 100;
  const sorts: SortKey[] = heavy ? ['area', 'maxSide'] : ['area', 'maxSide', 'height', 'perimeter'];
  const scores: ScoreRule[] = heavy ? ['area', 'topleft'] : ['area', 'short', 'topleft'];
  const splits: SplitRule[] = heavy ? ['shorter', 'maxArea'] : ['shorter', 'longer', 'maxArea'];
  const sizesDiffer =
    new Set(materialPool.map((m) => `${m.width}x${m.height}`)).size > 1;
  const sheetRules: SheetRule[] = sizesDiffer ? ['largest', 'smallest'] : ['largest'];

  let bestRun: RunResult | null = null;
  let bestMetrics: Metrics | null = null;

  sorts.forEach((sort) =>
    scores.forEach((score) =>
      splits.forEach((split) =>
        sheetRules.forEach((sheet) => {
          const run = runStrategy(cutUnits, materialPool, kerf, { sort, score, split, sheet });
          const metrics = evaluate(run);
          if (!bestMetrics || betterThan(metrics, bestMetrics)) {
            bestMetrics = metrics;
            bestRun = run;
          }
        })
      )
    )
  );

  if (!bestRun) return result;

  const run: RunResult = bestRun;
  result.cutsPlaced = run.placed;

  let totalSheetArea = 0;
  let totalUsedArea = 0;

  run.bins
    .filter((bin) => bin.placed.length > 0)
    .forEach((bin) => {
      const { steps, ok } = buildCutSequence(
        { x: 0, y: 0, w: bin.width, h: bin.height },
        bin.placed,
        kerf
      );

      const usedArea = bin.placed.reduce((sum, p) => sum + p.width * p.height, 0);
      const totalArea = bin.width * bin.height;
      totalSheetArea += totalArea;
      totalUsedArea += usedArea;

      const freeRects = [...bin.freeRects].sort((a, b) => b.w * b.h - a.w * a.h);

      if (!ok) {
        warnings.push(
          `En "${bin.materialLabel}" no se pudo armar la guía completa de cortes de borde a borde. El plano sigue siendo válido.`
        );
      }

      result.layouts.push({
        materialId: bin.materialId,
        materialLabel: bin.materialLabel,
        name: bin.materialName,
        width: bin.width,
        height: bin.height,
        grain: bin.grain,
        unit: bin.unit,
        placedCuts: bin.placed,
        cutSteps: steps,
        freeRects,
        biggestOffcut: freeRects.length > 0 ? freeRects[0] : null,
        wastePercentage: ((totalArea - usedArea) / totalArea) * 100,
        guillotineOk: ok,
      });
    });

  result.materialsNeeded = result.layouts.length;
  result.totalWaste =
    totalSheetArea > 0 ? ((totalSheetArea - totalUsedArea) / totalSheetArea) * 100 : 0;
  result.success = result.cutsPlaced === result.cutsNeeded;

  if (!result.success && cutsNeeded > 0) {
    const missing = result.cutsNeeded - result.cutsPlaced;
    warnings.push(
      `Faltan ${missing} corte${missing === 1 ? '' : 's'} por colocar: necesitás más material.`
    );
  }

  return result;
}