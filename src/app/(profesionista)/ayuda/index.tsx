import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/theme/Colors';
import { Typography } from '@/theme/Typography';
import { Radius, Shadow, Spacing } from '@/theme/Spacing';
import NavbarProfesionista from '@/components/NavbarProfesionista';

// 1. Aquí están tus preguntas, ahora separadas por categorías
export default function AyudaScreen() {
  const { t } = useTranslation();

  const listaPreguntas = [
    { id: 1, categoria: t('Cuenta', 'Cuenta'), pregunta: t('¿Cómo actualizo mi información de perfil?'), respuesta: t('En el menú lateral, selecciona "Perfil" para actualizar tu foto, biografía y demás datos de contacto.') },
    { id: 2, categoria: t('Servicios', 'Servicios'), pregunta: t('¿Cómo agrego un nuevo servicio?'), respuesta: t('Ve a la pestaña "Servicios", pulsa el botón "+" y completa el formulario con el título, descripción y precio base.') },
    { id: 3, categoria: t('Citas', 'Citas'), pregunta: t('¿Cómo acepto o rechazo una solicitud de cita?'), respuesta: t('En la pestaña "Solicitudes" verás las citas pendientes. Abre los detalles de cada cliente y usa los botones de "Aceptar" o "Rechazar".') },
    { id: 4, categoria: t('Citas', 'Citas'), pregunta: t('¿Cómo indico que ya terminé un trabajo?'), respuesta: t('Entra al detalle de la cita aceptada en tu calendario y cambia su estado a "Finalizado".') },
    { id: 5, categoria: t('Chat', 'Chat'), pregunta: t('¿Cómo funciona el chat con el cliente?'), respuesta: t('Al aceptar una solicitud de cita, se abrirá un chat privado en la pestaña "Chat" para coordinar los últimos detalles.') },
  ];

  const categorias = [t('Todas', 'Todas'), t('Cuenta', 'Cuenta'), t('Servicios', 'Servicios'), t('Citas', 'Citas'), t('Chat', 'Chat')];

  const [preguntaAbierta, setPreguntaAbierta] = useState<number | null>(null);
  const [categoriaActiva, setCategoriaActiva] = useState<string>(t('Todas', 'Todas'));

  const enviarCorreoSoporte = () => {
    const correo = 'soporte@profinder.com';
    const asunto = t('asuntoSoporte');
    const cuerpo = t('cuerpoSoporteCorreo');
    Linking.openURL(`mailto:${correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`);
  };

  const enviarWhatsAppSoporte = async () => {
    //aqui se incluye el código de país como el 52 de México
    const numero = '526141160001'; 
    const mensaje = t('cuerpoSoporteWA');
    const url = `whatsapp://send?phone=${numero}&text=${encodeURIComponent(mensaje)}`;
    
    try {
      const soportado = await Linking.canOpenURL(url);
      if (soportado) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t('error'), t('noWhatsApp'));
      }
    } catch (error) {
      Alert.alert(t('error'), t('errorAbrirWhatsApp'));
    }
  };

  const alternarPregunta = (id: number) => {
    if (preguntaAbierta === id) {
      setPreguntaAbierta(null);
    } else {
      setPreguntaAbierta(id);
    }
  };

  //Solo deja pasar las preguntas que coincidan con la categoría elegida.
  const preguntasFiltradas = categoriaActiva === t('catTodas') 
    ? listaPreguntas 
    : listaPreguntas.filter((item) => item.categoria === categoriaActiva);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.neutral[50] }}>
      <NavbarProfesionista />
      <ScrollView contentContainerStyle={styles.scroll} style={styles.contenedorFondo}>
      
      <View style={styles.cabecera}>
        <Text style={styles.tituloSeccion}>{t('centroAyudaTitulo')}</Text>
        <Text style={styles.subtituloSeccion}>{t('centroAyudaSubtitulo')}</Text>
      </View>

      {/* Tarjeta de Soporte con 2 botones */}
      <View style={styles.tarjetaSoporte}>
        <Text style={styles.tituloTarjetaSoporte}>{t('tienesProblema')}</Text>
        <Text style={styles.textoSoporte}>{t('escribenosDirectamente')}</Text>
        
        <View style={styles.contenedorBotonesContacto}>
          <TouchableOpacity style={[styles.botonContacto, styles.botonWhatsApp]} onPress={enviarWhatsAppSoporte}>
            <Text style={styles.textoBotonWhatsApp}>WhatsApp</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.botonContacto, styles.botonCorreo]} onPress={enviarCorreoSoporte}>
            <Text style={styles.textoBotonCorreo}>Correo</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.tituloPreguntas}>{t('preguntasFrecuentes')}</Text>

      {/* Botones de Filtro (Categorías) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contenedorFiltros}>
        {categorias.map((cat) => (
          <TouchableOpacity 
            key={cat} 
            style={[styles.botonFiltro, categoriaActiva === cat && styles.botonFiltroActivo]}
            onPress={() => {
              setCategoriaActiva(cat);
              setPreguntaAbierta(null); // Cerramos las preguntas al cambiar de categoría
            }}
          >
            <Text style={[styles.textoFiltro, categoriaActiva === cat && styles.textoFiltroActivo]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista de Preguntas Filtradas */}
      {preguntasFiltradas.map((item) => {
        const estaAbierta = preguntaAbierta === item.id;
        
        return (
          <View key={item.id} style={styles.contenedorAcordeon}>
            <TouchableOpacity 
              style={styles.botonPregunta} 
              onPress={() => alternarPregunta(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.textoPregunta}>{item.pregunta}</Text>
              <Text style={styles.flecha}>{estaAbierta ? '▼' : '◀'}</Text>
            </TouchableOpacity>

            {estaAbierta && (
              <View style={styles.contenedorRespuesta}>
                <Text style={styles.textoRespuesta}>{item.respuesta}</Text>
              </View>
            )}
          </View>
        );
      })}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedorFondo: { flex: 1, backgroundColor: Colors.neutral[50] },
  scroll: { padding: Spacing[5], paddingBottom: 50 },
  cabecera: { marginBottom: Spacing[5] },
  tituloSeccion: { ...Typography.styles.h2, fontWeight: '800', color: Colors.primary[700], marginBottom: 5 },
  subtituloSeccion: { ...Typography.styles.body, color: Colors.text.secondary, lineHeight: 20 },
  tarjetaSoporte: { backgroundColor: Colors.primary[600], borderRadius: Radius.lg, padding: Spacing[5], marginBottom: Spacing[6], ...Shadow.md },
  tituloTarjetaSoporte: { color: '#FFFFFF', ...Typography.styles.h4, fontWeight: 'bold', marginBottom: 6 },
  textoSoporte: { color: Colors.primary[100], ...Typography.styles.body, lineHeight: 20, marginBottom: 15 },
  
  // Acomodo de los dos botones en fila
  contenedorBotonesContacto: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing[3] },
  botonContacto: { flex: 1, paddingVertical: Spacing[3], borderRadius: Radius.md, alignItems: 'center', ...Shadow.sm },
  botonWhatsApp: { backgroundColor: '#25D366' },
  botonCorreo: { backgroundColor: '#FFFFFF' },
  textoBotonWhatsApp: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
  textoBotonCorreo: { color: Colors.primary[600], fontWeight: 'bold', fontSize: 15 },
  
  tituloPreguntas: { ...Typography.styles.h5, fontWeight: 'bold', color: Colors.text.primary, marginBottom: 15 },
  
  // Estilos de los botones de categoría
  contenedorFiltros: { flexDirection: 'row', marginBottom: Spacing[4], maxHeight: 40 },
  botonFiltro: { backgroundColor: Colors.neutral[200], paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, marginRight: 10, justifyContent: 'center' },
  botonFiltroActivo: { backgroundColor: Colors.primary[600] },
  textoFiltro: { color: Colors.text.secondary, fontSize: 14, fontWeight: '600' },
  textoFiltroActivo: { color: '#FFFFFF' },
  
  contenedorAcordeon: { backgroundColor: '#FFFFFF', borderRadius: Radius.lg, marginBottom: 12, borderWidth: 1, borderColor: Colors.border.default, overflow: 'hidden', ...Shadow.sm },
  botonPregunta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing[4], backgroundColor: '#FFFFFF' },
  textoPregunta: { ...Typography.styles.body, fontWeight: '600', color: Colors.text.primary, flex: 0.9 },
  flecha: { fontSize: 14, color: Colors.primary[600], fontWeight: 'bold' },
  contenedorRespuesta: { padding: Spacing[4], paddingTop: 0, backgroundColor: Colors.neutral[50], borderTopWidth: 1, borderTopColor: Colors.neutral[100] },
  textoRespuesta: { ...Typography.styles.body, color: Colors.text.secondary, lineHeight: 22 }
});