import { supabase } from '@/lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/theme/Colors';
import { Typography } from '@/theme/Typography';
import { Radius, Shadow, Spacing } from '@/theme/Spacing';
import NavbarProfesionista from '@/components/NavbarProfesionista';

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
    return <View style={styles.centro}><ActivityIndicator size="large" color={Colors.primary[600]} /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.neutral[50] }}>
      <NavbarProfesionista />
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

      <View style={styles.contenedorFijoAbajoDosBotones}>
        <TouchableOpacity style={styles.botonPrimarioMitad} onPress={() => router.push('/(profesionista)/servicios/agregar')}>
          <Text style={styles.textoBotonPrimarioMitad}>{t('crearNuevoServicio')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botonSecundarioMitad} onPress={() => router.push('/(profesionista)/servicios/ubicacion' as any)}>
          <Text style={styles.textoBotonSecundarioMitad}>{t('ubicacionLocal', '📍 Ubicación')}</Text>
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
  cajaVacia: { backgroundColor: '#fff', padding: Spacing[8], borderRadius: Radius.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.border.default },
  textoVacio: { ...Typography.styles.body, color: Colors.text.disabled, fontStyle: 'italic' },
  
  tarjeta: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: Spacing[4], 
    borderRadius: Radius.lg, 
    marginBottom: Spacing[4], 
    ...Shadow.md, 
    borderWidth: 1, 
    borderColor: Colors.border.default,
    alignItems: 'center' 
  },
  tarjetaPausada: { opacity: 0.65, backgroundColor: Colors.neutral[100] },
  
  imagenServicio: { width: 85, height: 85, borderRadius: Radius.md, marginRight: Spacing[4], backgroundColor: Colors.neutral[200] },
  infoTarjeta: { flex: 1 },
  encabezadoTarjeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, paddingRight: 5 },
  nombreServicio: { ...Typography.styles.h5, color: Colors.primary[700], flex: 1, marginRight: 5, fontWeight: '700' }, 
  textoGris: { color: Colors.text.secondary },
  
  etiquetasContainer: { flexDirection: 'row', alignItems: 'center' },
  etiquetaModalidad: { backgroundColor: Colors.primary[100], paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full, marginLeft: 5 },
  textoModalidad: { fontSize: 10, fontWeight: 'bold', color: Colors.primary[700] },
  
  etiquetaPausado: { backgroundColor: Colors.error.light, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  textoPausado: { fontSize: 10, fontWeight: 'bold', color: Colors.error.main },

  descripcionServicio: { ...Typography.styles.caption, color: Colors.text.secondary, marginBottom: Spacing[2] },
  filaDatos: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[3] },
  precioTexto: { ...Typography.styles.h5, color: Colors.success.main, marginRight: Spacing[4], fontWeight: '800' },
  tiempoTexto: { ...Typography.styles.caption, color: Colors.text.disabled },
  
  filaBotones: { flexDirection: 'row', justifyContent: 'flex-start' },
  botonEditar: { backgroundColor: Colors.neutral[100], paddingHorizontal: 15, paddingVertical: 8, borderRadius: Radius.md, marginRight: 10 },
  textoEditar: { color: Colors.text.primary, fontWeight: 'bold', fontSize: 12 },
  botonBorrar: { backgroundColor: 'transparent', paddingHorizontal: 15, paddingVertical: 8, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.error.main },
  textoBorrar: { color: Colors.error.main, fontWeight: 'bold', fontSize: 12 },
  
  contenedorFijoAbajo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing[5], backgroundColor: Colors.neutral[50], borderTopWidth: 1, borderTopColor: Colors.border.default },
  botonPrimario: { backgroundColor: Colors.primary[600], padding: Spacing[4], borderRadius: Radius.md, alignItems: 'center', ...Shadow.brand },
  textoBotonPrimario: { ...Typography.styles.btn, color: '#fff', fontWeight: '700' },
  
  contenedorFijoAbajoDosBotones: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing[5], backgroundColor: Colors.neutral[50], borderTopWidth: 1, borderTopColor: Colors.border.default, flexDirection: 'row', justifyContent: 'space-between', gap: Spacing[3] },
  botonPrimarioMitad: { backgroundColor: Colors.primary[600], padding: Spacing[4], borderRadius: Radius.md, alignItems: 'center', flex: 1, ...Shadow.brand },
  textoBotonPrimarioMitad: { ...Typography.styles.btn, color: '#fff', fontWeight: '700', textAlign: 'center' },
  botonSecundarioMitad: { backgroundColor: Colors.primary[100], padding: Spacing[4], borderRadius: Radius.md, alignItems: 'center', flex: 1, borderWidth: 1, borderColor: Colors.primary[300] },
  textoBotonSecundarioMitad: { ...Typography.styles.btn, color: Colors.primary[700], fontWeight: '700', textAlign: 'center' }
});