import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function ClienteDashboard() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const cargarFotoPerfil = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('clientes').select('avatar_url').eq('id', user.id).single();
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    }
  };

  useFocusEffect(useCallback(() => { cargarFotoPerfil(); }, []));

  const fotoNavbar = avatarUrl ? `${avatarUrl}?t=${new Date().getTime()}` : 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

  // Menú simplificado
  const menuItems = [
    { title: 'Inicio', route: '/(cliente)' },
    { title: 'Chat', route: '/(cliente)/chat' },
    { title: 'Mi Perfil', route: '/(cliente)/perfil' },
    { title: 'Configuración', route: '/(cliente)/configuracion' },
    { title: 'Ayuda', route: '/(cliente)/ayuda' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.navbar}>
        <Text style={styles.navbarTitle}>Panel de Cliente</Text>
        <View style={styles.rightHeaderContainer}>
          <TouchableOpacity onPress={() => router.push('/(cliente)/perfil')}>
            <Image source={{ uri: fotoNavbar }} style={styles.profileCircle} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginLeft: 15 }}>
            <Text style={{ fontSize: 24 }}>☰</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={menuVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>
          <View style={styles.sideMenu}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {menuItems.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.menuItem, item.title === 'Configuración' && { marginTop: 30 }]} 
                  onPress={() => { setMenuVisible(false); router.push(item.route as any); }}
                >
                  <Text style={styles.menuText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
              <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 20 }} />
              <TouchableOpacity onPress={async () => { await supabase.auth.signOut(); router.replace('/(auth)/sign-in'); }} style={styles.menuItem}>
                <Text style={{ color: 'red', fontWeight: 'bold' }}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      <View style={styles.content}>
        <Text style={styles.title}>¡Bienvenido!</Text>
      </View>
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
  menuText: { fontSize: 16, color: '#333' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' }
});