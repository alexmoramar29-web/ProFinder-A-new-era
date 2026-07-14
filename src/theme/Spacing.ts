// ============================================================
// ProFinder Design System — Espaciado y Bordes
// ============================================================

export const Spacing = {
  // --- Escala de espaciado (base 4px) ---
  0:   0,
  1:   4,
  2:   8,
  3:   12,
  4:   16,
  5:   20,
  6:   24,
  7:   28,
  8:   32,
  10:  40,
  12:  48,
  14:  56,
  16:  64,
  20:  80,
  24:  96,

  // --- Aliases semánticos ---
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  '2xl': 48,
  '3xl': 64,

  // --- Márgenes de pantalla ---
  screen: {
    horizontal: 20,
    vertical:   24,
  },

  // --- Padding de componentes ---
  card:   20,
  input:  14,
  button: {
    sm: { horizontal: 14, vertical: 9  },
    md: { horizontal: 20, vertical: 13 },
    lg: { horizontal: 24, vertical: 16 },
  },
} as const;

export const Radius = {
  none:  0,
  xs:    4,
  sm:    6,
  md:    8,
  lg:    12,
  xl:    16,
  '2xl': 20,
  full:  9999,

  // --- Aliases de componentes ---
  button:  10,
  input:   8,
  card:    16,
  badge:   9999,
  avatar:  9999,
  modal:   20,
  chip:    9999,
} as const;

export const Shadow = {
  none: {},

  xs: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },

  sm: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  md: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  lg: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },

  // Sombra violeta para elementos primarios (botones, cards destacadas)
  brand: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;
