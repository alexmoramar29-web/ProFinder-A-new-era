import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, Pressable } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { Colors } from '../../../theme/Colors';
import { Typography } from '../../../theme/Typography';
import { Radius, Shadow, Spacing } from '../../../theme/Spacing';
import NavbarCliente from '../../../components/NavbarCliente';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function ServiciosClienteScreen() {
  const { t } = useTranslation();
  const [pestañaActiva, setPestañaActiva] = useState<'pendientes' | 'proximas' | 'historial'>('pendientes');
  const [citas, setCitas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [misReseñas, setMisReseñas] = useState<number[]>([]);

  const [modalReseña, setModalReseña] = useState<{ visible: boolean, cita: any } | null>(null);
  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState('');
  const [guardandoReseña, setGuardandoReseña] = useState(false);
  const [confirmandoReseña, setConfirmandoReseña] = useState(false);
  const [mensajeUI, setMensajeUI] = useState<{tipo: 'exito'|'error', texto: string} | null>(null);

  const mostrarMensaje = (tipo: 'exito'|'error', texto: string) => {
    setMensajeUI({ tipo, texto });
    setTimeout(() => setMensajeUI(null), 3000);
  };

  // Recargar datos cada vez que la pantalla gana foco
  useFocusEffect(
    useCallback(() => {
      cargarCitas();
    }, [pestañaActiva])
  );

  const cargarCitas = async () => {
    try {
      setCargando(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const estados = pestañaActiva === 'pendientes' ? [0] : pestañaActiva === 'proximas' ? [1, 3] : [4];

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          professionals:prof_id(full_name),
          services:service_id(service_name, base_price, duration_minutes)
        `)
        .eq('client_id', user.id)
        .in('status', estados)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      setCitas(data || []);

      // Obtener reseñas de este usuario
      const { data: revs } = await supabase
        .from('reviews')
        .select('appointment_id')
        .eq('user_id', user.id);
      
      if (revs) {
        setMisReseñas(revs.map(r => r.appointment_id).filter(id => id != null));
      }

    } catch (e: any) {
      console.log('Error cargando citas del cliente:', e.message);
    } finally {
      setCargando(false);
    }
  };

  const guardarReseña = async () => {
    if (estrellas === 0) {
      Alert.alert(t('Faltan datos'), t('Por favor selecciona una calificación de 1 a 5 estrellas.'));
      return;
    }
    
    if (!confirmandoReseña) {
      setConfirmandoReseña(true);
      return;
    }

    setGuardandoReseña(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('reviews').insert([{
        user_id: user.id,
        service_id: modalReseña?.cita.service_id,
        appointment_id: modalReseña?.cita.appointment_id,
        rating: estrellas,
        comment: comentario,
        date_posted: new Date().toISOString()
      }]);

      if (error) throw error;

      const { error: notifError } = await supabase.from('notifications').insert([{
        user_id: modalReseña?.cita.prof_id,
        type: 'review_new',
        content: t('nuevaResenaNotif', { defaultValue: 'Has recibido una nueva reseña de {{estrellas}} estrellas de {{name}}.', estrellas, name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'un cliente' }),
        related_id: modalReseña?.cita.appointment_id?.toString()
      }]);

      if (notifError) {
        console.error('Error insertando notificacion de reseña:', notifError);
      }

      mostrarMensaje('exito', t('¡Gracias! Tu reseña ha sido guardada.'));
      setModalReseña(null);
      setConfirmandoReseña(false);
      cargarCitas(); // Refrescar para que aparezca "Reseña ya hecha"
    } catch (e: any) {
      mostrarMensaje('error', t('Error al guardar la reseña:') + ' ' + e.message);
      setConfirmandoReseña(false);
    } finally {
      setGuardandoReseña(false);
    }
  };

  const calcularTiempoRestante = (fecha: string, hora: string) => {
    const fechaCita = new Date(`${fecha}T${hora}`);
    const ahora = new Date();
    const diferenciaMs = fechaCita.getTime() - ahora.getTime();

    if (diferenciaMs <= 0) return 'El momento de la cita ha llegado';

    const dias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferenciaMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diferenciaMs % (1000 * 60 * 60)) / (1000 * 60));

    let texto = 'Faltan ';
    if (dias > 0) texto += `${dias} d `;
    if (horas > 0 || dias > 0) texto += `${horas} h `;
    texto += `${minutos} min`;
    return texto;
  };

  return (
    <View style={styles.root}>
      <NavbarCliente />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>
          
          <Text style={styles.title}>{t('Mis Citas')}</Text>
          <Text style={styles.subtitle}>{t('Haz seguimiento a tus solicitudes y próximos servicios.')}</Text>

          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tab, pestañaActiva === 'pendientes' && styles.tabActiva]}
              onPress={() => setPestañaActiva('pendientes')}
            >
              <Text style={[styles.tabTxt, pestañaActiva === 'pendientes' && styles.tabTxtActiva]}>{t('Solicitudes Pendientes')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, pestañaActiva === 'proximas' && styles.tabActiva]}
              onPress={() => setPestañaActiva('proximas')}
            >
              <Text style={[styles.tabTxt, pestañaActiva === 'proximas' && styles.tabTxtActiva]}>{t('Próximos Trabajos')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, pestañaActiva === 'historial' && styles.tabActiva]}
              onPress={() => setPestañaActiva('historial')}
            >
              <Text style={[styles.tabTxt, pestañaActiva === 'historial' && styles.tabTxtActiva]}>{t('Historial')}</Text>
            </TouchableOpacity>
          </View>

          {cargando ? (
            <ActivityIndicator size="large" color={Colors.primary[600]} style={{ marginTop: 40 }} />
          ) : citas.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={48} color={Colors.text.disabled} />
              <Text style={styles.emptyTxt}>{t('No tienes citas en esta sección.')}</Text>
            </View>
          ) : (
            <View style={styles.lista}>
              {citas.map(cita => {
                const nombreServicio = cita.services?.service_name || 'Servicio';
                const nombreProf = cita.professionals?.full_name || 'Profesionista';
                // Usando split para parsear localmente sin UTC bug
                const [y, m, d] = cita.appointment_date.split('-');
                const fechaObj = new Date(Number(y), Number(m)-1, Number(d));
                const fechaFormat = fechaObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
                
                const yaReseñado = misReseñas.includes(cita.appointment_id);

                return (
                  <View key={cita.appointment_id} style={styles.tarjeta}>
                    <View style={styles.tarjetaCabecera}>
                      <Text style={styles.tarjetaTitulo}>{nombreServicio}</Text>
                      {cita.status === 3 && (
                        <View style={styles.badgeEnCurso}>
                          <Text style={styles.badgeTxtEnCurso}>{t('EN CURSO')}</Text>
                        </View>
                      )}
                      {cita.status === 4 && (
                        <View style={styles.badgeFinalizado}>
                          <Text style={styles.badgeTxtFinalizado}>{t('FINALIZADO')}</Text>
                        </View>
                      )}
                      {cita.status === 0 && (
                        <View style={styles.badgePendiente}>
                          <Text style={styles.badgeTxtPendiente}>{t('ESPERANDO RESPUESTA')}</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.profTxt}>{t('Con:')} {nombreProf}</Text>

                    <View style={styles.detallesRow}>
                      <View style={styles.detalleItem}>
                        <Ionicons name="calendar" size={16} color={Colors.text.secondary} />
                        <Text style={styles.detalleTxt}>{fechaFormat.charAt(0).toUpperCase() + fechaFormat.slice(1)}</Text>
                      </View>
                      <View style={styles.detalleItem}>
                        <Ionicons name="time" size={16} color={Colors.text.secondary} />
                        <Text style={styles.detalleTxt}>{cita.appointment_time.substring(0, 5)} hrs</Text>
                      </View>
                    </View>

                    {pestañaActiva === 'proximas' && (
                      <View style={styles.contadorCaja}>
                        <Ionicons name="timer-outline" size={20} color={Colors.primary[700]} />
                        <Text style={styles.contadorTxt}>
                          {calcularTiempoRestante(cita.appointment_date, cita.appointment_time)}
                        </Text>
                      </View>
                    )}

                    {pestañaActiva === 'historial' && (
                      yaReseñado ? (
                        <View style={styles.reseñaHechaBox}>
                          <Ionicons name="checkmark-circle" size={18} color={Colors.success.main} />
                          <Text style={styles.reseñaHechaTxt}>{t('Reseña ya hecha')}</Text>
                        </View>
                      ) : (
                        <TouchableOpacity 
                          style={styles.reseñaBtn}
                          onPress={() => {
                            setEstrellas(0);
                            setComentario('');
                            setConfirmandoReseña(false);
                            setModalReseña({ visible: true, cita });
                          }}
                        >
                          <Ionicons name="star" size={18} color="#fff" />
                          <Text style={styles.reseñaBtnTxt}>{t('Dejar una Reseña')}</Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                );
              })}
            </View>
          )}

        </View>
      </ScrollView>

      {/* Modal para Dejar Reseña */}
      {modalReseña && modalReseña.visible && (
        <View style={styles.modalFondo}>
          <View style={styles.modalCaja}>
            <Text style={styles.modalTitulo}>{t('Calificar Servicio')}</Text>
            <Text style={styles.modalSub}>¿Cómo te fue con "{modalReseña.cita.services?.service_name}"?</Text>
            
            <View style={styles.estrellasCaja}>
              {[1, 2, 3, 4, 5].map((num) => (
                <View key={num} style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}>
                  <FontAwesome 
                    style={{ position: 'absolute' }}
                    name={estrellas >= num ? 'star' : (estrellas >= num - 0.5 ? 'star-half-o' : 'star-o')} 
                    size={40} 
                    color={estrellas >= num - 0.5 ? Colors.primary[600] : Colors.text.disabled} 
                  />
                  <View style={{ flexDirection: 'row', width: '100%', height: '100%' }}>
                    <TouchableOpacity
                      style={{ flex: 1, backgroundColor: 'transparent' }}
                      onPress={() => setEstrellas(num - 0.5)}
                    />
                    <TouchableOpacity
                      style={{ flex: 1, backgroundColor: 'transparent' }}
                      onPress={() => setEstrellas(num)}
                    />
                  </View>
                </View>
              ))}
            </View>

            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.primary[600] }}>
                {estrellas > 0 ? `${estrellas} ${t('Estrellas')}` : t('Toca para calificar')}
              </Text>
            </View>

            <Text style={styles.inputLabel}>{t('Tu opinión (opcional):')}</Text>
            <TextInput
              style={styles.inputComentario}
              placeholder={t('Cuéntanos tu experiencia...')}
              multiline
              numberOfLines={3}
              value={comentario}
              onChangeText={setComentario}
              textAlignVertical="top"
            />
            
            <View style={styles.modalBotones}>
              <TouchableOpacity 
                style={styles.modalBtnCancelar} 
                onPress={() => {
                  setModalReseña(null);
                  setConfirmandoReseña(false);
                }}
              >
                <Text style={styles.modalTxtCancelar}>{t('Cancelar')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.modalBtnGuardar, 
                  guardandoReseña && { opacity: 0.7 },
                  confirmandoReseña && { backgroundColor: Colors.warning.main }
                ]} 
                onPress={guardarReseña}
                disabled={guardandoReseña}
              >
                {guardandoReseña ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : confirmandoReseña ? (
                  <Text style={styles.modalTxtGuardar}>{t('¿Estás seguro?')}</Text>
                ) : (
                  <Text style={styles.modalTxtGuardar}>{t('Enviar Reseña')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Toast */}
      {mensajeUI && (
        <View style={[styles.mensajeToast, mensajeUI.tipo === 'exito' ? styles.toastExito : styles.toastError]}>
          <Ionicons name={mensajeUI.tipo === 'exito' ? 'checkmark-circle' : 'warning'} size={24} color="#fff" />
          <Text style={styles.mensajeToastTxt}>{mensajeUI.texto}</Text>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.neutral[50] },
  scroll: { padding: Spacing[4] },
  container: { maxWidth: 800, width: '100%', alignSelf: 'center', padding: Spacing[4] },
  
  title: { ...Typography.styles.h2, color: Colors.primary[800], marginBottom: 2 },
  subtitle: { ...Typography.styles.body, color: Colors.text.secondary, marginBottom: Spacing[6] },

  tabsContainer: { flexDirection: 'row', backgroundColor: '#e5e7eb', borderRadius: 8, padding: 4, marginBottom: Spacing[6] },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  tabActiva: { backgroundColor: '#fff', ...Shadow.sm },
  tabTxt: { ...Typography.styles.body, color: Colors.text.secondary, fontWeight: '500' },
  tabTxtActiva: { color: Colors.primary[700], fontWeight: 'bold' },

  emptyBox: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyTxt: { ...Typography.styles.body, color: Colors.text.disabled },

  lista: { gap: Spacing[4] },
  tarjeta: { backgroundColor: '#fff', borderRadius: Radius.card, padding: Spacing[5], ...Shadow.md, borderWidth: 1, borderColor: Colors.border.default },
  
  tarjetaCabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  tarjetaTitulo: { ...Typography.styles.h4, color: Colors.text.primary, flex: 1 },
  
  profTxt: { ...Typography.styles.body, color: Colors.primary[600], fontWeight: '500', marginBottom: Spacing[4] },

  detallesRow: { flexDirection: 'row', gap: Spacing[4], flexWrap: 'wrap', marginBottom: Spacing[2] },
  detalleItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detalleTxt: { ...Typography.styles.bodySm, color: Colors.text.secondary },

  badgePendiente: { backgroundColor: Colors.neutral[200], paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeTxtPendiente: { fontSize: 10, fontWeight: 'bold', color: Colors.text.secondary },

  badgeEnCurso: { backgroundColor: Colors.success.main, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeTxtEnCurso: { fontSize: 10, fontWeight: 'bold', color: '#fff' },

  badgeFinalizado: { backgroundColor: Colors.neutral[600], paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeTxtFinalizado: { fontSize: 10, fontWeight: 'bold', color: '#fff' },

  contadorCaja: { marginTop: Spacing[4], backgroundColor: Colors.primary[50], padding: Spacing[3], borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: Colors.primary[200] },
  contadorTxt: { ...Typography.styles.body, color: Colors.primary[800], fontWeight: '600' },

  reseñaBtn: { marginTop: Spacing[4], backgroundColor: Colors.primary[600], padding: Spacing[3], borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, ...Shadow.sm },
  reseñaBtnTxt: { ...Typography.styles.btn, color: '#fff', fontSize: 15 },

  reseñaHechaBox: { marginTop: Spacing[4], backgroundColor: Colors.neutral[100], padding: Spacing[3], borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  reseñaHechaTxt: { ...Typography.styles.body, color: Colors.success.main, fontWeight: 'bold' },

  modalFondo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalCaja: { backgroundColor: '#fff', padding: 24, borderRadius: 16, width: '90%', maxWidth: 400, ...Shadow.md },
  modalTitulo: { ...Typography.styles.h4, color: Colors.text.primary, textAlign: 'center', marginBottom: 4 },
  modalSub: { ...Typography.styles.bodySm, color: Colors.text.secondary, textAlign: 'center', marginBottom: 20 },
  estrellasCaja: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 8 },
  calificacionTexto: { textAlign: 'center', ...Typography.styles.body, fontWeight: 'bold', color: Colors.primary[700], marginBottom: 24 },
  inputLabel: { ...Typography.styles.bodySm, fontWeight: 'bold', color: Colors.text.primary, marginBottom: 8 },
  inputComentario: { borderWidth: 1, borderColor: Colors.border.default, borderRadius: 8, padding: 12, minHeight: 80, ...Typography.styles.body, backgroundColor: Colors.neutral[50], marginBottom: 24 },
  modalBotones: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalBtnCancelar: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: Colors.neutral[100] },
  modalTxtCancelar: { color: Colors.text.secondary, fontWeight: 'bold' },
  modalBtnGuardar: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: Colors.primary[600] },
  modalTxtGuardar: { color: '#fff', fontWeight: 'bold' },

  mensajeToast: { position: 'absolute', bottom: 40, left: 20, right: 20, padding: 15, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 10, elevation: 5, zIndex: 999 },
  toastExito: { backgroundColor: Colors.success.main },
  toastError: { backgroundColor: Colors.error.main },
  mensajeToastTxt: { color: '#fff', fontWeight: 'bold', fontSize: 14, flex: 1 }
});
