import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 1. Aquí están tus preguntas, ahora separadas por categorías
export default function AyudaScreen() {
  const { t } = useTranslation();

  const listaPreguntas = [
    { id: 1, categoria: t('catPanel'), pregunta: t('faq1q'), respuesta: t('faq1a') },
    { id: 2, categoria: t('catPanel'), pregunta: t('faq2q'), respuesta: t('faq2a') },
    { id: 3, categoria: t('catServicios'), pregunta: t('faq3q'), respuesta: t('faq3a') },
    { id: 4, categoria: t('catServicios'), pregunta: t('faq4q'), respuesta: t('faq4a') },
    { id: 5, categoria: t('catCuenta'), pregunta: t('faq5q'), respuesta: t('faq5a') },
    { id: 6, categoria: t('catCuenta'), pregunta: t('faq6q'), respuesta: t('faq6a') },
    { id: 7, categoria: t('catCuenta'), pregunta: t('faq7q'), respuesta: t('faq7a') },
    { id: 8, categoria: t('catPagos'), pregunta: t('faq8q'), respuesta: t('faq8a') },
    { id: 9, categoria: t('catPagos'), pregunta: t('faq9q'), respuesta: t('faq9a') }
  ];

  const categorias = [t('catTodas'), t('catCuenta'), t('catPanel'), t('catServicios'), t('catPagos')];

  const [preguntaAbierta, setPreguntaAbierta] = useState<number | null>(null);
  const [categoriaActiva, setCategoriaActiva] = useState<string>(t('catTodas'));

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
  );
}

const styles = StyleSheet.create({
  contenedorFondo: { flex: 1, backgroundColor: '#FAFAFC' },
  scroll: { padding: 20, paddingBottom: 50 },
  cabecera: { marginBottom: 20 },
  tituloSeccion: { fontSize: 26, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 5 },
  subtituloSeccion: { fontSize: 15, color: '#8E8E93', lineHeight: 20 },
  tarjetaSoporte: { backgroundColor: '#5c4b8a', borderRadius: 12, padding: 20, marginBottom: 25, elevation: 2 },
  tituloTarjetaSoporte: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  textoSoporte: { color: '#E8E0FF', fontSize: 14, lineHeight: 20, marginBottom: 15 },
  
  // Acomodo de los dos botones en fila
  contenedorBotonesContacto: { flexDirection: 'row', justifyContent: 'space-between' },
  botonContacto: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  botonWhatsApp: { backgroundColor: '#25D366', marginRight: 10 },
  botonCorreo: { backgroundColor: '#FFFFFF', marginLeft: 10 },
  textoBotonWhatsApp: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
  textoBotonCorreo: { color: '#5c4b8a', fontWeight: 'bold', fontSize: 15 },
  
  tituloPreguntas: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 15 },
  
  // Estilos de los botones de categoría
  contenedorFiltros: { flexDirection: 'row', marginBottom: 15, maxHeight: 40 },
  botonFiltro: { backgroundColor: '#E5E5EA', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10, justifyContent: 'center' },
  botonFiltroActivo: { backgroundColor: '#5c4b8a' },
  textoFiltro: { color: '#636366', fontSize: 14, fontWeight: '600' },
  textoFiltroActivo: { color: '#FFFFFF' },
  
  contenedorAcordeon: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E5E5EA', overflow: 'hidden' },
  botonPregunta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF' },
  textoPregunta: { fontSize: 15, fontWeight: '600', color: '#1C1C1E', flex: 0.9 },
  flecha: { fontSize: 14, color: '#5c4b8a', fontWeight: 'bold' },
  contenedorRespuesta: { padding: 16, paddingTop: 0, backgroundColor: '#FAFAFC', borderTopWidth: 1, borderTopColor: '#F2F2F7' },
  textoRespuesta: { fontSize: 14, color: '#48484A', lineHeight: 22 }
});