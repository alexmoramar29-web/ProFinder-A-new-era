import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import NavbarProfesionista from '@/components/NavbarProfesionista';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/Colors';
import { Radius, Shadow, Spacing } from '../../theme/Spacing';
import { Typography } from '../../theme/Typography';
import { useTheme } from '@/context/ThemeContext';

export default function DashboardScreen() {
  const { isDark, colors } = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const { t } = useTranslation();
  const [cargando, setCargando] = useState(true);
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [citasHoy, setCitasHoy] = useState(0);
  const [citasFinalizadas, setCitasFinalizadas] = useState(0);
  const [citasEnCurso, setCitasEnCurso] = useState(0);
  const [proximasCitas, setProximasCitas] = useState<any[]>([]);

  useEffect(() => {
    cargarDatosResumen();
  }, []);

  const cargarDatosResumen = async () => {
    try {
      setCargando(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: perfil } = await supabase
        .from('professionals')
        .select('full_name')
        .eq('prof_id', user.id)
        .single();
        
      if (perfil) {
        const primerNombre = perfil.full_name.split(' ')[0];
        setNombreUsuario(primerNombre);
      }

      const { count } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('prof_id', user.id)
        .eq('status', 0);

      setCitasHoy(count || 0);

      // Obtener citas completadas
      const { count: countFinalizadas } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('prof_id', user.id)
        .eq('status', 4);
      setCitasFinalizadas(countFinalizadas || 0);

      // Obtener citas en curso
      const { count: countEnCurso } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('prof_id', user.id)
        .eq('status', 3);
      setCitasEnCurso(countEnCurso || 0);

      const { data: citasRecientes } = await supabase
        .from('appointments')
        .select(`
          appointment_id,
          appointment_date,
          appointment_time,
          status,
          clientes:users!fk_appointments_client(full_name),
          services(service_name)
        `)
        .eq('prof_id', user.id)
        .in('status', [0, 1])
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })
        .limit(3);

      setProximasCitas(citasRecientes || []);

    } catch (error) {
      console.log('Error al cargar dashboard:', error);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return <View style={styles.centro}><ActivityIndicator size="large" color={colors.primary[600]} /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral[50] }}>
      <NavbarProfesionista />
      <ScrollView style={styles.contenedorFondo} contentContainerStyle={styles.scroll}>
        
        {/* SECCIÓN 1: Saludo y Bienvenida */}
      <View style={styles.seccionSaludo}>
        <Text style={styles.textoSaludo}>{t('bienvenidoDeNuevo')}</Text>
        <Text style={styles.textoNombre}>{nombreUsuario || t('profesionalDefault')}</Text>
      </View>

      {/* SECCIÓN 2: Tarjetas de Resumen Rápido */}
      <View style={styles.contenedorTarjetas}>
        <View style={styles.tarjetaPrimaria}>
          <Text style={styles.tituloTarjetaBlanco}>{t('citasCompletadasMes') || 'Citas Finalizadas'}</Text>
          <Text style={styles.valorTarjetaBlanco}>{citasFinalizadas}</Text>
          <Text style={styles.subtextoTarjetaBlanco}>Histórico total</Text>
        </View>

        <View style={styles.columnaTarjetasSecundarias}>
          <TouchableOpacity 
            style={styles.tarjetaSecundaria}
            onPress={() => router.push('/(profesionista)/calendario')}
          >
            <Text style={styles.tituloTarjetaOscuro}>{t('solicitudes')}</Text>
            <Text style={styles.valorTarjetaOscuro}>{citasHoy}</Text>
            <Text style={styles.subtextoTarjetaOscuro}>{t('pendientes')}</Text>
          </TouchableOpacity>

          <View style={styles.tarjetaSecundaria}>
            <Text style={styles.tituloTarjetaOscuro}>En Curso</Text>
            <Text style={styles.valorTarjetaOscuro}>{citasEnCurso}</Text>
            <Text style={styles.subtextoTarjetaOscuro}>Servicios activos</Text>
          </View>
        </View>
      </View>

      {/* SECCIÓN 3: Próximas Citas */}
      <View style={styles.contenedorGrafica}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={[styles.tituloSeccion, { marginBottom: 0 }]}>{t('proximasCitas') || 'Próximas Citas'}</Text>
          <TouchableOpacity onPress={() => router.push('/(profesionista)/calendario')}>
             <Text style={{ ...Typography.styles.bodySm, color: colors.primary[600], fontWeight: '600' }}>{t('verTodas') || 'Ver todas'}</Text>
          </TouchableOpacity>
        </View>
        
        {proximasCitas.length === 0 ? (
           <View style={{ padding: 24, backgroundColor: colors.neutral[0], borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border.default }}>
             <Ionicons name="calendar-outline" size={32} color={colors.text.disabled} style={{ marginBottom: 8 }} />
             <Text style={{ color: colors.text.disabled }}>No tienes citas próximas o pendientes.</Text>
           </View>
        ) : (
           proximasCitas.map((cita) => (
             <TouchableOpacity key={cita.appointment_id} style={styles.citaCard} onPress={() => router.push('/(profesionista)/calendario')}>
               <View style={styles.citaCirculo}>
                 <Ionicons name={cita.status === 0 ? "time-outline" : "checkmark-circle-outline"} size={22} color={cita.status === 0 ? colors.warning.main : colors.success.main} />
               </View>
               <View style={styles.citaInfo}>
                 <Text style={styles.citaCliente}>{cita.clientes?.full_name || 'Cliente'}</Text>
                 <Text style={styles.citaServicio}>{cita.services?.service_name || 'Servicio'}</Text>
               </View>
               <View style={styles.citaFechaWrap}>
                 <Text style={styles.citaFecha}>{cita.appointment_date}</Text>
                 <Text style={styles.citaHora}>{cita.appointment_time.slice(0, 5)}</Text>
               </View>
             </TouchableOpacity>
           ))
        )}
      </View>

      {/* SECCIÓN 4: Accesos Rápidos */}
      <Text style={styles.tituloSeccion}>{t('accesosRapidos')}</Text>
      <View style={styles.contenedorAcciones}>
        <TouchableOpacity style={styles.botonAccion} onPress={() => router.push('/(profesionista)/horarios')}>
          <Text style={styles.textoBotonAccion}>{t('modificarHorarios')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.botonAccion} onPress={() => router.push('/(profesionista)/servicios')}>
          <Text style={styles.textoBotonAccion}>{t('gestionarServicios')}</Text>
        </TouchableOpacity>
      </View>

      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.neutral[50] },
  contenedorFondo: { flex: 1, backgroundColor: colors.neutral[50] },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[10] },
  
  seccionSaludo: { marginBottom: Spacing[6] },
  textoSaludo: { ...Typography.styles.body, color: colors.text.secondary, marginBottom: 4 },
  textoNombre: { ...Typography.styles.h2, color: colors.text.primary, fontWeight: '800' },
  
  contenedorTarjetas: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing[4], marginBottom: Spacing[6] },
  
  tarjetaPrimaria: { flex: 1, backgroundColor: colors.primary[600], borderRadius: Radius.xl, padding: Spacing[5], justifyContent: 'center', ...Shadow.brand },
  tituloTarjetaBlanco: { ...Typography.styles.label, color: colors.primary[100], fontWeight: '600', marginBottom: Spacing[2] },
  valorTarjetaBlanco: { ...Typography.styles.h1, color: colors.neutral[0], fontWeight: '800', marginBottom: 4 },
  subtextoTarjetaBlanco: { ...Typography.styles.caption, color: colors.primary[200] },
  
  columnaTarjetasSecundarias: { flex: 0.8, justifyContent: 'space-between', gap: Spacing[3] },
  tarjetaSecundaria: { backgroundColor: colors.neutral[0], borderRadius: Radius.lg, padding: Spacing[4], borderWidth: 1, borderColor: colors.border.default, flex: 1, justifyContent: 'center', ...Shadow.sm },
  tituloTarjetaOscuro: { ...Typography.styles.label, color: colors.text.secondary, fontWeight: '600', marginBottom: 2 },
  valorTarjetaOscuro: { ...Typography.styles.h3, color: colors.text.primary, fontWeight: '800', marginBottom: 2 },
  subtextoTarjetaOscuro: { ...Typography.styles.caption, color: colors.text.disabled },
  
  contenedorGrafica: { backgroundColor: colors.neutral[0], borderRadius: Radius.xl, padding: Spacing[5], marginBottom: Spacing[6], borderWidth: 1, borderColor: colors.border.default, ...Shadow.md },
  tituloSeccion: { ...Typography.styles.h4, fontWeight: '700', color: colors.text.primary, marginBottom: 4 },
  subtituloSeccion: { ...Typography.styles.bodySm, color: colors.text.secondary, marginBottom: Spacing[5] },
  
  citaCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.neutral[0], padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border.default, ...Shadow.sm },
  citaCirculo: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.neutral[100], alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  citaInfo: { flex: 1 },
  citaCliente: { ...Typography.styles.body, fontWeight: '700', color: colors.text.primary, marginBottom: 2 },
  citaServicio: { ...Typography.styles.caption, color: colors.text.secondary },
  citaFechaWrap: { alignItems: 'flex-end' },
  citaFecha: { ...Typography.styles.bodySm, color: colors.text.primary, fontWeight: '600' },
  citaHora: { ...Typography.styles.caption, color: colors.text.secondary },
  
  contenedorAcciones: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing[3], gap: Spacing[3] },
  botonAccion: { flex: 1, backgroundColor: colors.neutral[0], paddingVertical: Spacing[4], borderRadius: Radius.lg, borderWidth: 1, borderColor: colors.border.default, alignItems: 'center', ...Shadow.sm },
  textoBotonAccion: { ...Typography.styles.btn, color: colors.primary[600], fontWeight: '700' }
});