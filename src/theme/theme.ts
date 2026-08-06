// src/theme/theme.ts
// Paleta "taller de carpintería": tonos cálidos de madera para la UI,
// y una paleta saturada y distinguible para las piezas del plano de corte
// (así cada corte se reconoce a simple vista, en cualquier tamaño de pantalla).

export const colors = {
  // Base
  background: '#F6F2EC',
  surface: '#FFFFFF',
  surfaceAlt: '#EFE9E0',
  surfaceSunken: '#E4DDD1', // "canal" de kerf dentro de la placa

  // Marca
  primary: '#C2703D',
  primaryDark: '#9C5430',
  primaryLight: '#F3E0D2',

  // Acento secundario (verde salvia, para variar del terracota)
  accent: '#6B8F71',
  accentDark: '#4F6B54',
  accentLight: '#E1EBE2',

  // Oscuro / headers
  dark: '#26211D',
  darkAlt: '#3A322B',
  darkLine: '#4A413A',

  // Texto
  text: '#1C1917',
  textMuted: '#7A7168',
  textOnDark: '#F6F2EC',
  textOnDarkMuted: '#C9C0B5',

  border: '#E4DDD1',
  borderStrong: '#D2C8B9',

  // Estados
  success: '#2E8B57',
  successLight: '#E1F3E8',
  danger: '#C43D3D',
  dangerLight: '#FBE4E4',
  warning: '#C98A1E',
  warningLight: '#FBEEDA',
  info: '#3B6FA6',
  infoLight: '#E3EDF6',

  // Veta / grain — usado en los selectores e íconos de dirección de veta
  grainLine: '#9C5430',
  grainActiveBg: '#C2703D',
  grainInactiveBg: '#EFE9E0',
    // Guía de corte paso a paso
  stepActive: '#C43D3D',                   // el corte que estás por hacer
  stepDone: '#2E8B57',                     // cortes ya hechos
  stepPanelFill: 'rgba(201,138,30,0.20)',  // panel resaltado
  stepPanelStroke: '#C98A1E',
  offcutFill: 'rgba(122,113,104,0.16)',    // sobrante reutilizable
  offcutStroke: '#A79C8E',
};

// Paleta para las piezas del plano de corte. 10 colores bien diferenciados
// entre sí, todos con contraste suficiente para texto blanco encima.
export const cutPalette: string[] = [
  '#C2703D', // terracota
  '#3E6FA6', // azul
  '#4F8F6B', // verde
  '#8B5FA8', // violeta
  '#B85C4A', // ladrillo
  '#4A8B8B', // teal
  '#A6763E', // ocre
  '#6D6FA0', // índigo
  '#A64F72', // ciruela
  '#5C8A3E', // oliva
];

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 20,
  full: 999,
};

export const shadow = {
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  raised: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 6,
  },
};

// `as const` en cada entrada para que fontWeight quede tipado como literal
// ('700', '800', etc.) y no como `string` genérico — así se puede spreadear
// directo en un StyleSheet (TextStyle) sin que TypeScript se queje.
export const typography = {
  display: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 } as const,
  h1: { fontSize: 20, fontWeight: '800' } as const,
  h2: { fontSize: 16, fontWeight: '700' } as const,
  h3: { fontSize: 14, fontWeight: '700' } as const,
  body: { fontSize: 14, fontWeight: '500' } as const,
  bodySmall: { fontSize: 12, fontWeight: '500' } as const,
  caption: { fontSize: 11, fontWeight: '600' } as const,
  tiny: { fontSize: 10, fontWeight: '600' } as const,
};

// `as const` acá es lo que importa de verdad: expo-linear-gradient tipa su
// prop `colors` como una tupla de mínimo 2 colores (readonly [string, string, ...]),
// no como string[] a secas. Sin el `as const`, TypeScript infiere string[] y
// te va a tirar error de tipos al pasarlo a <LinearGradient colors={...} />.
export const gradients = {
  header: ['#2E2822', '#1A1613'] as const,
  primaryButton: ['#D07C46', '#B25E30'] as const,
  darkCard: ['#3A322B', '#26211D'] as const,
  accentButton: ['#7DA184', '#5C7F62'] as const,
};