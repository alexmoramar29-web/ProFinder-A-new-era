import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

export default function PrivacidadScreen() {
  const { isDark, colors } = useTheme();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.contenedorFondo}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.tarjeta}>
          <TouchableOpacity onPress={() => router.replace('/(profesionista)/configuracion')} style={styles.botonAtrasInline}>
            <Text style={styles.flechaAtras}>❮</Text>
            <Text style={styles.textoAtrasInline}>{t('atras')}</Text>
          </TouchableOpacity>

          <Text style={styles.titulo}>{t('privacidadTituloPrincipal')}</Text>
          <Text style={styles.fechaActualizacion}>{t('privacidadFecha')}</Text>
          
          <Text style={styles.seccionTitulo}>1. {t('privacidadSec1Titulo')}</Text>
          <Text style={styles.textoGeneral}>{t('privacidadSec1Texto')}</Text>

          <Text style={styles.seccionTitulo}>2. {t('privacidadSec2Titulo')}</Text>
          <Text style={styles.textoGeneral}>{t('privacidadSec2Texto')}</Text>

          <Text style={styles.seccionTitulo}>3. {t('privacidadSec3Titulo')}</Text>
          <Text style={styles.textoGeneral}>{t('privacidadSec3Texto')}</Text>

          <Text style={styles.seccionTitulo}>4. {t('privacidadSec4Titulo')}</Text>
          <Text style={styles.textoGeneral}>{t('privacidadSec4Texto')}</Text>

          <Text style={styles.seccionTitulo}>5. {t('privacidadSec5Titulo')}</Text>
          <Text style={styles.textoGeneral}>{t('privacidadSec5Texto')}</Text>

          <Text style={styles.seccionTitulo}>6. {t('privacidadSec6Titulo')}</Text>
          <Text style={styles.textoGeneral}>{t('privacidadSec6Texto')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  contenedorFondo: { flex: 1, backgroundColor: colors.neutral[50] },
  scroll: { padding: 20, paddingBottom: 50 },
  tarjeta: { 
    backgroundColor: colors.neutral[0], 
    padding: 20, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: colors.border.default, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2 
  },
  botonAtrasInline: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  flechaAtras: { fontSize: 20, color: '#5c4b8a', fontWeight: 'bold', marginRight: 5 },
  textoAtrasInline: { fontSize: 16, color: '#5c4b8a', fontWeight: 'bold' },
  titulo: { fontSize: 24, fontWeight: 'bold', color: colors.text.primary, marginBottom: 5, textAlign: 'center' },
  fechaActualizacion: { fontSize: 13, color: colors.text.secondary, textAlign: 'center', marginBottom: 25, fontStyle: 'italic' },
  seccionTitulo: { fontSize: 16, fontWeight: 'bold', color: '#5c4b8a', marginTop: 15, marginBottom: 8 },
  textoGeneral: { fontSize: 14, color: '#48484A', lineHeight: 22, textAlign: 'justify', marginBottom: 10 }
});
