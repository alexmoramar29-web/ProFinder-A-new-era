import { supabase } from '@/lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ServiciosScreen() {
  const router = useRouter();
  const [servicios, setServicios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  // useFocusEffect hace que la lista se recargue cada vez que entras a esta pantalla
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
        .select('*')
        .eq('prof_id', user.id)
        .order('service_id', { ascending: false });

      if (error) throw error;
      setServicios(data || []);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar tus servicios.');
    } finally {
      setCargando(false);
    }
  };

  const handleBorrar = async (id: number) => {
    try {
      const { error } = await supabase.from('services').delete().eq('service_id', id);
      if (error) throw error;
      setServicios(servicios.filter(s => s.service_id !== id));
    } catch (error) {
      Alert.alert('Error', 'No se pudo borrar el servicio.');
    }
  };

  if (cargando) {
    return <View style={styles.centro}><ActivityIndicator size="large" color="#5c4b8a" /></View>;
  }

  return (
    <View style={styles.contenedorFondo}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>
          <Text style={styles.titulo}>Mis Servicios</Text>
          <Text style={styles.subtitulo}>Administra lo que ofreces a tus clientes y el costo de tu trabajo.</Text>

          {servicios.length === 0 ? (
            <View style={styles.cajaVacia}>
              <Text style={styles.textoVacio}>Aun no tienes servicios publicados.</Text>
            </View>
          ) : (
            servicios.map((servicio) => (
              <View key={servicio.service_id} style={styles.tarjeta}>
                <View style={styles.infoTarjeta}>
                  <Text style={styles.nombreServicio}>{servicio.service_name}</Text>
                  <Text style={styles.descripcionServicio}>{servicio.description}</Text>
                  <View style={styles.filaDatos}>
                    <Text style={styles.precioTexto}>${servicio.base_price}</Text>
                    <Text style={styles.tiempoTexto}>{servicio.duration_minutes} minutos</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.botonBorrar} onPress={() => handleBorrar(servicio.service_id)}>
                  <Text style={styles.textoBorrar}>Borrar</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Botón flotante y fijo en la parte de abajo */}
      <View style={styles.contenedorFijoAbajo}>
        <TouchableOpacity style={styles.botonPrimario} onPress={() => router.push('/(profesionista)/servicios/agregar')}>
          <Text style={styles.textoBotonPrimario}>+ Crear Nuevo Servicio</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contenedorFondo: { flex: 1, backgroundColor: '#f4f4f4' },
  scroll: { paddingBottom: 80 },
  container: { padding: 20 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  subtitulo: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20, marginTop: 5 },
  cajaVacia: { backgroundColor: '#fff', padding: 30, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  textoVacio: { color: '#888', fontStyle: 'italic' },
  tarjeta: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 15, elevation: 1, borderWidth: 1, borderColor: '#eee', alignItems: 'center' },
  infoTarjeta: { flex: 1, paddingRight: 10 },
  nombreServicio: { fontSize: 18, fontWeight: 'bold', color: '#5c4b8a' },
  descripcionServicio: { fontSize: 14, color: '#666', marginTop: 4, marginBottom: 8 },
  filaDatos: { flexDirection: 'row', alignItems: 'center' },
  precioTexto: { fontSize: 16, fontWeight: 'bold', color: '#28a745', marginRight: 15 },
  tiempoTexto: { fontSize: 14, color: '#888' },
  botonBorrar: { backgroundColor: '#ffe6e6', padding: 10, borderRadius: 5, borderWidth: 1, borderColor: '#ff4d4d' },
  textoBorrar: { color: '#d9534f', fontWeight: 'bold', fontSize: 12 },
  contenedorFijoAbajo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#f4f4f4', borderTopWidth: 1, borderTopColor: '#ddd' },
  botonPrimario: { backgroundColor: '#5c4b8a', padding: 15, borderRadius: 8, alignItems: 'center' },
  textoBotonPrimario: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});