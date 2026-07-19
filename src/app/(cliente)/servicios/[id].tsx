import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'; // 1. Agregamos useFocusEffect
import React, { useCallback, useState } from 'react'; // 2. Importamos useCallback
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';
import NavbarCliente from '../../../components/NavbarCliente';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';

export default function DetalleServicio() {
  const { isDark, colors } = useTheme();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [servicio, setServicio] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

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
        }
        setCargando(false);
      };
      obtenerDetalles();
    }, [id])
  );


  if (cargando) return <ActivityIndicator style={{ flex: 1, justifyContent: 'center' }} size="large" />;
  if (!servicio) return <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><Text>{t('No se encontró el servicio.')}</Text></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#f9f9f9' }}>
      <NavbarCliente />
      <ScrollView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{t('← Volver')}</Text>
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
          <Text style={styles.label}>{t('Descripción')}</Text>
          <Text style={styles.value}>{servicio.description}</Text>
          <Text style={styles.label}>{t('Precio Base')}</Text>
          <Text style={styles.value}>${servicio.base_price}</Text>
          <Text style={styles.label}>{t('Modalidad')}</Text>
          <Text style={styles.value}>{servicio.modality}</Text>
          <Text style={styles.label}>{t('Categoría')}</Text>
          <Text style={styles.value}>{servicio.categories?.category_name}</Text>


        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
  backButton: { marginBottom: 15, paddingVertical: 5 },
  backButtonText: { fontSize: 18, color: '#007AFF', fontWeight: '600' },
  image: { width: '100%', height: 250, borderRadius: 12, marginBottom: 20, backgroundColor: '#ddd' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: colors.text.primary },
  card: { backgroundColor: colors.neutral[0], padding: 20, borderRadius: 12, elevation: 3 },
  label: { fontSize: 14, color: '#888', marginTop: 15 },
  value: { fontSize: 18, color: '#000', marginTop: 5 }
});