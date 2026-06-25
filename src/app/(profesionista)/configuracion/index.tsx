import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function ConfiguracionScreen() {
  const [modoOscuro, setModoOscuro] = useState(false);
  const [notificaciones, setNotificaciones] = useState(true);

  // Funciones visuales simuladas para los botones
  const cambiarContrasena = () => {
    Alert.alert('Cambiar Contraseña', 'Te enviaremos un correo con un enlace para restablecer tu contraseña de forma segura.');
  };

  const cambiarIdioma = () => {
    Alert.alert('Idioma', 'Aquí se abrirá una lista para elegir entre Español, Inglés, etc.');
  };

  const abrirPrivacidad = () => {
    Alert.alert('Privacidad', 'Aquí se mostrarán los términos y condiciones de la aplicación.');
  };

  return (
    <ScrollView style={styles.contenedorFondo} contentContainerStyle={styles.scroll}>
      
      <View style={styles.cabecera}>
        <Text style={styles.tituloSeccion}>Configuración</Text>
        <Text style={styles.subtituloSeccion}>Ajusta tus preferencias de la aplicación.</Text>
      </View>

      <Text style={styles.tituloBloque}>Preferencias de Pantalla</Text>
      <View style={styles.bloqueAjustes}>
        <View style={[styles.filaAjuste, styles.lineaDivisora]}>
          <Text style={styles.textoFila}>Modo Oscuro</Text>
          <Switch 
            value={modoOscuro} 
            onValueChange={setModoOscuro}
            trackColor={{ false: '#E5E5EA', true: '#5c4b8a' }}
            thumbColor={'#FFFFFF'}
          />
        </View>
        <TouchableOpacity style={styles.filaAjuste} onPress={cambiarIdioma}>
          <Text style={styles.textoFila}>Idioma de la Aplicación</Text>
          <Text style={styles.textoSecundario}>Español ❯</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.tituloBloque}>Seguridad y Alertas</Text>
      <View style={styles.bloqueAjustes}>
        <TouchableOpacity style={[styles.filaAjuste, styles.lineaDivisora]} onPress={cambiarContrasena}>
          <Text style={styles.textoFila}>Cambiar Contraseña</Text>
          <Text style={styles.flecha}>❯</Text>
        </TouchableOpacity>
        <View style={styles.filaAjuste}>
          <Text style={styles.textoFila}>Notificaciones Push</Text>
          <Switch 
            value={notificaciones} 
            onValueChange={setNotificaciones}
            trackColor={{ false: '#E5E5EA', true: '#5c4b8a' }}
            thumbColor={'#FFFFFF'}
          />
        </View>
      </View>

      <Text style={styles.tituloBloque}>Acerca de</Text>
      <View style={styles.bloqueAjustes}>
        <TouchableOpacity style={[styles.filaAjuste, styles.lineaDivisora]} onPress={abrirPrivacidad}>
          <Text style={styles.textoFila}>Términos y Privacidad</Text>
          <Text style={styles.flecha}>❯</Text>
        </TouchableOpacity>
        <View style={styles.filaAjuste}>
          <Text style={styles.textoFila}>Versión de la App</Text>
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