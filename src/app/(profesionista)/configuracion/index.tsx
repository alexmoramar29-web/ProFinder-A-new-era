import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';


export default function ConfiguracionScreen() {
  const { t, i18n } = useTranslation();
  const [modoOscuro, setModoOscuro] = useState(false);
  const [notificaciones, setNotificaciones] = useState(true);
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
    router.push('/(profesionista)/configuracion/privacidad' as any);
  };

  return (
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
            value={modoOscuro} 
            onValueChange={setModoOscuro}
            trackColor={{ false: '#E5E5EA', true: '#5c4b8a' }}
            thumbColor={'#FFFFFF'}
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
        <View style={styles.filaAjuste}>
          <Text style={styles.textoFila}>{t('notificacionesPush')}</Text>
          <Switch 
            value={notificaciones} 
            onValueChange={setNotificaciones}
            trackColor={{ false: '#E5E5EA', true: '#5c4b8a' }}
            thumbColor={'#FFFFFF'}
          />
        </View>
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
  );
}

const styles = StyleSheet.create({
  contenedorFondo: { flex: 1, backgroundColor: '#FAFAFC' },
  scroll: { padding: 20, paddingBottom: 50 },
  
  cabecera: { marginBottom: 25 },
  tituloSeccion: { fontSize: 26, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 5 },
  subtituloSeccion: { fontSize: 15, color: '#8E8E93' },

  tituloBloque: { fontSize: 14, fontWeight: 'bold', color: '#8E8E93', textTransform: 'uppercase', marginBottom: 8, marginLeft: 5 },
  
  bloqueAjustes: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 25, borderWidth: 1, borderColor: '#E5E5EA', overflow: 'hidden' },
  
  filaAjuste: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#FFFFFF' },
  lineaDivisora: { borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  
  textoFila: { fontSize: 16, color: '#1C1C1E', fontWeight: '500' },
  textoSecundario: { fontSize: 16, color: '#8E8E93' },
  flecha: { fontSize: 16, color: '#C7C7CC', fontWeight: 'bold' }
});