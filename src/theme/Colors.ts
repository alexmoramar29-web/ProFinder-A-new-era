// ============================================================
// ProFinder Design System — Tokens de Color
// Paleta: "Professional Velocity" extraída de los mockups
// ============================================================

export const Colors = {
  // --- Colores primarios de marca ---
  primary: {
    50:  '#F5F3FF',  // fondo sutil violeta (secondary del mockup)
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED',  // PRIMARY principal (#7C3AED del mockup)
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },

  // --- Escala de grises / neutrales ---
  neutral: {
    0:   '#FFFFFF',
    50:  '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',  // Neutral #6B7280 del mockup
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',  // Tertiary #111827 del mockup
  },

  // --- Semánticos ---
  success: {
    light: '#D1FAE5',
    main:  '#10B981',
    dark:  '#065F46',
  },
  warning: {
    light: '#FEF3C7',
    main:  '#F59E0B',
    dark:  '#92400E',
  },
  error: {
    light: '#FEE2E2',
    main:  '#EF4444',
    dark:  '#991B1B',
  },
  info: {
    light: '#DBEAFE',
    main:  '#3B82F6',
    dark:  '#1E40AF',
  },

  // --- Aliases semánticos de UI ---
  background: {
    app:     '#F5F3FF',  // fondo general app (secondary del mockup)
    card:    '#FFFFFF',
    input:   '#FFFFFF',
    overlay: 'rgba(17, 24, 39, 0.5)',
  },

  text: {
    primary:   '#111827',  // Tertiary del mockup
    secondary: '#6B7280',  // Neutral del mockup
    disabled:  '#9CA3AF',
    inverse:   '#FFFFFF',
    brand:     '#7C3AED',  // Primary violeta
  },

  border: {
    default: '#E5E7EB',
    focus:   '#7C3AED',
    error:   '#EF4444',
  },

  // --- Roles de usuario (diferenciación visual) ---
  roles: {
    cliente: {
      main:  '#7C3AED',
      light: '#F5F3FF',
      badge: '#EDE9FE',
    },
    profesionista: {
      main:  '#111827',
      light: '#F3F4F6',
      badge: '#E5E7EB',
    },
  },

  // --- Verificación de profesionistas ---
  verification: {
    verified: { bg: '#D1FAE5', text: '#065F46' },
    pending:  { bg: '#FEF3C7', text: '#92400E' },
    rejected: { bg: '#FEE2E2', text: '#991B1B' },
  },
} as const;

// Alias de un solo nivel para conveniencia
export const C = Colors;
