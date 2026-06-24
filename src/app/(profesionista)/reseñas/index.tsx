import { supabase } from '@/lib/supabase';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

// 1. La "receta" de nuestra reseña ahora usa date_posted como tu tabla
interface Reseña {
  review_id: number | string;
  rating: number;
  comment: string;
  date_posted: string; // <--- Cambiado para hacer match con tu columna
  client_name?: string; 
}

export default function ResenasScreen() {
  const [reseñas, setReseñas] = useState<Reseña[]>([]);
  const [promedio, setPromedio] = useState<number>(0);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerReseñas();
  }, []);

 const obtenerReseñas = async () => {
    try {
      setCargando(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Aquí está la magia del cruce de datos: 
      // Pedimos las reseñas y las filtramos a través de la tabla de servicios
      const { data, error } = await supabase
        .from('reviews')
        .select('*, services!inner(prof_id)')
        .eq('services.prof_id', user.id)
        .order('date_posted', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        calcularPromedio(data);
        setReseñas(data);
      } else {
        const reseñasDePrueba = [
          {
            review_id: 'test-1',
            rating: 5,
            comment: 'Excelente servicio, muy puntual y profesional. Totalmente recomendado para futuros trabajos.',
            date_posted: new Date().toISOString(),
            client_name: 'Cliente de Prueba A'
          },
          {
            review_id: 'test-2',
            rating: 4,
            comment: 'Hizo un buen trabajo. El detalle quedó muy limpio, aunque tardó un poco más de lo esperado.',
            date_posted: new Date(Date.now() - 86400000).toISOString(),
            client_name: 'Cliente de Prueba B'
          }
        ];
        calcularPromedio(reseñasDePrueba);
        setReseñas(reseñasDePrueba);
      }

    } catch (error: any) {
      console.log('Error al cargar reseñas:', error.message);
    } finally {
      setCargando(false);
    }
  };

  const calcularPromedio = (listaReseñas: Reseña[]) => {
    if (listaReseñas.length === 0) {
      setPromedio(0);
      return;
    }
    const suma = listaReseñas.reduce((acc, curr) => acc + curr.rating, 0);
    const resultado = suma / listaReseñas.length;
    setPromedio(Number(resultado.toFixed(1)));
  };

  // 3. Esta función toma la fecha de date_posted y la hace legible
  const formatearFecha = (fechaIso: string) => {
    const fecha = new Date(fechaIso);
    return fecha.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (cargando) {
    return <View style={styles.centro}><ActivityIndicator size="large" color="#5c4b8a" /></View>;
  }

  return (
    <ScrollView style={styles.contenedorFondo} contentContainerStyle={styles.scroll}>
      
      <View style={styles.tarjetaResumen}>
        <Text style={styles.textoResumenTitulo}>Calificación General</Text>
        <Text style={styles.textoPromedioGrande}>{promedio}</Text>
        <Text style={styles.textoTotalReseñas}>Basado en {reseñas.length} evaluaciones</Text>
      </View>

      <Text style={styles.tituloSeccion}>Comentarios de Clientes</Text>

      {reseñas.map((reseña) => (
        <View key={reseña.review_id} style={styles.tarjetaComentario}>
          <View style={styles.cabeceraComentario}>
            <Text style={styles.nombreCliente}>{reseña.client_name || 'Cliente Verificado'}</Text>
            <View style={styles.contenedorCalificacion}>
              <Text style={styles.textoCalificacionPuntaje}>{reseña.rating} / 5</Text>
            </View>
          </View>
          
          {/* Aquí le pasamos el date_posted ordenado */}
          <Text style={styles.textoFecha}>{formatearFecha(reseña.date_posted)}</Text>
          <Text style={styles.textoComentario}>{reseña.comment}</Text>
        </View>
      ))}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFC' },
  contenedorFondo: { flex: 1, backgroundColor: '#FAFAFC' },
  scroll: { padding: 20, paddingBottom: 50 },
  tarjetaResumen: { backgroundColor: '#5c4b8a', borderRadius: 16, padding: 30, alignItems: 'center', marginBottom: 30, elevation: 4, shadowColor: '#5c4b8a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  textoResumenTitulo: { color: '#E8E0FF', fontSize: 16, fontWeight: '600', marginBottom: 10 },
  textoPromedioGrande: { color: '#FFFFFF', fontSize: 64, fontWeight: 'bold', marginBottom: 5 },
  textoTotalReseñas: { color: '#D1C4E9', fontSize: 14 },
  tituloSeccion: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 15 },
  tarjetaComentario: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: '#E5E5EA', elevation: 1 },
  cabeceraComentario: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  nombreCliente: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E' },
  contenedorCalificacion: { backgroundColor: '#F2F2F7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  textoCalificacionPuntaje: { color: '#5c4b8a', fontWeight: 'bold', fontSize: 14 },
  textoFecha: { fontSize: 12, color: '#8E8E93', marginBottom: 12 },
  textoComentario: { fontSize: 15, color: '#3A3A3C', lineHeight: 22 },
});