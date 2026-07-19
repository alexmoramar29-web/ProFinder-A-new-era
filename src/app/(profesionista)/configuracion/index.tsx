import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/theme/Colors';
import { Typography } from '@/theme/Typography';
import { Radius, Shadow, Spacing } from '@/theme/Spacing';
import NavbarProfesionista from '@/components/NavbarProfesionista';
import { useTheme } from '@/context/ThemeContext';

export default function ConfiguracionScreen() {
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme, colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  
  const router = useRouter();
  // Funciones visuales simuladas para los botones
 const cambiarContraseña = () => {
  router.push('/(profesionista)/configuracion/cambiar-contrasena' as any);
};

  const cambiarIdioma = async () => {
    // Si el idioma actual es inglés, lo pasamos a español. De lo contrario, a inglés.
    const nuevoIdioma = i18n.language === 'en' ? 'es' : 'en';
    await AsyncStorage.setItem('user-language', nuevoIdioma);
    i18n.changeLanguage(nuevoIdioma);
  };

  const abrirPrivacidad = () => {
    router.push('/(profesionista)/configuracion/terminos' as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral[50] }}>
      <NavbarProfesionista />
      <ScrollView style={styles.contenedorFondo} contentContainerStyle={styles.scroll}>
      
      <View style={styles.cabecera}>
        <Text style={styles.tituloSeccion}>{t('configuracionTitulo')}</Text>
        <Text style={styles.subtituloSeccion}>{t('configuracionSubtitulo')}</Text>
      </View>

      <Text style={styles.tituloBloque}>{t('preferenciasPantalla')}</Text>
      <View style={styles.bloqueAjustes}>
        <View style={[styles.filaAjuste, styles.lineaDivisora]}>
          <Text style={styles.textoFila}>{t('modoOscuro')}</Text>
          <Switch 
            value={isDark} 
            onValueChange={toggleTheme}
            trackColor={{ false: colors.neutral[200], true: colors.primary[300] }}
            thumbColor={isDark ? colors.primary[600] : '#FFFFFF'}
          />
        </View>
        <TouchableOpacity style={styles.filaAjuste} onPress={cambiarIdioma}>
          <Text style={styles.textoFila}>{t('idiomaAplicacion')}</Text>
          <Text style={styles.textoSecundario}>{i18n.language === 'en' ? 'English ❯' : 'Español ❯'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.tituloBloque}>{t('seguridadAlertas')}</Text>
      <View style={styles.bloqueAjustes}>
        <TouchableOpacity style={[styles.filaAjuste, styles.lineaDivisora]} onPress={cambiarContraseña}>
          <Text style={styles.textoFila}>{t('cambiarContrasenaBtn')}</Text>
          <Text style={styles.flecha}>❯</Text>
        </TouchableOpacity>
              </View>

      <Text style={styles.tituloBloque}>{t('acercaDe')}</Text>
      <View style={styles.bloqueAjustes}>
        <TouchableOpacity style={[styles.filaAjuste, styles.lineaDivisora]} onPress={abrirPrivacidad}>
          <Text style={styles.textoFila}>{t('terminosPrivacidad')}</Text>
          <Text style={styles.flecha}>❯</Text>
        </TouchableOpacity>
        <View style={styles.filaAjuste}>
          <Text style={styles.textoFila}>{t('versionApp')}</Text>
          <Text style={styles.textoSecundario}>1.0.0</Text>
        </View>
      </View>

      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  contenedorFondo: { flex: 1, backgroundColor: colors.neutral[50] },
  scroll: { padding: Spacing[5], paddingBottom: 50 },
  
  cabecera: { marginBottom: Spacing[6] },
  tituloSeccion: { ...Typography.styles.h2, fontWeight: '800', color: colors.primary[700], marginBottom: 5 },
  subtituloSeccion: { ...Typography.styles.body, color: colors.text.secondary },

  tituloBloque: { ...Typography.styles.overline, color: colors.text.disabled, textTransform: 'uppercase', marginBottom: Spacing[2], marginLeft: Spacing[2] },
  
  bloqueAjustes: { backgroundColor: colors.background.card, borderRadius: Radius.lg, marginBottom: Spacing[6], borderWidth: 1, borderColor: colors.border.default, ...Shadow.sm, overflow: 'hidden' },
  
  filaAjuste: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing[4], paddingHorizontal: Spacing[4], backgroundColor: colors.background.card },
  lineaDivisora: { borderBottomWidth: 1, borderBottomColor: colors.neutral[100] },
  
  textoFila: { ...Typography.styles.body, color: colors.text.primary, fontWeight: '600' },
  textoSecundario: { ...Typography.styles.body, color: colors.text.secondary },
  flecha: { fontSize: 16, color: colors.text.disabled, fontWeight: 'bold' }
});