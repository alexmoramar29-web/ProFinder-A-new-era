import { supabase } from '@/lib/supabase';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

interface DiaHorario {
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// NUEVO: Plantilla base infalible. Si no tienes horarios guardados, se cargan estos.
const SEMANA_POR_DEFECTO: DiaHorario[] = DIAS_SEMANA.map(dia => ({
  day_of_week: dia,
  start_time: '09:00',
  end_time: '18:00',
  is_available: false
}));

const HORAS_DISPONIBLES = Array.from({ length: 24 }, (_, i) => {
  const hora = i < 10 ? `0${i}` : `${i}`;
  return `${hora}:00`;
});

export default function HorariosScreen() {
  // NUEVO: Iniciamos el estado con la plantilla para que NUNCA esté en blanco
  const [horarios, setHorarios] = useState<DiaHorario[]>(SEMANA_POR_DEFECTO);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    obtenerHorarios();
  }, []);

  const obtenerHorarios = async () => {
    try {
      setCargando(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No se encontró sesión activa.');

      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('prof_id', user.id);

      if (error) throw error;

      // Si la base de datos sí tiene información, la combinamos con la plantilla
      if (data && data.length > 0) {
        const horariosOrdenados = DIAS_SEMANA.map(dia => {
          const bdInfo = data.find(h => h.day_of_week === dia);
          return {
            day_of_week: dia,
            start_time: bdInfo?.start_time ? bdInfo.start_time.substring(0, 5) : '09:00',
            end_time: bdInfo?.end_time ? bdInfo.end_time.substring(0, 5) : '18:00',
            is_available: bdInfo ? bdInfo.is_available : false,
          };
        });
        setHorarios(horariosOrdenados);
      }
      // Si data está vacío, se queda con SEMANA_POR_DEFECTO y ya no se pone en blanco.

    } catch (error: any) {
      // Evitamos molestar con alertas si apenas es un usuario nuevo, solo imprimimos el error
      console.log('Aviso al cargar horarios:', error.message);
    } finally {
      setCargando(false);
    }
  };

  const toggleDia = (index: number) => {
    const copia = [...horarios];
    copia[index].is_available = !copia[index].is_available;
    setHorarios(copia);
  };

  const actualizarHora = (index: number, campo: 'start_time' | 'end_time', valor: string) => {
    const copia = [...horarios];
    copia[index][campo] = valor;
    setHorarios(copia);
  };

  const handleGuardar = async () => {
    for (const h of horarios) {
      if (h.is_available) {
        const inicioNum = parseInt(h.start_time.replace(':', ''));
        const finNum = parseInt(h.end_time.replace(':', ''));
        
        if (inicioNum >= finNum) {
          const mensaje = `El día ${h.day_of_week} tiene un error. La hora de cierre no puede ser antes o igual a la de apertura.`;
          Platform.OS === 'web' ? alert(mensaje) : Alert.alert('Horario Inválido', mensaje);
          return; 
        }
      }
    }

    try {
      setGuardando(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const paqueteDatos = horarios.map(h => ({
        prof_id: user.id,
        day_of_week: h.day_of_week,
        start_time: `${h.start_time}:00`,
        end_time: `${h.end_time}:00`,
        is_available: h.is_available
      }));

      const { error } = await supabase
        .from('schedules')
        .upsert(paqueteDatos, { onConflict: 'prof_id,day_of_week' });

      if (error) throw error;

      Platform.OS === 'web' 
        ? alert('¡Horarios guardados correctamente!') 
        : Alert.alert('¡Éxito!', 'Tus horarios se han actualizado.');

    } catch (error: any) {
      const msjError = 'Error al guardar: ' + error.message;
      Platform.OS === 'web' ? alert(msjError) : Alert.alert('Error', msjError);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <View style={styles.centro}><ActivityIndicator size="large" color="#5c4b8a" /></View>;
  }

  return (
    <View style={styles.contenedorFondo}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>
          <Text style={styles.titulo}>Mi Horario de Atención</Text>
          <Text style={styles.subtitulo}>Configura qué días y a qué horas los clientes pueden reservar tus servicios.</Text>

          {horarios.map((dia, index) => (
            <View key={dia.day_of_week} style={[styles.tarjetaDia, !dia.is_available && styles.tarjetaApagada]}>
              
              <View style={styles.filaSwitch}>
                <Text style={[styles.textoDia, !dia.is_available && styles.textoGris]}>{dia.day_of_week}</Text>
                <Switch
                  value={dia.is_available}
                  onValueChange={() => toggleDia(index)}
                  trackColor={{ false: '#d1d1d6', true: '#5c4b8a' }}
                  thumbColor={'#fff'}
                />
              </View>

              {dia.is_available ? (
                <View style={styles.filaTiempo}>
                  <View style={styles.cajaPicker}>
                    <Text style={styles.labelTiempo}>Apertura</Text>
                    <View style={styles.bordePicker}>
                      <Picker
                        selectedValue={dia.start_time}
                        onValueChange={(valor) => actualizarHora(index, 'start_time', valor)}
                        style={styles.picker}
                      >
                        {HORAS_DISPONIBLES.map(hora => <Picker.Item key={`start-${hora}`} label={hora} value={hora} />)}
                      </Picker>
                    </View>
                  </View>

                  <Text style={styles.separadorHora}>a</Text>

                  <View style={styles.cajaPicker}>
                    <Text style={styles.labelTiempo}>Cierre</Text>
                    <View style={styles.bordePicker}>
                      <Picker
                        selectedValue={dia.end_time}
                        onValueChange={(valor) => actualizarHora(index, 'end_time', valor)}
                        style={styles.picker}
                      >
                        {HORAS_DISPONIBLES.map(hora => <Picker.Item key={`end-${hora}`} label={hora} value={hora} />)}
                      </Picker>
                    </View>
                  </View>
                </View>
              ) : (
                <Text style={styles.textoDescanso}>Día de descanso</Text>
              )}

            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.contenedorFijoAbajo}>
        <TouchableOpacity style={styles.botonPrimario} onPress={handleGuardar} disabled={guardando}>
          {guardando ? <ActivityIndicator color="#fff" /> : <Text style={styles.textoBotonPrimario}>Guardar Toda la Semana</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contenedorFondo: { flex: 1, backgroundColor: '#fcfcfc' },
  scroll: { paddingBottom: 100 },
  container: { padding: 20 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#5c4b8a', textAlign: 'center' },
  subtitulo: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20, marginTop: 5 },
  
  tarjetaDia: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2, borderWidth: 1, borderColor: '#e0e0e0' },
  tarjetaApagada: { backgroundColor: '#f4f4f4', opacity: 0.7 },
  
  filaSwitch: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  textoDia: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  textoGris: { color: '#888' },
  
  filaTiempo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15 },
  cajaPicker: { flex: 1 },
  labelTiempo: { fontSize: 12, color: '#666', marginBottom: 5, fontWeight: 'bold', textAlign: 'center' },
  bordePicker: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, backgroundColor: '#f9f9f9', height: 45, justifyContent: 'center', overflow: 'hidden' },
  picker: { width: '100%', height: '100%' },
  
  separadorHora: { fontSize: 16, color: '#666', marginHorizontal: 10, marginTop: 15, fontWeight: 'bold' },
  textoDescanso: { marginTop: 10, color: '#888', fontStyle: 'italic' },

  contenedorFijoAbajo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#fcfcfc', borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  botonPrimario: { backgroundColor: '#5c4b8a', padding: 15, borderRadius: 8, alignItems: 'center' },
  textoBotonPrimario: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});