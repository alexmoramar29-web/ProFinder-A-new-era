import { supabase } from '@/lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PerfilClienteScreen() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<any>(null);
  const [correo, setCorreo] = useState<string>('');
  const [cargando, setCargando] = useState(true);

  const cargarPerfil = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCorreo(user.email || '');
        
        // Consulta segura estructurada en arreglos para evitar caídas del componente
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', user.id);
          
        if (!error && data && data.length > 0) {
          setPerfil(data[0]);
        }
      }
    } catch (error) {
      console.log("Error cargando vista de perfil:", error);
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

  const fotoAMostrar = perfil?.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          
          <View style={styles.fotoContainer}>
            <Image source={{ uri: fotoAMostrar }} style={styles.foto} />
          </View>

          <View style={styles.nombreContainer}>
            <Text style={styles.nombreTexto}>{perfil?.full_name || 'Agrega tu nombre en Editar'}</Text>
          </View>

          <View style={styles.datosCard}>
            <Text style={styles.datoTitulo}>Nombre de usuario</Text>
            <Text style={styles.datoValor}>{perfil?.username ? `@${perfil.username}` : 'Sin usuario asignado'}</Text>

            <Text style={styles.datoTitulo}>Correo Electrónico</Text>
            <Text style={styles.datoValor}>{correo}</Text>

            <Text style={styles.datoTitulo}>Teléfono de contacto</Text>
            <Text style={styles.datoValor}>{perfil?.phone || 'Sin teléfono registrado'}</Text>
          </View>

          <View style={styles.contenedorBotones}>
            <TouchableOpacity style={styles.botonVolver} onPress={() => router.replace('/(cliente)')}>
              <Text style={styles.textoBotonVolver}>Volver al Inicio</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.botonEditar} onPress={() => router.push('/perfil/editar')}>
              <Text style={styles.textoBotonEditar}>Editar Perfil</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  cargandoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  scrollContainer: { flexGrow: 1, backgroundColor: '#f4f4f4' },
  container: { flex: 1, padding: 20, alignItems: 'center', paddingTop: 40 },
  fotoContainer: { marginBottom: 20 },
  foto: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#ddd', borderWidth: 2, borderColor: '#fff' },
  nombreContainer: { marginBottom: 25 },
  nombreTexto: { fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  datosCard: { width: '100%', backgroundColor: '#fff', padding: 20, borderRadius: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, marginBottom: 30 },
  datoTitulo: { fontSize: 12, color: '#888', marginTop: 12, fontWeight: 'bold' },
  datoValor: { fontSize: 16, color: '#333', marginBottom: 5 },
  contenedorBotones: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  botonVolver: { flex: 1, backgroundColor: '#6c757d', padding: 15, borderRadius: 8, alignItems: 'center', marginRight: 8 },
  textoBotonVolver: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  botonEditar: { flex: 1, backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center', marginLeft: 8 },
  textoBotonEditar: { color: '#fff', fontWeight: 'bold', fontSize: 15 }
});