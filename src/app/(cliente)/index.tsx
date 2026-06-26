import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function ClienteDashboard() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const cargarFotoPerfil = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('clientes')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
        
        if (!error && data?.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
      }
    } catch (error) {
      console.log("Error cargando foto en la navbar:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarFotoPerfil();
    }, [])
  );

  const handleLogout = async () => {
    setMenuVisible(false);
    await supabase.auth.signOut();
    router.replace('/(auth)/sign-in');
  };

  const fotoNavbar = avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

  return (
    <View style={styles.container}>
      
      {/* --- NAVBAR SUPERIOR --- */}
      <View style={styles.navbar}>
        <Text style={styles.navbarTitle}>Panel de Cliente</Text>

        {/* Contenedor derecho: Foto y Hamburguesa Juntos */}
        <View style={styles.rightHeaderContainer}>
          <TouchableOpacity style={styles.profileCircle} onPress={() => router.push('/perfil')}>
            <Image source={{ uri: fotoNavbar }} style={styles.profileImage} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.hamburgerButton} onPress={() => setMenuVisible(true)}>
            <Text style={styles.hamburgerIcon}>☰</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- MENÚ DESPLEGABLE --- */}
      <Modal visible={menuVisible} transparent={true} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.dropdownMenu}>
              <TouchableOpacity style={styles.menuItem} onPress={() => setMenuVisible(false)}>
                <Text style={styles.menuText}>Información</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); router.push('/perfil'); }}>
                <Text style={styles.menuText}>Perfil</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <Text style={[styles.menuText, styles.logoutText]}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <View style={styles.content}>
        <Text style={styles.title}>¡Bienvenido!</Text>
        <Text style={styles.subtitle}>Este es tu espacio simple para buscar servicios.</Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  navbar: { 
    height: 70, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee', 
    backgroundColor: '#fff' 
  },
  // Contenedor derecho para agrupar la foto y el menú
  rightHeaderContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  navbarTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  profileCircle: { 
    width: 38, 
    height: 38, 
    borderRadius: 19, 
    overflow: 'hidden', 
    backgroundColor: '#eee', 
    marginRight: 15, // Espacio entre foto y hamburguesa
    borderWidth: 1, 
    borderColor: '#ccc' 
  },
  profileImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  hamburgerButton: { padding: 5 },
  hamburgerIcon: { fontSize: 24, color: '#000' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.01)' },
  dropdownMenu: { 
    position: 'absolute', 
    top: 65, 
    right: 20, 
    backgroundColor: '#fff', 
    borderRadius: 8, 
    paddingVertical: 6, 
    width: 150, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 5, 
    borderWidth: 1, 
    borderColor: '#eee', 
    zIndex: 999 
  },
  menuItem: { padding: 12 },
  menuText: { fontSize: 15, color: '#333' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 4 },
  logoutText: { color: 'red', fontWeight: 'bold' }
});