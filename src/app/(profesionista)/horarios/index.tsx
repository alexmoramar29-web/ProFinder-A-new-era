import { supabase } from '@/lib/supabase';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';
import { Typography } from '@/theme/Typography';
import { Radius, Shadow, Spacing } from '@/theme/Spacing';
import NavbarProfesionista from '@/components/NavbarProfesionista';

const HORAS_DISPONIBLES = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
];

interface ScheduleBlock {
  schedule_id?: string;
  service_id: number | null;
  start_time: string;
  end_time: string;
  is_active?: boolean;
}

export default function HorariosScreen() {
  const { t } = useTranslation();

  const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const initialHorariosState: Record<string, ScheduleBlock[]> = {};
  const initialDiasActivos: Record<string, boolean> = {};
  DIAS_SEMANA.forEach(dia => {
    initialHorariosState[dia] = [];
    initialDiasActivos[dia] = true;
  });

  const [horarios, setHorarios] = useState<Record<string, ScheduleBlock[]>>(initialHorariosState);
  const [diasActivos, setDiasActivos] = useState<Record<string, boolean>>(initialDiasActivos);
  const [servicios, setServicios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensajeUI, setMensajeUI] = useState<{tipo: 'exito'|'error'|'info', texto: string} | null>(null);

  const mostrarMensaje = (tipo: 'exito'|'error'|'info', texto: string) => {
    setMensajeUI({ tipo, texto });
    setTimeout(() => setMensajeUI(null), 4000);
  };

  useEffect(() => {
    obtenerDatos();
  }, []);

  const obtenerDatos = async () => {
    try {
      setCargando(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No se encontró sesión activa.');

      // Cargar servicios
      const { data: servs, error: errServs } = await supabase
        .from('services')
        .select('*')
        .eq('prof_id', user.id);
      
      if (errServs) throw errServs;
      setServicios(servs || []);

      // Cargar service_schedules
      const { data: schs, error: errSchs } = await supabase
        .from('service_schedules')
        .select('*')
        .eq('prof_id', user.id);

      if (errSchs && errSchs.code !== '42P01') { 
        // 42P01 es table does not exist, ignoramos si no ha creado la tabla
        throw errSchs;
      }

      const initialHorarios: Record<string, ScheduleBlock[]> = {};
      const newDiasActivos: Record<string, boolean> = {};
      DIAS_SEMANA.forEach(dia => {
        initialHorarios[dia] = [];
        newDiasActivos[dia] = false; // Por defecto apagado si no hay nada
      });

      if (schs && schs.length > 0) {
        schs.forEach(s => {
          // Normalizar el día
          const diaNormalizado = DIAS_SEMANA.find(d => d.toLowerCase().replace('é', 'e') === s.day_of_week.toLowerCase().replace('é', 'e'));
          if (diaNormalizado) {
            initialHorarios[diaNormalizado].push({
              schedule_id: s.schedule_id,
              service_id: s.service_id,
              start_time: s.start_time.substring(0, 5),
              end_time: s.end_time.substring(0, 5),
              is_active: s.is_active !== false
            });
            // Si al menos un bloque está activo, marcamos el día como activo
            if (s.is_active !== false) {
              newDiasActivos[diaNormalizado] = true;
            }
          }
        });
        
        // Pero si hay bloques en un día y todos estaban inactivos, dejamos el switch apagado,
        // Y si no hay bloques en un día, lo dejamos apagado, pero queremos que los usuarios
        // puedan prenderlo por defecto si quieren agregar uno, entonces para los días que no tienen bloques:
        DIAS_SEMANA.forEach(dia => {
          if (initialHorarios[dia].length === 0) {
            newDiasActivos[dia] = false;
          }
        });
      } else {
        // Si no hay datos, prendemos de lunes a viernes por defecto
        DIAS_SEMANA.forEach(dia => {
          if (dia !== 'Sábado' && dia !== 'Domingo') {
            newDiasActivos[dia] = true;
          }
        });
      }

      setHorarios(initialHorarios);
      setDiasActivos(newDiasActivos);

    } catch (error: any) {
      console.log('Aviso al cargar horarios:', error.message);
    } finally {
      setCargando(false);
    }
  };

  const agregarBloque = (dia: string) => {
    const bloqueNuevo: ScheduleBlock = {
      service_id: servicios.length > 0 ? servicios[0].service_id : null,
      start_time: '09:00',
      end_time: '18:00'
    };
    
    setHorarios(prev => ({
      ...prev,
      [dia]: [...prev[dia], bloqueNuevo]
    }));
    // Asegurarnos que el switch esté encendido si agregamos un horario
    setDiasActivos(prev => ({ ...prev, [dia]: true }));
  };

  const toggleDia = (dia: string, valor: boolean) => {
    setDiasActivos(prev => ({ ...prev, [dia]: valor }));
    // Si lo encendemos y no había horarios, agregamos uno automático
    if (valor && horarios[dia].length === 0) {
      agregarBloque(dia);
    }
  };

  const removerBloque = (dia: string, index: number) => {
    setHorarios(prev => {
      const nuevaLista = [...prev[dia]];
      nuevaLista.splice(index, 1);
      return { ...prev, [dia]: nuevaLista };
    });
  };

  const actualizarBloque = (dia: string, index: number, campo: keyof ScheduleBlock, valor: any) => {
    setHorarios(prev => {
      const nuevaLista = [...prev[dia]];
      nuevaLista[index] = { ...nuevaLista[index], [campo]: valor };
      return { ...prev, [dia]: nuevaLista };
    });
  };

  const handleGuardar = async () => {
    // Validar solo los días activos
    for (const dia of DIAS_SEMANA) {
      if (!diasActivos[dia]) continue; // No validamos si está apagado
      
      const bloques = horarios[dia] || [];
      for (const b of bloques) {
        if (!b.service_id) {
          mostrarMensaje('error', `Falta asignar un servicio a un bloque en el día ${dia}.`);
          return;
        }
        const inicioNum = parseInt(b.start_time.replace(':', ''));
        const finNum = parseInt(b.end_time.replace(':', ''));
        if (inicioNum >= finNum) {
          mostrarMensaje('error', `En el día ${dia}, la hora de apertura debe ser menor a la de cierre.`);
          return; 
        }
      }
    }

    try {
      setGuardando(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Por simplicidad, borramos todos los de este profe y reinsertamos
      // Esto previene duplicados o huérfanos sin tener que hacer diffing
      await supabase.from('service_schedules').delete().eq('prof_id', user.id);

      const paqueteDatos: any[] = [];
      
      DIAS_SEMANA.forEach(dia => {
        horarios[dia].forEach(b => {
          paqueteDatos.push({
            prof_id: user.id,
            day_of_week: dia,
            service_id: b.service_id,
            start_time: `${b.start_time}:00`,
            end_time: `${b.end_time}:00`,
            is_active: diasActivos[dia]
          });
        });
      });

      if (paqueteDatos.length > 0) {
        const { error } = await supabase.from('service_schedules').insert(paqueteDatos);
        if (error) throw error;
      }

      mostrarMensaje('exito', 'Tus horarios de servicio han sido guardados correctamente.');
    } catch (error: any) {
      mostrarMensaje('error', 'Error al guardar: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <View style={styles.centro}><ActivityIndicator size="large" color={Colors.primary[600]} /></View>;
  }

  if (servicios.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.neutral[50] }}>
        <NavbarProfesionista />
        <View style={styles.centro}>
          <Ionicons name="briefcase-outline" size={60} color={Colors.text.disabled} />
          <Text style={[styles.titulo, { marginTop: 20 }]}>Sin servicios</Text>
          <Text style={[styles.subtitulo, { paddingHorizontal: 40 }]}>
            Necesitas agregar al menos un servicio en tu catálogo para poder asignarle un horario.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.neutral[50] }}>
      <NavbarProfesionista />
      <View style={styles.contenedorFondo}>
        <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>
          <Text style={styles.titulo}>Horarios por Servicio</Text>
          <Text style={styles.subtitulo}>Agrega bloques de horario y asígnales los servicios que realizas.</Text>

          {DIAS_SEMANA.map((dia) => (
            <View key={dia} style={[styles.tarjetaDia, (!diasActivos[dia] || horarios[dia]?.length === 0) && styles.tarjetaApagada]}>
              
              <View style={styles.filaDiaCabecera}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Switch
                    value={diasActivos[dia]}
                    onValueChange={(val) => toggleDia(dia, val)}
                    trackColor={{ false: '#d1d5db', true: Colors.primary[300] }}
                    thumbColor={diasActivos[dia] ? Colors.primary[600] : '#f3f4f6'}
                  />
                  <Text style={[styles.textoDia, !diasActivos[dia] && { color: Colors.text.disabled }]}>{dia}</Text>
                </View>
                
                {diasActivos[dia] && (
                  <TouchableOpacity style={styles.botonAgregar} onPress={() => agregarBloque(dia)}>
                    <Ionicons name="add" size={16} color="#fff" />
                    <Text style={styles.textoAgregar}>Añadir Horario</Text>
                  </TouchableOpacity>
                )}
              </View>

              {!diasActivos[dia] ? (
                <Text style={styles.textoDescanso}>Día inactivo. No recibirás citas este día (pero los bloques están guardados).</Text>
              ) : horarios[dia]?.length === 0 ? (
                <Text style={styles.textoDescanso}>Sin servicio este día (Añade un horario).</Text>
              ) : (
                horarios[dia].map((bloque, index) => (
                  <View key={index} style={styles.cajaBloque}>
                    
                    {/* Fila del servicio y botón eliminar */}
                    <View style={styles.filaServicio}>
                      <View style={styles.bordePickerFull}>
                        <Picker
                          selectedValue={bloque.service_id}
                          onValueChange={(val) => actualizarBloque(dia, index, 'service_id', val)}
                          style={styles.picker}
                        >
                          <Picker.Item label="Selecciona un servicio" value={null} />
                          {servicios.map(s => <Picker.Item key={s.service_id} label={s.service_name} value={s.service_id} />)}
                        </Picker>
                      </View>
                      
                      <TouchableOpacity style={styles.botonEliminar} onPress={() => removerBloque(dia, index)}>
                        <Ionicons name="trash-outline" size={20} color={Colors.error.main} />
                      </TouchableOpacity>
                    </View>

                    {/* Fila del tiempo */}
                    <View style={styles.filaTiempo}>
                      <View style={styles.bordePickerMitad}>
                        <Picker
                          selectedValue={bloque.start_time}
                          onValueChange={(val) => actualizarBloque(dia, index, 'start_time', val)}
                          style={styles.picker}
                        >
                          {HORAS_DISPONIBLES.map(h => <Picker.Item key={`ini-${h}`} label={h} value={h} />)}
                        </Picker>
                      </View>
                      <Text style={styles.separadorHora}> a </Text>
                      <View style={styles.bordePickerMitad}>
                        <Picker
                          selectedValue={bloque.end_time}
                          onValueChange={(val) => actualizarBloque(dia, index, 'end_time', val)}
                          style={styles.picker}
                        >
                          {HORAS_DISPONIBLES.map(h => <Picker.Item key={`fin-${h}`} label={h} value={h} />)}
                        </Picker>
                      </View>
                    </View>

                  </View>
                ))
              )}

            </View>
          ))}
        </View>
      </ScrollView>

      {mensajeUI && (
        <View style={[styles.mensajeToast, mensajeUI.tipo === 'exito' ? styles.toastExito : styles.toastError]}>
          <Ionicons name={mensajeUI.tipo === 'exito' ? 'checkmark-circle' : 'warning'} size={24} color="#fff" />
          <Text style={styles.mensajeToastTxt}>{mensajeUI.texto}</Text>
        </View>
      )}

      <View style={styles.contenedorFijoAbajo}>
        <TouchableOpacity style={styles.botonPrimario} onPress={handleGuardar} disabled={guardando}>
          {guardando ? <ActivityIndicator color="#fff" /> : <Text style={styles.textoBotonPrimario}>Guardar Calendario</Text>}
        </TouchableOpacity>
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contenedorFondo: { flex: 1, backgroundColor: Colors.neutral[50] },
  scroll: { paddingBottom: 100 },
  container: { padding: Spacing[5] },
  titulo: { ...Typography.styles.h2, color: Colors.primary[700], textAlign: 'center', fontWeight: '800' },
  subtitulo: { ...Typography.styles.body, color: Colors.text.secondary, textAlign: 'center', marginBottom: Spacing[6], marginTop: Spacing[1] },
  
  tarjetaDia: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing[4], marginBottom: Spacing[4], ...Shadow.md, borderWidth: 1, borderColor: Colors.border.default },
  tarjetaApagada: { backgroundColor: Colors.neutral[100], borderColor: Colors.border.default, ...Shadow.sm },
  
  filaDiaCabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[2] },
  textoDia: { ...Typography.styles.h4, fontWeight: '700', color: Colors.text.primary },
  
  botonAgregar: { flexDirection: 'row', backgroundColor: Colors.primary[600], paddingHorizontal: Spacing[3], paddingVertical: 6, borderRadius: Radius.md, alignItems: 'center', gap: 4 },
  textoAgregar: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  textoDescanso: { ...Typography.styles.caption, color: Colors.text.disabled, fontStyle: 'italic', marginTop: 5 },

  cajaBloque: { backgroundColor: Colors.neutral[50], padding: Spacing[3], borderRadius: Radius.md, marginBottom: Spacing[3], borderWidth: 1, borderColor: Colors.border.default },
  
  filaServicio: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  bordePickerFull: { flex: 1, borderWidth: 1, borderColor: Colors.border.default, borderRadius: Radius.md, backgroundColor: '#fff', height: 40, justifyContent: 'center', overflow: 'hidden' },
  
  botonEliminar: { padding: 8, backgroundColor: Colors.error.light, borderRadius: Radius.md },

  filaTiempo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bordePickerMitad: { flex: 1, borderWidth: 1, borderColor: Colors.border.default, borderRadius: Radius.md, backgroundColor: '#fff', height: 40, justifyContent: 'center', overflow: 'hidden' },
  separadorHora: { marginHorizontal: 10, fontWeight: 'bold', color: Colors.text.secondary },

  picker: { width: '100%', height: '100%' },

  mensajeToast: { position: 'absolute', bottom: 100, left: 20, right: 20, padding: Spacing[4], borderRadius: Radius.md, flexDirection: 'row', alignItems: 'center', gap: 10, elevation: 5, zIndex: 999 },
  toastExito: { backgroundColor: Colors.success.main },
  toastError: { backgroundColor: Colors.error.main },
  mensajeToastTxt: { ...Typography.styles.body, color: '#fff', fontWeight: 'bold', flex: 1 },

  contenedorFijoAbajo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing[5], backgroundColor: Colors.neutral[50], borderTopWidth: 1, borderTopColor: Colors.border.default },
  botonPrimario: { backgroundColor: Colors.primary[600], padding: Spacing[4], borderRadius: Radius.md, alignItems: 'center', ...Shadow.brand },
  textoBotonPrimario: { ...Typography.styles.btn, color: '#fff', fontWeight: '700' }
});