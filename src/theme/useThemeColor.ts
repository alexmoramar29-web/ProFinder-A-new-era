import { useColorScheme } from 'react-native';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: 'background' | 'text' | string
) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }

  // Fallback para evitar errores en archivos vacíos de temas
  if (colorName === 'background') {
    return theme === 'dark' ? '#121212' : '#ffffff';
  }
  return theme === 'dark' ? '#ffffff' : '#000000';
}
