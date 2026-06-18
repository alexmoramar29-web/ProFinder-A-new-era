import { usePerfil } from '@/context/PerfilContext';
import { supabase } from '@/lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PerfilScreen() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const { fotoGlobal } = usePerfil();

  const cargarPerfil = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase.from('professionals').select('*').eq('prof_id', user.id).single();
        if (error) throw error;
        setPerfil(data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(useCallback(() => { cargarPerfil(); }, []));

  if (cargando) {
    return (
      <View style={styles.cargandoContainer}>
        <ActivityIndicator size="large" color="#5c4b8a" />
      </View>
    );
  }

  const fotoGrandeMostrar = fotoGlobal || perfil?.profile_picture;
  const estaVerificado = perfil?.verification_status?.toLowerCase() === 'verificado';

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        
        <View style={styles.fotoContainer}>
          {fotoGrandeMostrar ? (
            <Image source={{ uri: fotoGrandeMostrar }} style={styles.foto} />
          ) : (
            <View style={styles.fotoVacia}>
              <Text style={styles.textoFotoVacia}>Sin Foto</Text>
            </View>
          )}

          {estaVerificado && (
            <View style={styles.medallitaMorada}>
              <Image source={require('../../../../assets/images/palomita.png')} style={styles.palomitaBlanca} />
            </View>
          )}
        </View>

        <View style={styles.nombreContainer}>
          <Text style={styles.nombreTexto}>{perfil?.full_name || 'Nombre no disponible'}</Text>
        </View>

        <View style={styles.datosCard}>
          <Text style={styles.datoTitulo}>Nombre de usuario</Text>
          <Text style={styles.datoValor}>@{perfil?.username}</Text>

          <Text style={styles.datoTitulo}>Profesión</Text>
          <Text style={styles.datoValor}>{perfil?.speciality}</Text>

          <Text style={styles.datoTitulo}>Teléfono de contacto</Text>
          <Text style={styles.datoValor}>{perfil?.phone || 'Sin teléfono'}</Text>

          <Text style={styles.datoTitulo}>Descripción</Text>
          <Text style={styles.datoValor}>{perfil?.profile_description || 'Sin descripción'}</Text>
        </View>

        <View style={styles.mapaPlaceholder}>
          <Text style={styles.mapaTexto}>Mapa de ubicación</Text>
        </View>

        <View style={styles.contenedorBotones}>
          <TouchableOpacity style={styles.botonSecundario} onPress={() => router.push('/(profesionista)/perfil/editar')}>
            <Text style={styles.textoBoton}>Editar Perfil</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.botonPrimario} onPress={() => router.push('/(profesionista)/completar-registro')}>
            <Text style={styles.textoBoton}>Verificación</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cargandoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContainer: { flexGrow: 1, backgroundColor: '#f4f4f4' },
  container: { flex: 1, padding: 20, alignItems: 'center' },
  
  fotoContainer: { marginBottom: 15, position: 'relative' },
  foto: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#ddd' },
  fotoVacia: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  textoFotoVacia: { color: '#666', fontWeight: 'bold' },
  
  medallitaMorada: {
    position: 'absolute', bottom: 5, right: 5, width: 32, height: 32,
    borderRadius: 16, backgroundColor: '#5c4b8a', borderWidth: 2, borderColor: '#ffffff',
    justifyContent: 'center', alignItems: 'center', elevation: 3
  },
  palomitaBlanca: { width: 14, height: 14, tintColor: '#ffffff', resizeMode: 'contain' },

  nombreContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  nombreTexto: { fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  
  datosCard: { width: '100%', backgroundColor: '#fff', padding: 20, borderRadius: 10, elevation: 3, marginBottom: 20 },
  datoTitulo: { fontSize: 12, color: '#888', marginTop: 10, fontWeight: 'bold' },
  datoValor: { fontSize: 16, color: '#333', marginBottom: 5 },
  
  mapaPlaceholder: { width: '100%', height: 150, backgroundColor: '#e9ecef', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#ccc', borderStyle: 'dashed' },
  mapaTexto: { color: '#6c757d', fontWeight: 'bold' },
  
  contenedorBotones: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  botonPrimario: { flex: 1, backgroundColor: '#5c4b8a', padding: 15, borderRadius: 8, alignItems: 'center', marginLeft: 5 },
  botonSecundario: { flex: 1, backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center', marginRight: 5 },
  textoBoton: { color: '#fff', fontWeight: 'bold', fontSize: 15 }
});