import { supabase } from '@/lib/supabase';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';
import { Radius, Shadow } from '@/theme/Spacing';

interface Cita {
  appointment_id: number;
  client_id: string;
  appointment_date: string;
  appointment_time: string;
  status: number;
  notes?: string;
  clientes?: { full_name: string };
  services?: { service_name: string, base_price: number };
}

export default function CalendarioScreen() {
  const { t } = useTranslation();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [pestañaActiva, setPestañaActiva] = useState<'pendientes' | 'aceptadas' | 'historial'>('pendientes');
  const [mensajeUI, setMensajeUI] = useState<{tipo: 'exito'|'error'|'info', texto: string} | null>(null);
  const [modalConfirmacion, setModalConfirmacion] = useState<{
    visible: boolean;
    titulo: string;
    mensaje: string;
    textoConfirmar: string;
    onConfirmar: () => void;
  } | null>(null);

  const mostrarMensaje = (tipo: 'exito'|'error'|'info', texto: string) => {
    setMensajeUI({ tipo, texto });
    setTimeout(() => setMensajeUI(null), 3000);
  };

  useEffect(() => {
    obtenerCitas();
  }, [pestañaActiva]);

  const obtenerCitas = async () => {
    try {
      setCargando(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Status: 0 = Pendiente, 1 = Aceptada, 2 = Rechazada, 3 = En Curso, 4 = Completada, 5 = Cancelada
      const estadosBuscados = pestañaActiva === 'pendientes' ? [0] : pestañaActiva === 'aceptadas' ? [1, 3] : [4];

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clientes:client_id(full_name),
          services:service_id(service_name, base_price)
        `)
        .eq('prof_id', user.id)
        .in('status', estadosBuscados)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

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

      let mensaje = 'Operación completada.';
      if (nuevoEstado === 1) mensaje = 'Cita aceptada.';
      if (nuevoEstado === 2) mensaje = 'Cita rechazada.';
      if (nuevoEstado === 3) mensaje = 'Trabajo marcado en curso.';
      if (nuevoEstado === 4) mensaje = 'Trabajo finalizado.';
      if (nuevoEstado === 5) mensaje = 'Cita cancelada.';

      mostrarMensaje('exito', mensaje);
      obtenerCitas();
    } catch (error: any) {
      mostrarMensaje('error', error.message);
    }
  };

  const intentarIniciarTrabajo = (cita: Cita) => {
    const verificarTiempo = () => {
      const ahora = new Date();
      const fechaCita = new Date(`${cita.appointment_date}T${cita.appointment_time}`);
      
      if (ahora < fechaCita) {
        setModalConfirmacion({
          visible: true,
          titulo: 'Cambio Inesperado',
          mensaje: 'Esta cita está programada para más tarde. ¿Ocurrió un cambio inesperado y el cliente ya está listo para empezar?',
          textoConfirmar: 'Sí, empezar ahora',
          onConfirmar: () => {
            setModalConfirmacion(null);
            actualizarEstadoCita(cita.appointment_id, 3);
          }
        });
      } else {
        actualizarEstadoCita(cita.appointment_id, 3);
      }
    };

    const hayEnCurso = citas.some(c => c.status === 3);
    if (hayEnCurso) {
      setModalConfirmacion({
        visible: true,
        titulo: 'Atención',
        mensaje: 'Ya tienes un trabajo EN CURSO. ¿Estás seguro de que quieres empezar este también sin finalizar el anterior?',
        textoConfirmar: 'Empezar de todos modos',
        onConfirmar: () => {
          setModalConfirmacion(null);
          verificarTiempo();
        }
      });
    } else {
      verificarTiempo();
    }
  };

  return (
    <View style={styles.contenedorFondo}>
      <View style={styles.cabecera}>
        <Text style={styles.tituloSeccion}>Gestión de Citas</Text>
      </View>
      
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

        <TouchableOpacity 
          style={[styles.pestaña, pestañaActiva === 'historial' && styles.pestañaActiva]}
          onPress={() => setPestañaActiva('historial')}
        >
          <Text style={[styles.textoPestaña, pestañaActiva === 'historial' && styles.textoPestañaActiva]}>
            Historial
          </Text>
        </TouchableOpacity>
      </View>

      {cargando ? (
        <View style={styles.centro}><ActivityIndicator size="large" color={Colors.primary[600]} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {citas.length === 0 ? (
            <Text style={styles.textoVacio}>
              No tienes {pestañaActiva === 'pendientes' ? 'citas pendientes por revisar.' : pestañaActiva === 'aceptadas' ? 'trabajos próximos agendados.' : 'trabajos finalizados.'}
            </Text>
          ) : (
            citas.map((cita) => {
              const esEnCurso = cita.status === 3;
              return (
                <View key={cita.appointment_id} style={[styles.tarjetaCita, esEnCurso && styles.tarjetaEnCurso]}>
                  
                  <View style={styles.tarjetaCabecera}>
                    <Text style={styles.nombreCliente}>{cita.clientes?.full_name || 'Cliente'}</Text>
                    {esEnCurso && (
                      <View style={styles.badgeEnCurso}>
                        <Text style={styles.badgeTxtEnCurso}>EN CURSO</Text>
                      </View>
                    )}
                    {cita.status === 4 && (
                      <View style={styles.badgeFinalizado}>
                        <Text style={styles.badgeTxtFinalizado}>FINALIZADO</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.infoCita}>
                    <View style={styles.infoRow}>
                      <Ionicons name="calendar-outline" size={16} color={Colors.text.secondary} />
                      <Text style={styles.infoTexto}>{cita.appointment_date}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="time-outline" size={16} color={Colors.text.secondary} />
                      <Text style={styles.infoTexto}>{cita.appointment_time.slice(0,5)}</Text>
                    </View>
                    {cita.services ? (
                      <View style={styles.infoRow}>
                        <Ionicons name="briefcase-outline" size={16} color={Colors.text.secondary} />
                        <Text style={styles.infoTexto}>{cita.services.service_name}</Text>
                      </View>
                    ) : null}
                    {cita.notes ? (
                      <View style={styles.notasBox}>
                        <Text style={styles.notasLabel}>Notas del cliente:</Text>
                        <Text style={styles.notasTexto}>{cita.notes}</Text>
                      </View>
                    ) : null}
                  </View>

                  {pestañaActiva === 'pendientes' ? (
                    <View style={styles.filaBotones}>
                      <TouchableOpacity 
                        style={styles.botonRechazar} 
                        onPress={() => actualizarEstadoCita(cita.appointment_id, 2)}
                      >
                        <Text style={styles.textoBotonRechazar}>{t('rechazar')}</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.botonAceptar} 
                        onPress={() => actualizarEstadoCita(cita.appointment_id, 1)}
                      >
                        <Text style={styles.textoBotonAceptar}>Aceptar Cita</Text>
                      </TouchableOpacity>
                    </View>
                  ) : pestañaActiva === 'aceptadas' ? (
                    <View style={styles.filaBotones}>
                      {!esEnCurso ? (
                        <>
                          <TouchableOpacity 
                            style={styles.botonRechazar} 
                            onPress={() => actualizarEstadoCita(cita.appointment_id, 5)}
                          >
                            <Text style={styles.textoBotonRechazar}>Cancelar</Text>
                          </TouchableOpacity>

                          <TouchableOpacity 
                            style={styles.botonEnCurso} 
                            onPress={() => intentarIniciarTrabajo(cita)}
                          >
                            <Text style={styles.textoBotonEnCurso}>Empezar Trabajo</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <TouchableOpacity 
                          style={styles.botonFinalizar} 
                          onPress={() => actualizarEstadoCita(cita.appointment_id, 4)}
                        >
                          <Text style={styles.textoBotonFinalizar}>Finalizar Trabajo</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Toast In-App */}
      {mensajeUI && (
        <View style={[styles.mensajeToast, mensajeUI.tipo === 'exito' ? styles.toastExito : styles.toastError]}>
          <Ionicons name={mensajeUI.tipo === 'exito' ? 'checkmark-circle' : 'warning'} size={24} color="#fff" />
          <Text style={styles.mensajeToastTxt}>{mensajeUI.texto}</Text>
        </View>
      )}

      {/* Modal de Confirmación In-App */}
      {modalConfirmacion && modalConfirmacion.visible && (
        <View style={styles.modalFondo}>
          <View style={styles.modalCaja}>
            <Text style={styles.modalTitulo}>{modalConfirmacion.titulo}</Text>
            <Text style={styles.modalTexto}>{modalConfirmacion.mensaje}</Text>
            
            <View style={styles.modalBotones}>
              <TouchableOpacity 
                style={styles.modalBotonCancelar} 
                onPress={() => setModalConfirmacion(null)}
              >
                <Text style={styles.modalTextoCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalBotonAceptar} 
                onPress={modalConfirmacion.onConfirmar}
              >
                <Text style={styles.modalTextoAceptar}>{modalConfirmacion.textoConfirmar}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  contenedorFondo: { flex: 1, backgroundColor: Colors.neutral[50], padding: 20 },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cabecera: { marginBottom: 15 },
  tituloSeccion: { fontSize: 26, fontWeight: 'bold', color: Colors.primary[800] },
  
  contenedorPestañas: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 5, borderRadius: Radius.button, borderWidth: 1, borderColor: Colors.border.default, marginBottom: 15 },
  pestaña: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.button },
  pestañaActiva: { backgroundColor: Colors.primary[100] },
  textoPestaña: { fontSize: 14, fontWeight: 'bold', color: Colors.text.secondary },
  textoPestañaActiva: { color: Colors.primary[700] },
  
  scroll: { paddingBottom: 50 },
  textoVacio: { textAlign: 'center', color: Colors.text.disabled, marginTop: 50, fontSize: 16 },
  
  tarjetaCita: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: Colors.border.default, ...Shadow.sm },
  tarjetaEnCurso: { borderColor: Colors.primary[400], borderWidth: 2 },
  
  tarjetaCabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  nombreCliente: { fontSize: 18, fontWeight: 'bold', color: Colors.text.primary },
  badgeEnCurso: { backgroundColor: Colors.primary[100], paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgeTxtEnCurso: { fontSize: 12, fontWeight: 'bold', color: Colors.primary[700] },

  badgeFinalizado: { backgroundColor: Colors.neutral[200], paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgeTxtFinalizado: { fontSize: 12, fontWeight: 'bold', color: Colors.text.secondary },

  infoCita: { marginBottom: 15 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoTexto: { fontSize: 15, color: Colors.text.primary },
  
  notasBox: { backgroundColor: Colors.neutral[50], padding: 10, borderRadius: 8, marginTop: 10 },
  notasLabel: { fontSize: 12, fontWeight: 'bold', color: Colors.text.secondary, marginBottom: 4 },
  notasTexto: { fontSize: 14, color: Colors.text.primary, fontStyle: 'italic' },
  
  filaBotones: { flexDirection: 'row', gap: 10 },
  
  botonRechazar: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.error.main, padding: 12, borderRadius: 8, alignItems: 'center' },
  textoBotonRechazar: { color: Colors.error.main, fontWeight: 'bold' },
  
  botonAceptar: { flex: 1, backgroundColor: Colors.primary[600], padding: 12, borderRadius: 8, alignItems: 'center', ...Shadow.brand },
  textoBotonAceptar: { color: '#FFFFFF', fontWeight: 'bold' },

  botonEnCurso: { flex: 1, backgroundColor: Colors.primary[100], borderWidth: 1, borderColor: Colors.primary[300], padding: 12, borderRadius: 8, alignItems: 'center' },
  textoBotonEnCurso: { color: Colors.primary[700], fontWeight: 'bold' },

  botonFinalizar: { flex: 1, backgroundColor: Colors.success.main, padding: 12, borderRadius: 8, alignItems: 'center', ...Shadow.sm },
  textoBotonFinalizar: { color: '#FFFFFF', fontWeight: 'bold' },

  mensajeToast: { position: 'absolute', bottom: 40, left: 20, right: 20, padding: 15, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 10, elevation: 5, zIndex: 999 },
  toastExito: { backgroundColor: Colors.success.main },
  toastError: { backgroundColor: Colors.error.main },
  mensajeToastTxt: { color: '#fff', fontWeight: 'bold', fontSize: 14, flex: 1 },

  modalFondo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalCaja: { backgroundColor: '#fff', padding: 24, borderRadius: 16, width: '85%', maxWidth: 400, ...Shadow.md },
  modalTitulo: { fontSize: 20, fontWeight: 'bold', color: Colors.text.primary, marginBottom: 10 },
  modalTexto: { fontSize: 15, color: Colors.text.secondary, marginBottom: 24, lineHeight: 22 },
  modalBotones: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalBotonCancelar: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: Colors.neutral[100] },
  modalTextoCancelar: { color: Colors.text.secondary, fontWeight: 'bold' },
  modalBotonAceptar: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: Colors.primary[600] },
  modalTextoAceptar: { color: '#fff', fontWeight: 'bold' }
});