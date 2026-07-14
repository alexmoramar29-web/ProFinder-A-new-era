// ============================================================
// ProFinder Design System — Tipografía
// Fuente: Plus Jakarta Sans (igual que los mockups)
// ============================================================


// En React Native usamos las fuentes del sistema como fallback
// hasta que se cargue Plus Jakarta Sans via expo-font
const fontFamily = {
  regular:    'PlusJakartaSans_400Regular',
  medium:     'PlusJakartaSans_500Medium',
  semiBold:   'PlusJakartaSans_600SemiBold',
  bold:       'PlusJakartaSans_700Bold',
  extraBold:  'PlusJakartaSans_800ExtraBold',
};

export const Typography = {
  // --- Escala de tamaños ---
  size: {
    xs:   10,
    sm:   12,
    base: 14,
    md:   16,
    lg:   18,
    xl:   20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
  },

  // --- Pesos ---
  weight: {
    regular:   '400' as const,
    medium:    '500' as const,
    semiBold:  '600' as const,
    bold:      '700' as const,
    extraBold: '800' as const,
  },

  // --- Line heights ---
  lineHeight: {
    tight:   1.2,
    snug:    1.35,
    normal:  1.5,
    relaxed: 1.65,
  },

  // --- Letter spacing ---
  tracking: {
    tight:  -0.5,
    normal:  0,
    wide:    0.3,
    wider:   0.6,
    widest:  1.2,
  },

  // --- Estilos predefinidos (shortcuts) ---
  styles: {
    // Encabezados
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
      lineHeight: 40,
    },
    h2: {
      fontSize: 28,
      fontWeight: '700' as const,
      letterSpacing: -0.3,
      lineHeight: 36,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600' as const,
      letterSpacing: -0.2,
      lineHeight: 32,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    h5: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 26,
    },

    // Cuerpo
    bodyLg: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    body: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 22,
    },
    bodySm: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 18,
    },

    // Etiquetas y extras
    label: {
      fontSize: 12,
      fontWeight: '600' as const,
      letterSpacing: 0.4,
      lineHeight: 16,
    },
    caption: {
      fontSize: 11,
      fontWeight: '400' as const,
      lineHeight: 15,
    },
    overline: {
      fontSize: 10,
      fontWeight: '600' as const,
      letterSpacing: 1.0,
      lineHeight: 14,
      textTransform: 'uppercase' as const,
    },

    // Botones
    btnLg: {
      fontSize: 16,
      fontWeight: '600' as const,
      letterSpacing: 0.2,
    },
    btn: {
      fontSize: 14,
      fontWeight: '600' as const,
      letterSpacing: 0.2,
    },
    btnSm: {
      fontSize: 12,
      fontWeight: '600' as const,
      letterSpacing: 0.2,
    },

    // Precio (como en los mockups)
    price: {
      fontSize: 20,
      fontWeight: '700' as const,
      lineHeight: 26,
    },
  },

  // Familias (usar con useFonts de expo-font)
  family: fontFamily,
} as const;
