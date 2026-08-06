//src/utils/unitConversion.ts
// Conversión entre unidades de medida. Internamente TODO vive en mm.
import { Unit } from '../algorithm/packing';
import { formatNumber, parseDecimal } from './number';

export function toMm(value: number, from: Unit = 'mm'): number {
  switch (from) {
    case 'cm':
      return value * 10;
    case 'm':
      return value * 1000;
    case 'mm':
    default:
      return value;
  }
}

export function fromMm(valueInMm: number, to: Unit = 'mm'): number {
  switch (to) {
    case 'cm':
      return valueInMm / 10;
    case 'm':
      return valueInMm / 1000;
    case 'mm':
    default:
      return valueInMm;
  }
}

/** Lee texto del usuario ('2,2') en la unidad indicada y devuelve mm. */
export function parseToMm(text: string, unit: Unit = 'mm'): number {
  const value = parseDecimal(text);
  return Number.isFinite(value) ? toMm(value, unit) : NaN;
}

/** Cuántos decimales tiene sentido mostrar en cada unidad. */
export function decimalsForUnit(unit: Unit): number {
  switch (unit) {
    case 'm':
      return 3;
    case 'cm':
      return 2;
    case 'mm':
    default:
      return 1;
  }
}

/** mm -> texto en la unidad pedida, sin el símbolo. Ej: 2200 en 'm' -> '2,2'. */
export function formatMm(valueInMm: number, unit: Unit = 'mm'): string {
  return formatNumber(fromMm(valueInMm, unit), decimalsForUnit(unit));
}

/** mm -> texto con símbolo. Ej: '2,2m'. */
export function formatMmUnit(valueInMm: number, unit: Unit = 'mm'): string {
  return `${formatMm(valueInMm, unit)}${unitSymbol(unit)}`;
}

/** Par de medidas. Ej: '2,2×1,62m'. */
export function formatSize(widthMm: number, heightMm: number, unit: Unit = 'mm'): string {
  return `${formatMm(widthMm, unit)}×${formatMm(heightMm, unit)}${unitSymbol(unit)}`;
}

/** Área en m², formateada. */
export function formatAreaM2(widthMm: number, heightMm: number): string {
  return `${formatNumber((widthMm * heightMm) / 1e6, 3)} m²`;
}

export function unitLabel(unit: Unit): string {
  switch (unit) {
    case 'cm':
      return 'cm';
    case 'm':
      return 'metros';
    case 'mm':
    default:
      return 'mm';
  }
}

export function unitSymbol(unit: Unit): string {
  switch (unit) {
    case 'cm':
      return 'cm';
    case 'm':
      return 'm';
    case 'mm':
    default:
      return 'mm';
  }
}