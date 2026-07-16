import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Image, LayoutAnimation, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, UIManager, View } from 'react-native';
import { supabase } from '../../../lib/supabase';
import NavbarCliente from '../../../components/NavbarCliente';

// Habilitar animación para Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AyudaScreen() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [preguntaAbierta, setPreguntaAbierta] = useState<number | null>(null);
  const [categoriaActiva, setCategoriaActiva] = useState<string>('Todas');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const cargarFotoPerfil = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('clientes').select('avatar_url').eq('id', user.id).single();
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    }
  };
  useFocusEffect(useCallback(() => { cargarFotoPerfil(); }, []));

  const togglePregunta = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPreguntaAbierta(preguntaAbierta === id ? null : id);
  };

  const categorias = ['Todas', 'Cuenta', 'Servicios', 'Pagos'];
  const listaPreguntas = [
    { id: 1, categoria: 'Cuenta', pregunta: '¿Cómo cambio mi contraseña?', respuesta: 'Ve a Configuración > Seguridad y selecciona Cambiar Contraseña.' },
    { id: 2, categoria: 'Servicios', pregunta: '¿Cómo agrego un servicio nuevo?', respuesta: 'En la sección Servicios, pulsa el botón "+" para dar de alta uno nuevo.' },
    { id: 3, categoria: 'Pagos', pregunta: '¿Cómo retiro mis ganancias?', respuesta: 'Tus pagos se depositan automáticamente en la cuenta bancaria registrada.' },
  ];

  const preguntasFiltradas = categoriaActiva === 'Todas' ? listaPreguntas : listaPreguntas.filter((item) => item.categoria === categoriaActiva);

  return (
    <View style={styles.container}>
      {/* NAVBAR */}
      <NavbarCliente />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.tarjetaSoporte}>
          <Text style={styles.tituloTarjetaSoporte}>¿Tienes algún problema?</Text>
          <View style={styles.contenedorBotonesContacto}>
            <TouchableOpacity style={[styles.botonContacto, styles.botonWhatsApp]} onPress={() => Linking.openURL('https://wa.me/526141160001')}><Text style={styles.textoBoton}>WhatsApp</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.botonContacto, styles.botonCorreo]} onPress={() => Linking.openURL('mailto:soporte@profinder.com')}><Text style={styles.textoBotonCorreo}>Correo</Text></TouchableOpacity>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contenedorFiltros}>
          {categorias.map((cat) => (
            <TouchableOpacity key={cat} style={[styles.botonFiltro, categoriaActiva === cat && styles.botonFiltroActivo]} onPress={() => setCategoriaActiva(cat)}>
              <Text style={[styles.textoFiltro, categoriaActiva === cat && styles.textoFiltroActivo]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {preguntasFiltradas.map((item) => (
          <View key={item.id} style={styles.contenedorAcordeon}>
            <TouchableOpacity style={styles.botonPregunta} onPress={() => togglePregunta(item.id)}>
              <Text style={styles.textoPregunta}>{item.pregunta}</Text>
              <Text style={styles.flecha}>{preguntaAbierta === item.id ? '▼' : '▶'}</Text>
            </TouchableOpacity>
            {preguntaAbierta === item.id && (
              <View style={styles.contenedorRespuesta}><Text style={styles.textoRespuesta}>{item.respuesta}</Text></View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F5F9' },
  navbar: { height: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, backgroundColor: '#005bb5' },
  navbarTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  rightHeaderContainer: { flexDirection: 'row', alignItems: 'center' },
  profileCircle: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: '#fff' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  sideMenu: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 220, backgroundColor: '#fff', paddingTop: 80, paddingHorizontal: 20 },
  menuItem: { paddingVertical: 15 },
  menuText: { fontSize: 16, color: '#333' },
  scroll: { padding: 20 },
  tarjetaSoporte: { backgroundColor: '#005bb5', borderRadius: 12, padding: 20, marginBottom: 25 },
  tituloTarjetaSoporte: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  contenedorBotonesContacto: { flexDirection: 'row' },
  botonContacto: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  botonWhatsApp: { backgroundColor: '#25D366', marginRight: 10 },
  botonCorreo: { backgroundColor: '#FFF', marginLeft: 10 },
  textoBoton: { color: '#FFF', fontWeight: 'bold' },
  textoBotonCorreo: { color: '#005bb5', fontWeight: 'bold' },
  contenedorFiltros: { flexDirection: 'row', marginBottom: 20, maxHeight: 40 },
  botonFiltro: { backgroundColor: '#DEE4EA', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginRight: 10, justifyContent: 'center' },
  botonFiltroActivo: { backgroundColor: '#005bb5' },
  textoFiltro: { color: '#555' },
  textoFiltroActivo: { color: '#FFF' },
  contenedorAcordeon: { backgroundColor: '#FFF', borderRadius: 10, marginBottom: 10, padding: 16, borderWidth: 1, borderColor: '#D1D9E0' },
  botonPregunta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  textoPregunta: { fontWeight: '600', color: '#333' },
  flecha: { color: '#005bb5', fontWeight: 'bold' },
  contenedorRespuesta: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  textoRespuesta: { color: '#666', fontSize: 14 }
});