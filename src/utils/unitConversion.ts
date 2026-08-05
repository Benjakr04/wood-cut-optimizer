//unitConversion.ts
// Funciones de conversión entre unidades de medida, para la UI y la exportación.
import { Unit } from '../algorithm/packing';

/**
 * Convierte un valor de una unidad a milímetros.
 * @param value número en la unidad original
 * @param from unidad original
 * @returns valor convertido a mm
 */
export function toMm(value: number, from: Unit = 'mm'): number {
  switch (from) {
    case 'mm':
      return value;
    case 'cm':
      return value * 10;
    case 'm':
      return value * 1000;
    default:
      return value;
  }
}

/**
 * Convierte un valor de milímetros a otra unidad.
 * @param valueInMm número en milímetros
 * @param to unidad destino
 * @returns valor convertido a la unidad destino
 */
export function fromMm(valueInMm: number, to: Unit = 'mm'): number {
  switch (to) {
    case 'mm':
      return valueInMm;
    case 'cm':
      return valueInMm / 10;
    case 'm':
      return valueInMm / 1000;
    default:
      return valueInMm;
  }
}

/**
 * Etiqueta legible de la unidad.
 */
export function unitLabel(unit: Unit): string {
  switch (unit) {
    case 'mm':
      return 'mm';
    case 'cm':
      return 'cm';
    case 'm':
      return 'metros';
  }
}

/**
 * Símbolo corto de la unidad.
 */
export function unitSymbol(unit: Unit): string {
  switch (unit) {
    case 'mm':
      return 'mm';
    case 'cm':
      return 'cm';
    case 'm':
      return 'm';
  }
}