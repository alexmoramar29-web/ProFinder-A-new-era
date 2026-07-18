import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, LayoutAnimation, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, UIManager, View } from 'react-native';
import { supabase } from '../../../lib/supabase';
import NavbarCliente from '../../../components/NavbarCliente';
import { Colors } from '../../../theme/Colors';

// Habilitar animación para Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AyudaScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [preguntaAbierta, setPreguntaAbierta] = useState<number | null>(null);
  const [categoriaActiva, setCategoriaActiva] = useState<string>(t('Todas'));
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

  const categorias = [t('Todas'), t('Cuenta'), t('Citas'), t('Chat'), t('Soporte')];
  const listaPreguntas = [
    { id: 1, categoria: t('Cuenta'), pregunta: t('¿Cómo actualizo mi información de perfil?'), respuesta: t('Ve a la pestaña "Perfil" y selecciona el botón "Editar Perfil" para cambiar tu foto, nombre o número de teléfono.') },
    { id: 2, categoria: t('Citas'), pregunta: t('¿Cómo puedo solicitar una cita con un profesionista?'), respuesta: t('Busca al profesionista en la pantalla principal, entra a su perfil y en la sección "Agendar Cita" selecciona la fecha y hora que necesites.') },
    { id: 3, categoria: t('Citas'), pregunta: t('¿Dónde veo si mi cita fue aceptada?'), respuesta: t('En la pestaña de "Citas" puedes ver todas tus solicitudes. Si el profesionista acepta, pasará a la sección de "Próximos Trabajos".') },
    { id: 4, categoria: t('Chat'), pregunta: t('¿En qué momento puedo usar el chat?'), respuesta: t('El chat privado se habilita automáticamente en la pestaña "Chat" únicamente cuando el profesionista acepta tu solicitud de cita.') },
    { id: 5, categoria: t('Soporte'), pregunta: t('Tengo un problema técnico, ¿qué hago?'), respuesta: t('Puedes contactarnos directamente desde los botones de WhatsApp o Correo en la parte superior de esta pantalla. Atendemos problemas técnicos las 24 horas.') },
  ];

  const preguntasFiltradas = categoriaActiva === t('Todas') ? listaPreguntas : listaPreguntas.filter((item) => item.categoria === categoriaActiva);

  return (
    <View style={styles.container}>
      {/* NAVBAR */}
      <NavbarCliente />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.tarjetaSoporte}>
          <Text style={styles.tituloTarjetaSoporte}>{t('¿Tienes algún problema?')}</Text>
          <View style={styles.contenedorBotonesContacto}>
            <TouchableOpacity style={[styles.botonContacto, styles.botonWhatsApp]} onPress={() => Linking.openURL('https://wa.me/526141160001')}><Text style={styles.textoBoton}>{t('WhatsApp')}</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.botonContacto, styles.botonCorreo]} onPress={() => Linking.openURL('mailto:soporte@profinder.com')}><Text style={styles.textoBotonCorreo}>{t('Correo')}</Text></TouchableOpacity>
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
  navbar: { height: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, backgroundColor: Colors.primary[600] },
  navbarTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  rightHeaderContainer: { flexDirection: 'row', alignItems: 'center' },
  profileCircle: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: '#fff' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  sideMenu: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 220, backgroundColor: '#fff', paddingTop: 80, paddingHorizontal: 20 },
  menuItem: { paddingVertical: 15 },
  menuText: { fontSize: 16, color: '#333' },
  scroll: { padding: 20 },
  tarjetaSoporte: { backgroundColor: Colors.primary[600], borderRadius: 12, padding: 20, marginBottom: 25 },
  tituloTarjetaSoporte: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  contenedorBotonesContacto: { flexDirection: 'row' },
  botonContacto: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  botonWhatsApp: { backgroundColor: '#25D366', marginRight: 10 },
  botonCorreo: { backgroundColor: '#FFF', marginLeft: 10 },
  textoBoton: { color: '#FFF', fontWeight: 'bold' },
  textoBotonCorreo: { color: Colors.primary[600], fontWeight: 'bold' },
  contenedorFiltros: { flexDirection: 'row', marginBottom: 20, maxHeight: 40 },
  botonFiltro: { backgroundColor: '#DEE4EA', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginRight: 10, justifyContent: 'center' },
  botonFiltroActivo: { backgroundColor: Colors.primary[600] },
  textoFiltro: { color: '#555' },
  textoFiltroActivo: { color: '#FFF' },
  contenedorAcordeon: { backgroundColor: '#FFF', borderRadius: 10, marginBottom: 10, padding: 16, borderWidth: 1, borderColor: '#D1D9E0' },
  botonPregunta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  textoPregunta: { fontWeight: '600', color: '#333', flex: 1, paddingRight: 10 },
  flecha: { color: Colors.primary[600], fontWeight: 'bold' },
  contenedorRespuesta: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  textoRespuesta: { color: '#666', fontSize: 14, lineHeight: 20 }
});