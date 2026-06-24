import { supabase } from '@/lib/supabase';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Cita {
  appointment_id: number;
  client_id: string;
  appointment_date: string;
  appointment_time: string;
  status: number;
  notes?: string;
}

export default function CalendarioScreen() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [pestañaActiva, setPestañaActiva] = useState<'pendientes' | 'aceptadas'>('pendientes');

  useEffect(() => {
    obtenerCitas();
  }, [pestañaActiva]);

  const obtenerCitas = async () => {
    try {
      setCargando(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const estadoBuscado = pestañaActiva === 'pendientes' ? 1 : 2;

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('prof_id', user.id)
        .eq('status', estadoBuscado)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      setCitas(data || []);
    } catch (error: any) {
      console.log('Error al cargar citas:', error.message);
    } finally {
      setCargando(false);
    }
  };

  const actualizarEstadoCita = async (idCita: number, nuevoEstado: number) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: nuevoEstado })
        .eq('appointment_id', idCita);

      if (error) throw error;

      Alert.alert('Completado', nuevoEstado === 2 ? 'Cita aceptada correctamente.' : 'Cita rechazada.');
      obtenerCitas();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.contenedorFondo}>
      
      <View style={styles.contenedorPestañas}>
        <TouchableOpacity 
          style={[styles.pestaña, pestañaActiva === 'pendientes' && styles.pestañaActiva]}
          onPress={() => setPestañaActiva('pendientes')}
        >
          <Text style={[styles.textoPestaña, pestañaActiva === 'pendientes' && styles.textoPestañaActiva]}>
            Pendientes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.pestaña, pestañaActiva === 'aceptadas' && styles.pestañaActiva]}
          onPress={() => setPestañaActiva('aceptadas')}
        >
          <Text style={[styles.textoPestaña, pestañaActiva === 'aceptadas' && styles.textoPestañaActiva]}>
            Próximos Trabajos
          </Text>
        </TouchableOpacity>
      </View>

      {cargando ? (
        <View style={styles.centro}><ActivityIndicator size="large" color="#5c4b8a" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {citas.length === 0 ? (
            <Text style={styles.textoVacio}>
              No tienes citas {pestañaActiva === 'pendientes' ? 'pendientes por revisar' : 'agendadas'} por ahora.
            </Text>
          ) : (
            citas.map((cita) => (
              <View key={cita.appointment_id} style={styles.tarjetaCita}>
                <View style={styles.infoCita}>
                  <Text style={styles.fechaTexto}>Fecha: {cita.appointment_date}</Text>
                  <Text style={styles.horaTexto}>Hora: {cita.appointment_time.slice(0,5)}</Text>
                  {cita.notes && <Text style={styles.notasTexto}>Nota del cliente: {cita.notes}</Text>}
                </View>

                {pestañaActiva === 'pendientes' && (
                  <View style={styles.filaBotones}>
                    <TouchableOpacity 
                      style={styles.botonRechazar} 
                      onPress={() => actualizarEstadoCita(cita.appointment_id, 3)}
                    >
                      <Text style={styles.textoBotonRechazar}>Rechazar</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.botonAceptar} 
                      onPress={() => actualizarEstadoCita(cita.appointment_id, 2)}
                    >
                      <Text style={styles.textoBotonAceptar}>Aceptar Trabajo</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedorFondo: { flex: 1, backgroundColor: '#FAFAFC' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  contenedorPestañas: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 10, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  pestaña: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8, marginHorizontal: 5, backgroundColor: '#F2F2F7' },
  pestañaActiva: { backgroundColor: '#E8E0FF' },
  textoPestaña: { fontSize: 15, fontWeight: '600', color: '#8E8E93' },
  textoPestañaActiva: { color: '#5c4b8a' },
  
  scroll: { padding: 20 },
  textoVacio: { textAlign: 'center', color: '#8E8E93', marginTop: 50, fontSize: 16 },
  
  tarjetaCita: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: '#E5E5EA', elevation: 1 },
  infoCita: { marginBottom: 15 },
  fechaTexto: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 5 },
  horaTexto: { fontSize: 15, color: '#3A3A3C', marginBottom: 5 },
  notasTexto: { fontSize: 14, color: '#636366', fontStyle: 'italic', marginTop: 5 },
  
  filaBotones: { flexDirection: 'row', justifyContent: 'space-between' },
  botonRechazar: { flex: 1, backgroundColor: '#F2F2F7', padding: 12, borderRadius: 8, marginRight: 10, alignItems: 'center' },
  textoBotonRechazar: { color: '#FF3B30', fontWeight: 'bold' },
  
  botonAceptar: { flex: 1, backgroundColor: '#5c4b8a', padding: 12, borderRadius: 8, alignItems: 'center' },
  textoBotonAceptar: { color: '#FFFFFF', fontWeight: 'bold' },
});