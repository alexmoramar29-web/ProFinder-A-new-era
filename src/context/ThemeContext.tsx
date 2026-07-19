import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Colors } from '../theme/Colors';

// ============================================================
// Paleta OSCURA — misma estructura que Colors para drop-in
// ============================================================
export const DarkColors = {
  primary: { ...Colors.primary },

  neutral: {
    0:   '#121212',
    50:  '#1A1A2E',
    100: '#1E1E30',
    200: '#2A2A3C',
    300: '#3A3A4C',
    400: '#6B7280',
    500: '#9CA3AF',
    600: '#D1D5DB',
    700: '#E5E7EB',
    800: '#F3F4F6',
    900: '#F9FAFB',
  },

  success: { ...Colors.success },
  warning: { ...Colors.warning },
  error:   { ...Colors.error },
  info:    { ...Colors.info },

  background: {
    app:     '#0F0F1A',
    card:    '#1A1A2E',
    input:   '#1E1E30',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },

  text: {
    primary:   '#F0F0F5',
    secondary: '#A0A0B8',
    disabled:  '#5A5A6E',
    inverse:   '#111827',
    brand:     '#A78BFA',
  },

  border: {
    default: '#2A2A3C',
    focus:   '#A78BFA',
    error:   '#EF4444',
  },

  roles: {
    cliente:       { main: '#A78BFA', light: '#1A1A2E', badge: '#2A2A3C' },
    profesionista: { main: '#F0F0F5', light: '#1E1E30', badge: '#2A2A3C' },
  },

  verification: {
    verified: { bg: '#064E3B', text: '#6EE7B7' },
    pending:  { bg: '#78350F', text: '#FCD34D' },
    rejected: { bg: '#7F1D1D', text: '#FCA5A5' },
  },
} as const;

// ============================================================
// Tipo del contexto
// ============================================================
interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  colors: typeof Colors;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
  colors: Colors,
});

// ============================================================
// Provider
// ============================================================
const STORAGE_KEY = 'profinder-dark-mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  // Cargar preferencia al iniciar
  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'true') setIsDark(true);
      } catch (e) {
        console.log('Error loading theme preference', e);
      }
    };
    load();
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next ? 'true' : 'false');
    } catch (e) {
      console.log('Error saving theme preference', e);
    }
  };

  const colors = isDark ? (DarkColors as unknown as typeof Colors) : Colors;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ============================================================
// Hook de acceso rápido
// ============================================================
export const useTheme = () => useContext(ThemeContext);
