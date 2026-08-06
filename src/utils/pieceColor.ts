//src/utils/pieceColor.ts
import { cutPalette } from '../theme/theme';

// Hash simple y determinístico: el mismo string siempre da el mismo número.
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Clave única por "tipo" de pieza: mismo nombre + mismas medidas originales.
// Así una pieza "Estante" de 600x300 siempre es del mismo color, en cualquier
// placa donde aparezca, y se puede armar una leyenda global sin duplicados.
export function pieceKey(name: string, width: number, height: number): string {
  return `${name}__${width}x${height}`;
}

export function colorForPiece(name: string, width: number, height: number): string {
  const key = pieceKey(name, width, height);
  return cutPalette[hashString(key) % cutPalette.length];
}