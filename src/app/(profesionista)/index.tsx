import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DashboardScreen() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [citasHoy, setCitasHoy] = useState(0);

  // Datos simulados para la gráfica (Más adelante los conectaremos a tus cobros reales)
  const datosGrafica = [
    { mes: 'Ene', valor: 3200 },
    { mes: 'Feb', valor: 4500 },
    { mes: 'Mar', valor: 2800 },
    { mes: 'Abr', valor: 5100 },
    { mes: 'May', valor: 6300 },
    { mes: 'Jun', valor: 4900 },
  ];

  // Calculamos matemáticamente cuál fue el mes que más ganaste para ajustar la altura de las barras
  const valorMaximo = Math.max(...datosGrafica.map(d => d.valor));

  useEffect(() => {
    cargarDatosResumen();
  }, []);

  const cargarDatosResumen = async () => {
    try {
      setCargando(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Obtener el nombre del profesionista
      const { data: perfil } = await supabase
        .from('professionals')
        .select('full_name')
        .eq('prof_id', user.id)
        .single();
        
      if (perfil) {
        // Cortamos el nombre para mostrar solo el primer nombre (Ej: "Juan Pérez" -> "Juan")
        const primerNombre = perfil.full_name.split(' ')[0];
        setNombreUsuario(primerNombre);
      }

      // 2. Contar cuántas citas pendientes hay (Estado 1 = Pendiente)
      const { count } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('prof_id', user.id)
        .eq('status', 1);

      setCitasHoy(count || 0);

    } catch (error) {
      console.log('Error al cargar dashboard:', error);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return <View style={styles.centro}><ActivityIndicator size="large" color="#5c4b8a" /></View>;
  }

  return (
    <ScrollView style={styles.contenedorFondo} contentContainerStyle={styles.scroll}>
      
      {/* SECCIÓN 1: Saludo y Bienvenida */}
      <View style={styles.seccionSaludo}>
        <Text style={styles.textoSaludo}>Bienvenido de nuevo,</Text>
        <Text style={styles.textoNombre}>{nombreUsuario || 'Profesional'}</Text>
      </View>

      {/* SECCIÓN 2: Tarjetas de Resumen Rápido */}
      <View style={styles.contenedorTarjetas}>
        <View style={styles.tarjetaPrimaria}>
          <Text style={styles.tituloTarjetaBlanco}>Ingresos del Mes</Text>
          <Text style={styles.valorTarjetaBlanco}>$4,900.00</Text>
          <Text style={styles.subtextoTarjetaBlanco}>+12% vs mes anterior</Text>
        </View>

        <View style={styles.columnaTarjetasSecundarias}>
          <TouchableOpacity 
            style={styles.tarjetaSecundaria}
            onPress={() => router.push('/(profesionista)/calendario')}
          >
            <Text style={styles.tituloTarjetaOscuro}>Solicitudes</Text>
            <Text style={styles.valorTarjetaOscuro}>{citasHoy}</Text>
            <Text style={styles.subtextoTarjetaOscuro}>Pendientes</Text>
          </TouchableOpacity>

          <View style={styles.tarjetaSecundaria}>
            <Text style={styles.tituloTarjetaOscuro}>Calificación</Text>
            <Text style={styles.valorTarjetaOscuro}>4.8 / 5</Text>
            <Text style={styles.subtextoTarjetaOscuro}>12 reseñas</Text>
          </View>
        </View>
      </View>

      {/* SECCIÓN 3: Gráfica de Rendimiento Financiero */}
      <View style={styles.contenedorGrafica}>
        <Text style={styles.tituloSeccion}>Rendimiento Financiero</Text>
        <Text style={styles.subtituloSeccion}>Historial de ingresos por mes</Text>
        
        <View style={styles.areaGrafica}>
          {datosGrafica.map((dato, index) => {
            // Regla de tres simple para calcular la altura de cada barra (Porcentaje respecto al valor más alto)
            const alturaPorcentaje = (dato.valor / valorMaximo) * 100;
            
            return (
              <View key={index} style={styles.columnaBarra}>
                <View style={styles.barraFondo}>
                  <View style={[styles.barraRelleno, { height: `${alturaPorcentaje}%` }]} />
                </View>
                <Text style={styles.textoMes}>{dato.mes}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* SECCIÓN 4: Accesos Rápidos */}
      <Text style={styles.tituloSeccion}>Accesos Rápidos</Text>
      <View style={styles.contenedorAcciones}>
        <TouchableOpacity style={styles.botonAccion} onPress={() => router.push('/(profesionista)/horarios')}>
          <Text style={styles.textoBotonAccion}>Modificar Horarios</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.botonAccion} onPress={() => router.push('/(profesionista)/servicios')}>
          <Text style={styles.textoBotonAccion}>Gestionar Servicios</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

// Estilos enfocados en limpieza, elegancia y proporciones exactas
const styles = StyleSheet.create({
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFC' },
  contenedorFondo: { flex: 1, backgroundColor: '#FAFAFC' },
  scroll: { padding: 20, paddingBottom: 50 },
  
  seccionSaludo: { marginBottom: 25 },
  textoSaludo: { fontSize: 16, color: '#8E8E93', marginBottom: 4 },
  textoNombre: { fontSize: 28, fontWeight: 'bold', color: '#1C1C1E' },
  
  contenedorTarjetas: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  
  tarjetaPrimaria: { flex: 1, backgroundColor: '#5c4b8a', borderRadius: 16, padding: 20, marginRight: 15, justifyContent: 'center', elevation: 4, shadowColor: '#5c4b8a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  tituloTarjetaBlanco: { color: '#E8E0FF', fontSize: 14, fontWeight: '600', marginBottom: 10 },
  valorTarjetaBlanco: { color: '#FFFFFF', fontSize: 26, fontWeight: 'bold', marginBottom: 8 },
  subtextoTarjetaBlanco: { color: '#D1C4E9', fontSize: 12 },
  
  columnaTarjetasSecundarias: { flex: 0.8, justifyContent: 'space-between' },
  tarjetaSecundaria: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#E5E5EA', flex: 1, marginBottom: 10, justifyContent: 'center' },
  tituloTarjetaOscuro: { color: '#8E8E93', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  valorTarjetaOscuro: { color: '#1C1C1E', fontSize: 20, fontWeight: 'bold', marginBottom: 2 },
  subtextoTarjetaOscuro: { color: '#8E8E93', fontSize: 11 },
  
  contenedorGrafica: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 30, borderWidth: 1, borderColor: '#E5E5EA', elevation: 2 },
  tituloSeccion: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 4 },
  subtituloSeccion: { fontSize: 13, color: '#8E8E93', marginBottom: 20 },
  
  areaGrafica: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 180, paddingTop: 10 },
  columnaBarra: { alignItems: 'center', flex: 1 },
  barraFondo: { width: 14, height: 140, backgroundColor: '#F2F2F7', borderRadius: 7, justifyContent: 'flex-end', overflow: 'hidden', marginBottom: 10 },
  barraRelleno: { width: '100%', backgroundColor: '#5c4b8a', borderRadius: 7 },
  textoMes: { fontSize: 12, color: '#8E8E93', fontWeight: '600' },
  
  contenedorAcciones: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  botonAccion: { flex: 1, backgroundColor: '#FFFFFF', paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: '#E5E5EA', alignItems: 'center', marginHorizontal: 5 },
  textoBotonAccion: { color: '#5c4b8a', fontWeight: '600', fontSize: 14 }
});