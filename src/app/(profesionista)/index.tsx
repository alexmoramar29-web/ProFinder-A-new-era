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

export default function DashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [cargando, setCargando] = useState(true);
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [citasHoy, setCitasHoy] = useState(0);
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
    return <View style={styles.centro}><ActivityIndicator size="large" color={Colors.primary[600]} /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.neutral[50] }}>
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
          <Text style={styles.tituloTarjetaBlanco}>{t('citasCompletadasMes')}</Text>
          <Text style={styles.valorTarjetaBlanco}>25</Text>
          <Text style={styles.subtextoTarjetaBlanco}>{t('vsMesAnteriorCitas')}</Text>
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
            <Text style={styles.tituloTarjetaOscuro}>{t('calificacion')}</Text>
            <Text style={styles.valorTarjetaOscuro}>4.8 / 5</Text>
            <Text style={styles.subtextoTarjetaOscuro}>{t('doceResenas')}</Text>
          </View>
        </View>
      </View>

      {/* SECCIÓN 3: Próximas Citas */}
      <View style={styles.contenedorGrafica}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={[styles.tituloSeccion, { marginBottom: 0 }]}>{t('proximasCitas') || 'Próximas Citas'}</Text>
          <TouchableOpacity onPress={() => router.push('/(profesionista)/calendario')}>
             <Text style={{ ...Typography.styles.bodySm, color: Colors.primary[600], fontWeight: '600' }}>{t('verTodas') || 'Ver todas'}</Text>
          </TouchableOpacity>
        </View>
        
        {proximasCitas.length === 0 ? (
           <View style={{ padding: 24, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.border.default }}>
             <Ionicons name="calendar-outline" size={32} color={Colors.text.disabled} style={{ marginBottom: 8 }} />
             <Text style={{ color: Colors.text.disabled }}>No tienes citas próximas o pendientes.</Text>
           </View>
        ) : (
           proximasCitas.map((cita) => (
             <TouchableOpacity key={cita.appointment_id} style={styles.citaCard} onPress={() => router.push('/(profesionista)/calendario')}>
               <View style={styles.citaCirculo}>
                 <Ionicons name={cita.status === 0 ? "time-outline" : "checkmark-circle-outline"} size={22} color={cita.status === 0 ? Colors.warning.main : Colors.success.main} />
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

const styles = StyleSheet.create({
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  contenedorFondo: { flex: 1, backgroundColor: '#F8F9FA' },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[10] },
  
  seccionSaludo: { marginBottom: Spacing[6] },
  textoSaludo: { ...Typography.styles.body, color: Colors.text.secondary, marginBottom: 4 },
  textoNombre: { ...Typography.styles.h2, color: Colors.text.primary, fontWeight: '800' },
  
  contenedorTarjetas: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing[4], marginBottom: Spacing[6] },
  
  tarjetaPrimaria: { flex: 1, backgroundColor: Colors.primary[600], borderRadius: Radius.xl, padding: Spacing[5], justifyContent: 'center', ...Shadow.brand },
  tituloTarjetaBlanco: { ...Typography.styles.label, color: Colors.primary[100], fontWeight: '600', marginBottom: Spacing[2] },
  valorTarjetaBlanco: { ...Typography.styles.h1, color: '#FFFFFF', fontWeight: '800', marginBottom: 4 },
  subtextoTarjetaBlanco: { ...Typography.styles.caption, color: Colors.primary[200] },
  
  columnaTarjetasSecundarias: { flex: 0.8, justifyContent: 'space-between', gap: Spacing[3] },
  tarjetaSecundaria: { backgroundColor: '#FFFFFF', borderRadius: Radius.lg, padding: Spacing[4], borderWidth: 1, borderColor: Colors.border.default, flex: 1, justifyContent: 'center', ...Shadow.sm },
  tituloTarjetaOscuro: { ...Typography.styles.label, color: Colors.text.secondary, fontWeight: '600', marginBottom: 2 },
  valorTarjetaOscuro: { ...Typography.styles.h3, color: Colors.text.primary, fontWeight: '800', marginBottom: 2 },
  subtextoTarjetaOscuro: { ...Typography.styles.caption, color: Colors.text.disabled },
  
  contenedorGrafica: { backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: Spacing[5], marginBottom: Spacing[6], borderWidth: 1, borderColor: Colors.border.default, ...Shadow.md },
  tituloSeccion: { ...Typography.styles.h4, fontWeight: '700', color: Colors.text.primary, marginBottom: 4 },
  subtituloSeccion: { ...Typography.styles.bodySm, color: Colors.text.secondary, marginBottom: Spacing[5] },
  
  citaCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border.default, ...Shadow.sm },
  citaCirculo: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.neutral[100], alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  citaInfo: { flex: 1 },
  citaCliente: { ...Typography.styles.body, fontWeight: '700', color: Colors.text.primary, marginBottom: 2 },
  citaServicio: { ...Typography.styles.caption, color: Colors.text.secondary },
  citaFechaWrap: { alignItems: 'flex-end' },
  citaFecha: { ...Typography.styles.bodySm, color: Colors.text.primary, fontWeight: '600' },
  citaHora: { ...Typography.styles.caption, color: Colors.text.secondary },
  
  contenedorAcciones: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing[3], gap: Spacing[3] },
  botonAccion: { flex: 1, backgroundColor: '#FFFFFF', paddingVertical: Spacing[4], borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border.default, alignItems: 'center', ...Shadow.sm },
  textoBotonAccion: { ...Typography.styles.btn, color: Colors.primary[600], fontWeight: '700' }
});