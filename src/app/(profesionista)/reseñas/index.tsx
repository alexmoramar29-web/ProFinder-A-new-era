import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { Colors } from '../../../theme/Colors';
import { Typography } from '../../../theme/Typography';
import { Radius, Shadow, Spacing } from '../../../theme/Spacing';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

export default function ReseñasProfesionistaScreen() {
  const [reseñas, setReseñas] = useState<any[]>([]);
  const [promedio, setPromedio] = useState<number>(0);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      cargarReseñas();
    }, [])
  );

  const cargarReseñas = async () => {
    try {
      setCargando(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Obtener todos los servicios del profesionista a través de sus citas
      const { data: citas, error: errCitas } = await supabase
        .from('appointments')
        .select('service_id, services(service_name)')
        .eq('prof_id', user.id);

      if (errCitas) throw new Error('Error al obtener citas: ' + errCitas.message);
      
      if (!citas || citas.length === 0) {
        Alert.alert('Debug', 'No se encontraron citas para este profesionista (length 0)');
        setCargando(false);
        return;
      }

      // Extraer service_ids únicos y sus nombres
      const uniqueServices = new Map<number, string>();
      citas.forEach(cita => {
        if (cita.service_id) {
          uniqueServices.set(cita.service_id, cita.services?.service_name || 'Servicio');
        }
      });
      const serviceIds = Array.from(uniqueServices.keys());

      if (serviceIds.length === 0) {
        Alert.alert('Debug', 'Se encontraron citas pero no se pudieron extraer los service_id');
        setCargando(false);
        return;
      }

      // 2. Obtener todas las reseñas de esos servicios
      const { data: revs, error: errRevs } = await supabase
        .from('reviews')
        .select('*, clientes:user_id(full_name)')
        .in('service_id', serviceIds)
        .order('date_posted', { ascending: false });

      if (errRevs) throw new Error('Error al obtener reseñas: ' + errRevs.message);
      
      // Mapear el nombre del servicio a la reseña
      const reseñasConServicio = (revs || []).map(r => {
        const serviceName = uniqueServices.get(r.service_id) || 'Servicio';
        return { ...r, service_name: serviceName };
      });

      setReseñas(reseñasConServicio);

      if (reseñasConServicio.length > 0) {
        const suma = reseñasConServicio.reduce((acc, curr) => acc + curr.rating, 0);
        setPromedio(Number((suma / reseñasConServicio.length).toFixed(1)));
      } else {
        setPromedio(0);
      }
    } catch (error: any) {
      Alert.alert('Error Debug', error.message);
      console.log('Error cargando reseñas:', error.message);
    } finally {
      setCargando(false);
    }
  };

  const renderEstrellas = (rating: number) => {
    const estrellas = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        estrellas.push(<Ionicons key={i} name="star" size={16} color="#eab308" />);
      } else if (i - 0.5 <= rating) {
        estrellas.push(<Ionicons key={i} name="star-half" size={16} color="#eab308" />);
      } else {
        estrellas.push(<Ionicons key={i} name="star-outline" size={16} color={Colors.text.disabled} />);
      }
    }
    return estrellas;
  };

  return (
    <View style={styles.root}>
      
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>
          <Text style={styles.title}>Mis Reseñas</Text>
          <Text style={styles.subtitle}>Descubre lo que tus clientes opinan de tus servicios.</Text>

          {cargando ? (
            <ActivityIndicator size="large" color={Colors.primary[600]} style={{ marginTop: 40 }} />
          ) : (
            <>
              {/* Caja de Promedio Global */}
              <View style={styles.promedioBox}>
                <View style={styles.promedioHeader}>
                  <Text style={styles.promedioNumero}>{promedio.toFixed(1)}</Text>
                  <View style={styles.promedioEstrellasGdes}>
                    {renderEstrellas(promedio).map((estrella, idx) => (
                      <React.Fragment key={idx}>{React.cloneElement(estrella, { size: 28 })}</React.Fragment>
                    ))}
                  </View>
                </View>
                <Text style={styles.promedioTxt}>
                  Basado en {reseñas.length} {reseñas.length === 1 ? 'reseña' : 'reseñas'}
                </Text>
              </View>

              {/* Lista de Reseñas */}
              {reseñas.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="chatbubble-ellipses-outline" size={48} color={Colors.text.disabled} />
                  <Text style={styles.emptyTxt}>Aún no tienes reseñas. ¡Sigue ofreciendo un gran servicio!</Text>
                </View>
              ) : (
                <View style={styles.lista}>
                  {reseñas.map(r => {
                    const dateStr = r.date_posted.endsWith('Z') ? r.date_posted : r.date_posted + 'Z';
                    const fechaFormat = new Date(dateStr).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
                    return (
                      <View key={r.review_id} style={styles.tarjeta}>
                        <View style={styles.tarjetaHeader}>
                          <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarLetra}>
                              {r.clientes?.full_name ? r.clientes.full_name.charAt(0).toUpperCase() : 'C'}
                            </Text>
                          </View>
                          <View style={styles.headerText}>
                            <Text style={styles.clienteNombre}>{r.clientes?.full_name || 'Cliente Anónimo'}</Text>
                            <Text style={styles.fecha}>{fechaFormat}</Text>
                          </View>
                          <View style={styles.estrellasRow}>
                            {renderEstrellas(r.rating)}
                          </View>
                        </View>
                        
                        <View style={styles.servicioBadge}>
                          <Text style={styles.servicioTxt}>Servicio: {r.service_name}</Text>
                        </View>

                        {r.comment ? (
                          <Text style={styles.comentario}>{r.comment}</Text>
                        ) : (
                          <Text style={styles.comentarioVacio}>Sin comentarios.</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.neutral[50] },
  scroll: { padding: Spacing[4] },
  container: { maxWidth: 800, width: '100%', alignSelf: 'center', padding: Spacing[4] },
  
  title: { ...Typography.styles.h2, color: Colors.primary[800], marginBottom: 2 },
  subtitle: { ...Typography.styles.body, color: Colors.text.secondary, marginBottom: Spacing[6] },

  promedioBox: { backgroundColor: Colors.primary[800], borderRadius: Radius.card, padding: Spacing[6], alignItems: 'center', marginBottom: Spacing[8], ...Shadow.lg },
  promedioHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 8 },
  promedioNumero: { fontSize: 48, fontWeight: 'bold', color: '#fff' },
  promedioEstrellasGdes: { flexDirection: 'row', gap: 4 },
  promedioTxt: { ...Typography.styles.body, color: Colors.primary[200], fontWeight: '500' },

  emptyBox: { alignItems: 'center', marginTop: 40, gap: 10 },
  emptyTxt: { ...Typography.styles.body, color: Colors.text.disabled },

  lista: { gap: Spacing[4] },
  tarjeta: { backgroundColor: '#fff', borderRadius: Radius.card, padding: Spacing[5], ...Shadow.md, borderWidth: 1, borderColor: Colors.border.default },
  
  tarjetaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[3] },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary[100], justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarLetra: { fontSize: 18, fontWeight: 'bold', color: Colors.primary[700] },
  
  headerText: { flex: 1 },
  clienteNombre: { ...Typography.styles.h5, color: Colors.text.primary, marginBottom: 2 },
  fecha: { ...Typography.styles.caption, color: Colors.text.secondary },
  
  estrellasRow: { flexDirection: 'row', gap: 2 },

  servicioBadge: { backgroundColor: Colors.neutral[100], alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: Spacing[3] },
  servicioTxt: { fontSize: 12, fontWeight: 'bold', color: Colors.text.secondary },

  comentario: { ...Typography.styles.body, color: Colors.text.primary, lineHeight: 24, fontStyle: 'italic' },
  comentarioVacio: { ...Typography.styles.body, color: Colors.text.disabled, fontStyle: 'italic' }
});