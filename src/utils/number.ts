//src/utils/number.ts
// Manejo de números con decimales tolerante: acepta coma o punto y muestra
// siempre con coma, que es como se escribe acá.

/** Deja escribir solo dígitos y UN separador decimal (coma o punto). */
export function sanitizeDecimalInput(text: string): string {
  const onlyValid = text.replace(/[^0-9.,]/g, '');
  let seenSeparator = false;
  let out = '';
  for (const ch of onlyValid) {
    if (ch === '.' || ch === ',') {
      if (seenSeparator) continue;
      seenSeparator = true;
    }
    out += ch;
  }
  return out;
}

/** Solo dígitos (para cantidades). */
export function sanitizeIntInput(text: string): string {
  return text.replace(/[^0-9]/g, '');
}

/** '2,2' | '2.2' | 2.2 -> 2.2 · devuelve NaN si no se puede leer. */
export function parseDecimal(text: string | number): number {
  if (typeof text === 'number') return Number.isFinite(text) ? text : NaN;
  const normalized = String(text).trim().replace(/\s/g, '').replace(',', '.');
  if (!normalized || normalized === '.') return NaN;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : NaN;
}

export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/** Formatea sin ceros al pepe: 2.20 -> '2,2' · 1620 -> '1620'. */
export function formatNumber(value: number, maxDecimals = 2, separator: ',' | '.' = ','): string {
  if (!Number.isFinite(value)) return '0';
  let text = roundTo(value, maxDecimals).toFixed(maxDecimals);
  if (text.includes('.')) {
    text = text.replace(/0+$/, '').replace(/\.$/, '');
  }
  return separator === ',' ? text.replace('.', ',') : text;
}