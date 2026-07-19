const fs = require('fs');
const path = require('path');

function processLayout(filePath, isProf) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Ensure useTheme is imported
  if (!content.includes('useTheme')) {
    content = content.replace("import { useTranslation } from 'react-i18next';", "import { useTranslation } from 'react-i18next';\nimport { useTheme } from '@/context/ThemeContext';");
  }

  // Remove existing styles at the bottom
  content = content.replace(/const styles = StyleSheet\.create\(\{[\s\S]*\}\);/, '');

  // Add getStyles at the bottom
  const getStylesCode = `const getStyles = (colors: any) => StyleSheet.create({
  contenedorPrincipal: { flex: 1, backgroundColor: colors.background },
  contenedorFijoAbajo: { 
    borderTopWidth: 1, 
    borderTopColor: colors.border, 
    paddingBottom: 25, 
    paddingTop: 15, 
    backgroundColor: colors.card 
  },
  textoMenuAbajo: { color: colors.text, fontWeight: '600', fontSize: 16 },
  textoSalir: { color: '#FF3B30', fontWeight: 'bold', fontSize: 16 },
  contenedorIzquierdo: { marginLeft: 20, justifyContent: 'center' },
  logoImagen: { width: 42, height: 42, borderRadius: 21, overflow: 'hidden', resizeMode: 'cover' },
  contenedorDerecho: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  fotoPerfil: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#ffffff', marginRight: 15, backgroundColor: colors.border, overflow: 'hidden' },
  contenedorMenuBoton: { transform: [{ scale: 1.1 }], justifyContent: 'center', alignItems: 'center' }
});`;
  
  content += '\n' + getStylesCode + '\n';

  // Inject useTheme in MenuPersonalizado
  if (content.includes('function MenuPersonalizado(props: DrawerContentComponentProps) {')) {
    content = content.replace(
      'function MenuPersonalizado(props: DrawerContentComponentProps) {',
      `function MenuPersonalizado(props: DrawerContentComponentProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);`
    );
  }

  // Inject useTheme in the Layout component
  const layoutCompName = isProf ? 'EnrutadorProfesionista' : 'ClienteLayout';
  if (content.includes(`function ${layoutCompName}() {`)) {
    content = content.replace(
      `function ${layoutCompName}() {`,
      `function ${layoutCompName}() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);`
    );
  } else if (!isProf && content.includes(`export default function ClienteLayout() {`)) {
    content = content.replace(
      `export default function ClienteLayout() {`,
      `export default function ClienteLayout() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);`
    );
  }

  // Fix Drawer options
  const drawerRegex = /<Drawer[\s\S]*?screenOptions=\{\{([\s\S]*?)\}\}/;
  const match = content.match(drawerRegex);
  if (match) {
    const newOptions = `
          headerShown: false,
          drawerActiveTintColor: colors.primary,
          drawerActiveBackgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0eaff',
          drawerInactiveTintColor: colors.text,
          drawerPosition: 'right',
          drawerStyle: { width: 280, backgroundColor: colors.background },
          drawerLabelStyle: { fontSize: 16, fontWeight: '600' },
        `;
    content = content.replace(match[1], newOptions);
  }

  // Remove any stray references to Colors from theme/Colors to avoid undefined errors if removed
  content = content.replace(/Colors\.primary\[700\]/g, 'colors.primary');
  content = content.replace(/Colors\.primary\[100\]/g, "'#f0eaff'");
  content = content.replace(/Colors\.text\.secondary/g, 'colors.text');
  content = content.replace(/Colors\.neutral\[50\]/g, 'colors.background');
  
  // Fix Icon colors in MenuPersonalizado
  content = content.replace(/color="#5c4b8a"/g, 'color={colors.primary}');
  
  fs.writeFileSync(filePath, content);
}

processLayout('src/app/(cliente)/_layout.tsx', false);
processLayout('src/app/(profesionista)/_layout.tsx', true);
console.log('Layouts unified and dark mode added');
