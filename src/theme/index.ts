// ============================================================
// ProFinder Design System — Punto de entrada único
// Importa desde aquí: import { theme } from '@/theme'
// ============================================================

export { C, Colors } from './Colors';
export { Radius, Shadow, Spacing } from './Spacing';
export { Typography } from './Typography';

// Objeto unificado (opcional)
import { Colors } from './Colors';
import { Radius, Shadow, Spacing } from './Spacing';
import { Typography } from './Typography';

export const theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  radius: Radius,
  shadow: Shadow,
} as const;

export type Theme = typeof theme;
