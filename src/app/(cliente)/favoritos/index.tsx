import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { supabase } from '../../../lib/supabase';
import NavbarCliente from '../../../components/NavbarCliente';

export default function FavoritosDashboard() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [serviciosFav, setServiciosFav] = useState<any[]>([]);

  const cargarDatosPerfil = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('users').select('profile_picture').eq('user_id', user.id).maybeSingle();
      if (data?.profile_picture) setAvatarUrl(data.profile_picture);
    }
  };

  const cargarFavoritos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('favorites')
      .select('services(*, categories(category_name))')
      .eq('user_id', user.id);

    if (data) setServiciosFav(data.map(item => item.services));
  };

  useFocusEffect(useCallback(() => {
    cargarDatosPerfil();
    cargarFavoritos();
  }, []));

  return (
    <View style={styles.container}>
      <NavbarCliente />

      <FlatList 
        data={serviciosFav}
        keyExtractor={(item) => item.service_id.toString()}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={{ padding: 15, borderBottomWidth: 1, borderColor: '#eee', width: '100%' }}
            onPress={() => router.push(`/(cliente)/servicios/${item.service_id}` as any)}
          >
            <Text style={{ fontWeight: 'bold' }}>{item.service_name}</Text>
            <Text style={{ fontSize: 12, color: '#888' }}>{item.categories?.category_name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  navbar: { height: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, borderColor: '#eee' },
  navbarTitle: { fontSize: 18, fontWeight: 'bold' },
  rightHeaderContainer: { flexDirection: 'row', alignItems: 'center' },
  profileCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#eee', borderWidth: 1, borderColor: '#ccc' },
  modalContainer: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
  sideMenu: { width: 220, backgroundColor: '#fff', padding: 20, paddingTop: 60, elevation: 10 },
  menuItem: { paddingVertical: 10 },
  menuText: { fontSize: 16, color: '#333' }
});