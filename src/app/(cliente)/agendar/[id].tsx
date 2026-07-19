import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import NavbarCliente from '../../../components/NavbarCliente';
import { supabase } from '../../../lib/supabase';
import { Colors } from '../../../theme/Colors';
import { Radius, Shadow, Spacing } from '../../../theme/Spacing';
import { Typography } from '../../../theme/Typography';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';

LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene.', 'Feb.', 'Mar', 'Abr', 'May', 'Jun', 'Jul.', 'Ago', 'Sept.', 'Oct.', 'Nov.', 'Dic.'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

// Función para mapear fecha a día de la semana
const getDayName = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return days[date.getDay()];
};

// Generar intervalos
const generateTimeSlots = (start: string, end: string) => {
  const slots = [];
  let currentHour = parseInt(start.split(':')[0]);
  const endHour = parseInt(end.split(':')[0]);

  while (currentHour < endHour) {
    const formattedHour = currentHour.toString().padStart(2, '0') + ':00';
    slots.push(formattedHour);
    currentHour++;
  }
  return slots;
};

export default function AgendarCitaScreen() {
  const { isDark, colors } = useTheme();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [profesional, setProfesional] = useState<any>(null);
  const [servicios, setServicios] = useState<any[]>([]);
  const [horariosBD, setHorariosBD] = useState<any[]>([]); // Todos los bloques de service_schedules
  const [citasExistentes, setCitasExistentes] = useState<any[]>([]); // Citas ya agendadas
  
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState('');

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [dayOff, setDayOff] = useState(false);
  const [markedDatesObj, setMarkedDatesObj] = useState<any>({});
  const [mensajeUI, setMensajeUI] = useState<{tipo: 'exito'|'error'|'info', texto: string} | null>(null);

  const mostrarMensaje = (tipo: 'exito'|'error'|'info', texto: string) => {
    setMensajeUI({ tipo, texto });
    setTimeout(() => setMensajeUI(null), 3000);
  };

  useEffect(() => {
    cargarDatos();
  }, [id]);

  useEffect(() => {
    // Si cambia la fecha o el servicio, recalcular horas
    if (selectedDate && selectedService !== null) {
      const dayName = getDayName(selectedDate);
      
      // Filtrar los bloques que pertenecen a ese servicio específico y a ese día específico, que estén activos
      const bloquesDelDiaYServicio = horariosBD.filter(h => 
        h.service_id === selectedService &&
        h.day_of_week.toLowerCase().replace('é', 'e') === dayName.replace('é', 'e') &&
        h.is_active !== false
      );

      if (bloquesDelDiaYServicio.length > 0) {
        setDayOff(false);
        // Podría haber múltiples bloques en el mismo día para el mismo servicio (ej. mañana y tarde)
        let todasLasHoras: string[] = [];
        bloquesDelDiaYServicio.forEach(bloque => {
          todasLasHoras = todasLasHoras.concat(generateTimeSlots(bloque.start_time, bloque.end_time));
        });
        
        // Quitar duplicados por si acaso se solapan
        const uniqueHoras = Array.from(new Set(todasLasHoras)).sort();
        
        // Quitar horas ya ocupadas por otras citas
        const horasOcupadas = citasExistentes
          .filter(c => c.appointment_date === selectedDate)
          .map(c => c.appointment_time.slice(0,5));

        const horasDisponibles = uniqueHoras.filter(h => !horasOcupadas.includes(h));
        
        setAvailableSlots(horasDisponibles);
      } else {
        setDayOff(true);
        setAvailableSlots([]);
      }
      setSelectedTime(''); // Resetear hora al cambiar día o servicio
    } else {
      setAvailableSlots([]);
      setSelectedTime('');
    }
  }, [selectedDate, selectedService, horariosBD]);

  // Actualizar días marcados en el calendario cuando cambia el servicio
  useEffect(() => {
    if (selectedService !== null) {
      const diasAtiende = horariosBD
        .filter(h => h.service_id === selectedService && h.is_active !== false)
        .map(h => h.day_of_week.toLowerCase().replace('é', 'e'));
        
      const marcados: any = {};
      const hoy = new Date();
      
      // Calcular 90 días hacia adelante
      for (let i = 0; i < 90; i++) {
        const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const fechaStr = `${yyyy}-${mm}-${dd}`;
        
        const nombreDia = getDayName(fechaStr).replace('é', 'e');
        
        // Si el profesionista no atiende ese día de la semana, deshabilitar la fecha
        if (!diasAtiende.includes(nombreDia)) {
          marcados[fechaStr] = { disabled: true, disableTouchEvent: true, dotColor: 'transparent' };
        }
      }
      
      // Si hay una fecha seleccionada, agregarle el estilo de seleccionado
      if (selectedDate) {
        marcados[selectedDate] = { ...marcados[selectedDate], selected: true, selectedColor: colors.primary[600] };
      }
      
      setMarkedDatesObj(marcados);
    } else {
      setMarkedDatesObj({});
    }
  }, [selectedService, selectedDate, horariosBD]);

  const cargarDatos = async () => {
    try {
      const { data: prof, error: errorProf } = await supabase
        .from('professionals')
        .select('full_name, speciality')
        .eq('prof_id', id)
        .single();
      if (errorProf) throw errorProf;
      setProfesional(prof);

      const { data: servs, error: errorServs } = await supabase
        .from('services')
        .select('*')
        .eq('prof_id', id);
      if (errorServs) throw errorServs;
      setServicios(servs || []);

      const { data: schs, error: errorSchs } = await supabase
        .from('service_schedules')
        .select('*')
        .eq('prof_id', id);
      if (errorSchs) throw errorSchs;
      setHorariosBD(schs || []);

      // Obtener citas ya agendadas (no rechazadas ni canceladas)
      const { data: appts } = await supabase
        .from('appointments')
        .select('appointment_date, appointment_time, status')
        .eq('prof_id', id)
        .in('status', [0, 1, 3, 4]);
      setCitasExistentes(appts || []);

    } catch (e: any) {
      console.log('Error cargando datos de cita:', e);
      Alert.alert('Error', 'No se pudieron cargar los datos del profesional: ' + e.message);
      // router.back(); // Temporalmente removido para evitar que rebote si hay error de RLS
    } finally {
      setCargando(false);
    }
  };

  const handleAgendar = async () => {
    if (!selectedService) {
      mostrarMensaje('error', 'Primero debes seleccionar un servicio.');
      return;
    }
    if (!selectedDate || !selectedTime) {
      mostrarMensaje('error', 'Debes seleccionar una fecha y un horario.');
      return;
    }

    setGuardando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No sesión');

      const { error } = await supabase.from('appointments').insert([{
        client_id: user.id,
        prof_id: id,
        service_id: selectedService,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        status: 0,
        notes: notes
      }]);

      if (error) throw error;

      // Crear notificación para el profesionista
      const { error: notifError } = await supabase.from('notifications').insert([{
        user_id: id,
        type: 'appointment_new',
        content: t('nuevaSolicitudCita', { defaultValue: 'Tienes una nueva solicitud de cita de {{name}}', name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'un cliente' }),
        related_id: String(selectedService)
      }]);
      
      if (notifError) {
        console.error('Error insertando notificacion de cita:', notifError);
      }
      
      
      mostrarMensaje('exito', 'Tu solicitud de cita ha sido enviada.');
      
      // Limpiar formulario para permitir agendar otra
      setSelectedTime('');
      setNotes('');
      // Refrescar citas para actualizar horas ocupadas
      cargarDatos();
      
    } catch (error: any) {
      mostrarMensaje('error', 'Error al agendar: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.neutral[50] }}>
        <NavbarCliente />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <NavbarCliente />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>
          
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
            <Text style={styles.backTxt}>{t('Volver al perfil')}</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{t('Agendar Cita')}</Text>
          <Text style={styles.subtitle}>con {profesional?.full_name}</Text>

          {/* 1. Seleccionar Servicio (AHORA OBLIGATORIO) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('1. ¿Qué servicio necesitas?')}</Text>
            {servicios.length === 0 ? (
              <Text style={{ color: colors.text.disabled }}>{t('Este profesionista no tiene servicios disponibles.')}</Text>
            ) : (
              <View style={styles.serviceList}>
                {servicios.map(s => (
                  <TouchableOpacity
                    key={s.service_id}
                    style={[styles.serviceCard, selectedService === s.service_id && styles.serviceCardSelected]}
                    onPress={() => {
                      setSelectedService(s.service_id);
                      setSelectedTime(''); // Resetear hora al cambiar servicio
                    }}
                  >
                    <View style={styles.serviceHeader}>
                      <Text style={[styles.serviceTitle, selectedService === s.service_id && styles.serviceTitleSelected]}>
                        {s.service_name}
                      </Text>
                      <Text style={[styles.servicePrice, selectedService === s.service_id && styles.servicePriceSelected]}>
                        ${s.base_price}
                      </Text>
                    </View>
                    
                    {s.description && (
                      <Text style={styles.serviceDesc} numberOfLines={2}>{s.description}</Text>
                    )}
                    
                    <View style={styles.serviceMeta}>
                      <View style={styles.metaBadge}>
                        <Ionicons name="time-outline" size={14} color={selectedService === s.service_id ? colors.primary[700] : colors.text.secondary} />
                        <Text style={[styles.metaTxt, selectedService === s.service_id && styles.metaTxtSelected]}>
                          {s.duration_minutes} min
                        </Text>
                      </View>
                      <View style={styles.metaBadge}>
                        <Ionicons name="location-outline" size={14} color={selectedService === s.service_id ? colors.primary[700] : colors.text.secondary} />
                        <Text style={[styles.metaTxt, selectedService === s.service_id && styles.metaTxtSelected]}>
                          {s.modality || 'Presencial'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* 2. Seleccionar Fecha */}
          {selectedService && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('2. Selecciona la fecha')}</Text>
              <View style={styles.calendarWrap}>
                <Calendar
                  onDayPress={(day: DateData) => {
                    // Solo permitir seleccionar si no está deshabilitado
                    if (!markedDatesObj[day.dateString]?.disabled) {
                      setSelectedDate(day.dateString);
                    }
                  }}
                  markedDates={markedDatesObj}
                  minDate={new Date().toISOString().split('T')[0]}
                  theme={{
                    calendarBackground: colors.neutral[0],
                    textSectionTitleColor: colors.text.secondary,
                    selectedDayBackgroundColor: colors.primary[600],
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: colors.primary[600],
                    dayTextColor: colors.text.primary,
                    textDisabledColor: colors.text.disabled,
                    monthTextColor: colors.text.primary,
                    arrowColor: colors.primary[600],
                  }}
                />
              </View>
            </View>
          )}

          {/* 3. Seleccionar Hora */}
          {selectedService && selectedDate ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('3. Selecciona el horario')}</Text>
              
              {dayOff ? (
                <View style={styles.alertBox}>
                  <Ionicons name="information-circle-outline" size={20} color={colors.text.secondary} />
                  <Text style={styles.alertTxt}>{t('El profesionista no atiende este servicio en este día. Selecciona otra fecha.')}</Text>
                </View>
              ) : availableSlots.length === 0 ? (
                <View style={styles.alertBox}>
                  <Ionicons name="information-circle-outline" size={20} color={colors.text.secondary} />
                  <Text style={styles.alertTxt}>{t('No hay horarios configurados para este servicio hoy.')}</Text>
                </View>
              ) : (
                <View style={styles.timeGrid}>
                  {availableSlots.map(time => (
                    <TouchableOpacity
                      key={time}
                      style={[styles.timeSlot, selectedTime === time && styles.timeSlotSelected]}
                      onPress={() => setSelectedTime(time)}
                    >
                      <Text style={[styles.timeSlotTxt, selectedTime === time && styles.timeSlotTxtSelected]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('Notas Adicionales (Opcional)')}</Text>
            <TextInput
              style={styles.inputArea}
              placeholder={t('Describe brevemente lo que necesitas o algún detalle para el profesionista...')}
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={setNotes}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, (!selectedDate || !selectedTime || !selectedService) && styles.submitBtnDisabled]} 
            onPress={handleAgendar}
            disabled={!selectedDate || !selectedTime || !selectedService || guardando}
          >
            {guardando ? (
              <ActivityIndicator color={colors.neutral[0]} />
            ) : (
              <Text style={styles.submitBtnTxt}>{t('Confirmar Cita')}</Text>
            )}
          </TouchableOpacity>

        </View>
      </ScrollView>

      {mensajeUI && (
        <View style={[styles.mensajeToast, mensajeUI.tipo === 'exito' ? styles.toastExito : styles.toastError]}>
          <Ionicons name={mensajeUI.tipo === 'exito' ? 'checkmark-circle' : 'warning'} size={24} color={colors.neutral[0]} />
          <Text style={styles.mensajeToastTxt}>{mensajeUI.texto}</Text>
        </View>
      )}

    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.neutral[50] },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: Spacing[4] },
  container: { maxWidth: 800, width: '100%', alignSelf: 'center', backgroundColor: colors.neutral[0], borderRadius: Radius.card, padding: Spacing[6], ...Shadow.md },
  
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[4] },
  backTxt: { ...Typography.styles.body, marginLeft: Spacing[2], fontWeight: '500', color: colors.text.primary },
  
  title: { ...Typography.styles.h2, color: colors.primary[800], marginBottom: 2 },
  subtitle: { ...Typography.styles.body, color: colors.text.secondary, marginBottom: Spacing[6] },

  section: { marginBottom: Spacing[6] },
  sectionTitle: { ...Typography.styles.h5, color: colors.text.primary, marginBottom: Spacing[4] },

  serviceList: { gap: Spacing[3] },
  serviceCard: { backgroundColor: colors.neutral[0], borderRadius: Radius.card, padding: Spacing[4], borderWidth: 1, borderColor: colors.border.default },
  serviceCardSelected: { borderColor: colors.primary[600], backgroundColor: colors.primary[50] },
  serviceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[2] },
  serviceTitle: { ...Typography.styles.h5, color: colors.text.primary, flex: 1 },
  serviceTitleSelected: { color: colors.primary[800] },
  servicePrice: { ...Typography.styles.h4, color: colors.primary[600] },
  servicePriceSelected: { color: colors.primary[800] },
  serviceDesc: { ...Typography.styles.bodySm, color: colors.text.secondary, marginBottom: Spacing[3] },
  
  serviceMeta: { flexDirection: 'row', gap: Spacing[3] },
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.neutral[100], paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  metaTxt: { ...Typography.styles.caption, color: colors.text.secondary, fontWeight: '500' },
  metaTxtSelected: { color: colors.primary[700] },

  calendarWrap: { borderWidth: 1, borderColor: colors.border.default, borderRadius: Radius.card, overflow: 'hidden' },
  
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
  timeSlot: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: Radius.button, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.neutral[0], minWidth: 80, alignItems: 'center' },
  timeSlotSelected: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  timeSlotTxt: { ...Typography.styles.body, color: colors.text.primary },
  timeSlotTxtSelected: { color: colors.neutral[0], fontWeight: 'bold' },

  alertBox: { backgroundColor: colors.neutral[100], padding: Spacing[4], borderRadius: Radius.button, flexDirection: 'row', alignItems: 'center', gap: 10 },
  alertTxt: { ...Typography.styles.bodySm, color: colors.text.secondary, flex: 1 },

  inputArea: {  borderWidth: 1, borderColor: colors.border.default, borderRadius: Radius.button, padding: Spacing[4], ...Typography.styles.body, minHeight: 100, backgroundColor: colors.neutral[0] , color: colors.text.primary },

  submitBtn: { backgroundColor: colors.primary[600], padding: Spacing[4], borderRadius: Radius.button, alignItems: 'center', ...Shadow.brand, marginTop: Spacing[2] },
  submitBtnDisabled: { backgroundColor: colors.neutral[300], shadowOpacity: 0 },
  submitBtnTxt: { ...Typography.styles.btn, color: colors.neutral[0], fontSize: 16 },

  mensajeToast: { position: 'absolute', bottom: 40, left: 20, right: 20, padding: 15, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 10, elevation: 5, zIndex: 999 },
  toastExito: { backgroundColor: colors.success.main },
  toastError: { backgroundColor: colors.error.main },
  mensajeToastTxt: { color: colors.neutral[0], fontWeight: 'bold', fontSize: 14, flex: 1 }
});
