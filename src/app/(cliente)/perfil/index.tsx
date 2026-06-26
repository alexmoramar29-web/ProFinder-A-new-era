import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { supabase } from '../../../lib/supabase';

export default function PerfilScreen() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [zoomVisible, setZoomVisible] = useState(false); // Estado para el zoom
  const [cargando, setCargando] = useState(true);
  const [datos, setDatos] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('clientes').select('*').eq('id', user.id).single();
      setDatos(data);
      setAvatarUrl(data?.avatar_url);
    }
    setCargando(false);
  };

  useFocusEffect(useCallback(() => { cargarDatos(); }, []));

  const fotoPerfil = avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

  const menuItems = [
    { title: 'Inicio', route: '/(cliente)' },
    { title: 'Chat', route: '/(cliente)/chat' },
    { title: 'Mi Perfil', route: '/(cliente)/perfil' },
    { title: 'Configuración', route: '/(cliente)/configuracion' },
    { title: 'Ayuda', route: '/(cliente)/ayuda' },
  ];

  return (
    <View style={styles.container}>
      {/* NAVBAR */}
      <View style={styles.navbar}>
        <Text style={styles.navbarTitle}>Mi Perfil</Text>
        <View style={styles.rightHeaderContainer}>
          <TouchableOpacity onPress={() => router.push('/(cliente)/perfil')}>
            <Image source={{ uri: fotoPerfil }} style={styles.profileCircle} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginLeft: 15 }}>
            <Text style={{ fontSize: 24 }}>☰</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MODAL MENÚ */}
      <Modal visible={menuVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}><View style={styles.overlay} /></TouchableWithoutFeedback>
          <View style={styles.sideMenu}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {menuItems.map((item, index) => (
                <TouchableOpacity key={index} style={[styles.menuItem, item.title === 'Configuración' && { marginTop: 30 }]} onPress={() => { setMenuVisible(false); router.push(item.route as any); }}>
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

 {/* ZOOM IMAGEN */}
{/* Cambiamos animationType a 'fade' para evitar el error de TypeScript */}
<Modal visible={zoomVisible} transparent={true} animationType="fade">
  <TouchableWithoutFeedback onPress={() => setZoomVisible(false)}>
    <View style={styles.zoomBackground}>
      {/* Puedes agregar un transform: [{scale: 1}] si quieres animar la entrada */}
      <Image source={{ uri: fotoPerfil }} style={styles.fotoZoom} />
    </View>
  </TouchableWithoutFeedback>
</Modal>

      {/* CONTENIDO */}
      {cargando ? (
        <ActivityIndicator size="large" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity onPress={() => setZoomVisible(true)}>
            <Image source={{ uri: fotoPerfil }} style={styles.fotoGrande} />
          </TouchableOpacity>
          <Text style={styles.label}>Nombre: {datos?.full_name}</Text>
          <Text style={styles.label}>Usuario: {datos?.username}</Text>
          <Text style={styles.label}>Teléfono: {datos?.phone}</Text>
          
          <TouchableOpacity style={styles.botonEditar} onPress={() => router.push('/(cliente)/perfil/editar')}>
            <Text style={{ color: '#fff' }}>Editar Perfil</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
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
  content: { padding: 20, alignItems: 'center' },
  fotoGrande: { width: 150, height: 150, borderRadius: 75, marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 10 },
  botonEditar: { backgroundColor: '#5c4b8a', padding: 15, borderRadius: 8, marginTop: 20, width: '100%', alignItems: 'center' },
  zoomBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  fotoZoom: { width: 300, height: 300, borderRadius: 150 }
});