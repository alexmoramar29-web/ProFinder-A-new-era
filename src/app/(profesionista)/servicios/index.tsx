import { supabase } from '@/lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ServiciosScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [servicios, setServicios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      cargarServicios();
    }, [])
  );

  const cargarServicios = async () => {
    setCargando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('services')
        .select(`*, service_images ( image_url )`)
        .eq('prof_id', user.id)
        .order('service_id', { ascending: false });

      if (error) throw error;
      setServicios(data || []);
    } catch (error: any) {
      Alert.alert(t('error'), error.message);
    } finally {
      setCargando(false);
    }
  };

// 1. Separamos la acción de borrar para que sea más limpia
  const ejecutarBorrado = async (id: number) => {
    try {
      const { error } = await supabase.from('services').delete().eq('service_id', id);
      if (error) throw error;
      setServicios((prev) => prev.filter(s => s.service_id !== id));
    } catch (error) {
      Alert.alert(t('error'), t('errorBorrarServicio'));
    }
  };

  // 2. Esta es la función que llama el botón
  const handleBorrar = (id: number) => {
    if (Platform.OS === 'web') {
      // Si estás en tu compu, usa la alerta nativa de internet
      const seguro = confirm(t('seguroEliminarServicio'));
      if (seguro) {
        ejecutarBorrado(id);
      }
    } else {
      // Si estás en un celular, usa la alerta bonita de la aplicación
      Alert.alert(
        t('borrarServicioTitulo'),
        t('seguroEliminarServicio'),
        [
          { text: t('cancelar'), style: 'cancel' },
          { text: t('siBorrar'), style: 'destructive', onPress: () => ejecutarBorrado(id) }
        ]
      );
    }
  };

  if (cargando) {
    return <View style={styles.centro}><ActivityIndicator size="large" color="#5c4b8a" /></View>;
  }

  return (
    <View style={styles.contenedorFondo}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>
          <Text style={styles.titulo}>{t('misServiciosTitulo')}</Text>
          <Text style={styles.subtitulo}>{t('administraServiciosSubtitulo')}</Text>

          {servicios.length === 0 ? (
            <View style={styles.cajaVacia}>
              <Text style={styles.textoVacio}>{t('sinServicios')}</Text>
            </View>
          ) : (
            servicios.map((servicio) => {
              const fotoUrl = servicio.service_images?.[0]?.image_url;
              const estaPausado = servicio.is_active === false; // NUEVO: Verificamos si está apagado

              return (
                // NUEVO: Si está pausado, aplicamos un estilo para que se vea medio transparente
                <View key={servicio.service_id} style={[styles.tarjeta, estaPausado && styles.tarjetaPausada]}>
                  
                  <Image 
                    source={{ uri: fotoUrl || 'https://via.placeholder.com/150/e0e0e0/888888?text=Sin+Foto' }} 
                    style={styles.imagenServicio} 
                  />

                  <View style={styles.infoTarjeta}>
                    <View style={styles.encabezadoTarjeta}>
                      <Text style={[styles.nombreServicio, estaPausado && styles.textoGris]} numberOfLines={1}>{servicio.service_name}</Text>
                      
                      {/* Contenedor de etiquetas */}
                      <View style={styles.etiquetasContainer}>
                        {/* NUEVO: Etiqueta roja si está pausado */}
                        {estaPausado && (
                          <View style={styles.etiquetaPausado}>
                            <Text style={styles.textoPausado}>{t('pausado')}</Text>
                          </View>
                        )}
                        <View style={styles.etiquetaModalidad}>
                          <Text style={styles.textoModalidad}>{servicio.modality || t('presencial')}</Text>
                        </View>
                      </View>

                    </View>

                    <Text style={styles.descripcionServicio} numberOfLines={2}>
                      {servicio.description}
                    </Text>
                    
                    <View style={styles.filaDatos}>
                      <Text style={[styles.precioTexto, estaPausado && styles.textoGris]}>${servicio.base_price}</Text>
                      <Text style={styles.tiempoTexto}>{servicio.duration_minutes} {t('minutos')}</Text>
                    </View>

                    <View style={styles.filaBotones}>
                      <TouchableOpacity 
                        style={styles.botonEditar} 
                        onPress={() => router.push(`/(profesionista)/servicios/editar?id=${servicio.service_id}` as any)}
                      >
                        <Text style={styles.textoEditar}>{t('editar')}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.botonBorrar} onPress={() => handleBorrar(servicio.service_id)}>
                        <Text style={styles.textoBorrar}>{t('borrar')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <View style={styles.contenedorFijoAbajo}>
        <TouchableOpacity style={styles.botonPrimario} onPress={() => router.push('/(profesionista)/servicios/agregar')}>
          <Text style={styles.textoBotonPrimario}>{t('crearNuevoServicio')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contenedorFondo: { flex: 1, backgroundColor: '#fcfcfc' }, 
  scroll: { paddingBottom: 80 },
  container: { padding: 20 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#5c4b8a', textAlign: 'center' }, 
  subtitulo: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20, marginTop: 5 },
  cajaVacia: { backgroundColor: '#fff', padding: 30, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0' },
  textoVacio: { color: '#888', fontStyle: 'italic' },
  
  tarjeta: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 15, 
    elevation: 2, 
    borderWidth: 1, 
    borderColor: '#e0e0e0',
    alignItems: 'center' 
  },
  tarjetaPausada: { opacity: 0.65, backgroundColor: '#f9f9f9' }, // Estilo cuando está apagado
  
  imagenServicio: { width: 85, height: 85, borderRadius: 8, marginRight: 15, backgroundColor: '#e0e0e0' },
  infoTarjeta: { flex: 1 },
  encabezadoTarjeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, paddingRight: 5 },
  nombreServicio: { fontSize: 16, fontWeight: 'bold', color: '#5c4b8a', flex: 1, marginRight: 5 }, 
  textoGris: { color: '#888' }, // Vuelve gris el texto si está apagado

  etiquetasContainer: { flexDirection: 'row', alignItems: 'center' },
  etiquetaModalidad: { backgroundColor: '#f4f1fa', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginLeft: 5 },
  textoModalidad: { fontSize: 10, fontWeight: 'bold', color: '#5c4b8a' },
  
  etiquetaPausado: { backgroundColor: '#ffe6e6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  textoPausado: { fontSize: 10, fontWeight: 'bold', color: '#d9534f' },

  descripcionServicio: { fontSize: 13, color: '#666', marginBottom: 8 },
  filaDatos: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  precioTexto: { fontSize: 15, fontWeight: 'bold', color: '#28a745', marginRight: 15 },
  tiempoTexto: { fontSize: 13, color: '#888' },
  
  filaBotones: { flexDirection: 'row', justifyContent: 'flex-start' },
  botonEditar: { backgroundColor: '#f0f0f0', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6, marginRight: 10 },
  textoEditar: { color: '#333', fontWeight: 'bold', fontSize: 12 },
  botonBorrar: { backgroundColor: 'transparent', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#ff4d4d' },
  textoBorrar: { color: '#ff4d4d', fontWeight: 'bold', fontSize: 12 },
  
  contenedorFijoAbajo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#fcfcfc', borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  botonPrimario: { backgroundColor: '#5c4b8a', padding: 15, borderRadius: 8, alignItems: 'center' },
  textoBotonPrimario: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});