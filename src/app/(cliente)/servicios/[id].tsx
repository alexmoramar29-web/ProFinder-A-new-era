import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'; // 1. Agregamos useFocusEffect
import React, { useCallback, useState } from 'react'; // 2. Importamos useCallback
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';

export default function DetalleServicio() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [servicio, setServicio] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [esFavorito, setEsFavorito] = useState(false);

  // 3. Usamos useFocusEffect para refrescar el estado cada vez que la pantalla está enfocada
  useFocusEffect(
    useCallback(() => {
      const obtenerDetalles = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
          .from('services')
          .select('*, categories(category_name)')
          .eq('service_id', id)
          .single();

        if (data) {
          setServicio(data);
          if (data.service_images) {
            const { data: urlData } = supabase.storage
              .from('services')
              .getPublicUrl(data.service_images);
            setImageUrl(urlData.publicUrl);
          }

          // Verificar si ya es favorito
          if (user) {
            const { data: fav } = await supabase
              .from('favorites')
              .select('*')
              .eq('user_id', user.id)
              .eq('service_id', id)
              .maybeSingle();
            setEsFavorito(!!fav);
          }
        }
        setCargando(false);
      };
      obtenerDetalles();
    }, [id])
  );

  const alternarFavorito = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Debes iniciar sesión");
      return;
    }

    if (esFavorito) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('service_id', id);
      setEsFavorito(false);
      alert("Eliminado de favoritos");
    } else {
      await supabase.from('favorites').insert([{ user_id: user.id, service_id: id }]);
      setEsFavorito(true);
      alert("Agregado a favoritos");
    }
  };

  if (cargando) return <ActivityIndicator style={{ flex: 1, justifyContent: 'center' }} size="large" />;
  if (!servicio) return <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><Text>No se encontró el servicio.</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Volver</Text>
      </TouchableOpacity>

      {imageUrl && (
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.image} 
          resizeMode="cover"
        />
      )}
      
      <Text style={styles.title}>{servicio.service_name}</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>Descripción</Text>
        <Text style={styles.value}>{servicio.description}</Text>
        <Text style={styles.label}>Precio Base</Text>
        <Text style={styles.value}>${servicio.base_price}</Text>
        <Text style={styles.label}>Modalidad</Text>
        <Text style={styles.value}>{servicio.modality}</Text>
        <Text style={styles.label}>Categoría</Text>
        <Text style={styles.value}>{servicio.categories?.category_name}</Text>

        <TouchableOpacity 
          style={[styles.btnFav, { backgroundColor: esFavorito ? '#999' : '#ff6b6b' }]} 
          onPress={alternarFavorito}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
            {esFavorito ? 'Quitar de Favoritos' : 'Agregar a Favoritos'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
  backButton: { marginBottom: 15, paddingVertical: 5 },
  backButtonText: { fontSize: 18, color: '#007AFF', fontWeight: '600' },
  image: { width: '100%', height: 250, borderRadius: 12, marginBottom: 20, backgroundColor: '#ddd' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, elevation: 3 },
  label: { fontSize: 14, color: '#888', marginTop: 15 },
  value: { fontSize: 18, color: '#000', marginTop: 5 },
  btnFav: { padding: 15, borderRadius: 10, marginTop: 25, alignItems: 'center' }
});