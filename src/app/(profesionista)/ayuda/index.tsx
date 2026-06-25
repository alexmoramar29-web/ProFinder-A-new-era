import React, { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 1. Aquí están tus preguntas, ahora separadas por categorías
const listaPreguntas = [
  { id: 1, categoria: 'Panel', pregunta: '¿Qué información puedo ver en mi panel de Inicio?', respuesta: 'En tu Inicio tienes tu resumen del día. Puedes ver tus ingresos totales, citas pendientes y tu calificación promedio.' },
  { id: 2, categoria: 'Panel', pregunta: '¿Dónde reviso los comentarios que me dejan los clientes?', respuesta: 'En el panel de "Reseñas" puedes ver tu calificación general grande y leer de forma detallada las opiniones de cada cliente.' },
  { id: 3, categoria: 'Servicios', pregunta: '¿Cómo funciona el sistema de Citas?', respuesta: 'En Citas verás las solicitudes de los clientes. Cada tarjeta te mostrará el día, la hora y el estado del trabajo.' },
  { id: 4, categoria: 'Servicios', pregunta: '¿De qué manera puedo agregar o modificar un servicio?', respuesta: 'Entra a "Mis Servicios". Ahí tienes un botón para añadir nuevos servicios con su nombre, precio y descripción, o editar los actuales.' },
  { id: 5, categoria: 'Cuenta', pregunta: '¿Cómo configuro mis días de descanso y horarios?', respuesta: 'Ve a "Mis Horarios". Ahí puedes encender o apagar los días de la semana que trabajas y fijar tu hora de entrada y salida.' },
  { id: 6, categoria: 'Cuenta', pregunta: '¿Cómo puedo actualizar mis datos o descripción?', respuesta: 'Entra a "Mi Perfil" y presiona editar. Podrás cambiar tu nombre, teléfono de contacto y tu descripción profesional.' },
  { id: 7, categoria: 'Cuenta', pregunta: '¿Cómo me comunico con un cliente?', respuesta: 'Usa el módulo de "Chat" para enviar mensajes en tiempo real a los clientes para coordinar detalles del servicio.' },
  { id: 8, categoria: 'Pagos', pregunta: '¿Cómo retiro mis ganancias de la aplicación?', respuesta: 'Tus ganancias se transfieren de forma automática a la cuenta bancaria que registraste cada vez que completas un servicio.' },
  { id: 9, categoria: 'Pagos', pregunta: '¿Qué pasa si un cliente cancela de último minuto?', respuesta: 'Si el cliente cancela cuando ya estás en camino, el sistema te compensará con una tarifa base por el tiempo perdido.' }
];

// Las categorías que aparecerán como botones arriba
const categorias = ['Todas', 'Cuenta', 'Panel', 'Servicios', 'Pagos'];

export default function AyudaScreen() {
  const [preguntaAbierta, setPreguntaAbierta] = useState<number | null>(null);
  const [categoriaActiva, setCategoriaActiva] = useState<string>('Todas');

  const enviarCorreoSoporte = () => {
    const correo = 'soporte@profinder.com';
    const asunto = 'Soporte Técnico - ProFinder Profesionista';
    const cuerpo = 'Hola equipo de ProFinder, necesito ayuda con: ';
    Linking.openURL(`mailto:${correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`);
  };

  const enviarWhatsAppSoporte = async () => {
    //aqui se incluye el código de país como el 52 de México
    const numero = '526141160001'; 
    const mensaje = 'Hola soporte de ProFinder, necesito ayuda con mi cuenta de Profesionista.';
    const url = `whatsapp://send?phone=${numero}&text=${encodeURIComponent(mensaje)}`;
    
    try {
      const soportado = await Linking.canOpenURL(url);
      if (soportado) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Parece que no tienes WhatsApp instalado en este teléfono.');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir WhatsApp.');
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
  const preguntasFiltradas = categoriaActiva === 'Todas' 
    ? listaPreguntas 
    : listaPreguntas.filter((item) => item.categoria === categoriaActiva);

  return (
    <ScrollView contentContainerStyle={styles.scroll} style={styles.contenedorFondo}>
      
      <View style={styles.cabecera}>
        <Text style={styles.tituloSeccion}>Centro de Ayuda</Text>
        <Text style={styles.subtituloSeccion}>Todo lo que necesitas saber sobre tus paneles.</Text>
      </View>

      {/* Tarjeta de Soporte con 2 botones */}
      <View style={styles.tarjetaSoporte}>
        <Text style={styles.tituloTarjetaSoporte}>¿Tienes algún problema?</Text>
        <Text style={styles.textoSoporte}>Escríbenos directamente y te ayudaremos al instante.</Text>
        
        <View style={styles.contenedorBotonesContacto}>
          <TouchableOpacity style={[styles.botonContacto, styles.botonWhatsApp]} onPress={enviarWhatsAppSoporte}>
            <Text style={styles.textoBotonWhatsApp}>WhatsApp</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.botonContacto, styles.botonCorreo]} onPress={enviarCorreoSoporte}>
            <Text style={styles.textoBotonCorreo}>Correo</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.tituloPreguntas}>Preguntas Frecuentes</Text>

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