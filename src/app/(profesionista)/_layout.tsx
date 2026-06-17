import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItem, DrawerItemList, DrawerToggleButton } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PerfilProvider, usePerfil } from '../../context/PerfilContext';
import { supabase } from '../../lib/supabase';

function MenuPersonalizado(props: DrawerContentComponentProps) {
  const router = useRouter();

  const salirDeLaCuenta = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/sign-in');
  };

  return (
    <View style={styles.contenedorPrincipal}>
      <DrawerContentScrollView {...props}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <View style={styles.contenedorFijoAbajo}>
        <DrawerItem 
          label="Cerrar Sesión" 
          onPress={salirDeLaCuenta}
          labelStyle={styles.textoSalir}
        />
      </View>
    </View>
  );
}

function EnrutadorProfesionista() {
  const router = useRouter();
  const { fotoGlobal, setFotoGlobal } = usePerfil();

  useEffect(() => {
    const cargarFotoInicial = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('professionals')
          .select('profile_picture')
          .eq('prof_id', user.id)
          .single();
          
        if (data?.profile_picture) {
          setFotoGlobal(data.profile_picture);
        }
      }
    };
    cargarFotoInicial();
  }, []);

  const fotoMostrar = fotoGlobal || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <MenuPersonalizado {...props} />}
        screenOptions={{
          headerStyle: { backgroundColor: '#5c4b8a' },
          headerTintColor: '#fff',
          drawerActiveTintColor: '#5c4b8a',
          drawerPosition: 'right',
          headerTitle: '',
          drawerStyle: { width: 250 },
          headerLeft: () => (
            <View style={styles.contenedorIzquierdo}>
              <Text style={styles.textoLogo}>ProFinder</Text>
            </View>
          ),
          headerRight: () => (
            <View style={styles.contenedorDerecho}>
              <TouchableOpacity onPress={() => router.push('/(profesionista)/perfil')}>
                <Image 
                  source={{ uri: fotoMostrar }} 
                  style={styles.fotoPerfil} 
                />
              </TouchableOpacity>
              <DrawerToggleButton tintColor="#fff" />
            </View>
          ),
        }}
      >
        <Drawer.Screen name="index" options={{ drawerLabel: 'Inicio' }} />
        <Drawer.Screen name="perfil/index" options={{ drawerLabel: 'Mi Perfil' }} />
      </Drawer>
    </GestureHandlerRootView>
  );
}

export default function ProfesionistaLayout() {
  return (
    <PerfilProvider>
      <EnrutadorProfesionista />
    </PerfilProvider>
  );
}

const styles = StyleSheet.create({
  contenedorPrincipal: { flex: 1 },
  contenedorFijoAbajo: { borderTopWidth: 1, borderTopColor: '#ddd', paddingBottom: 25, paddingTop: 5 },
  textoSalir: { color: '#d9534f', fontWeight: 'bold' },
  contenedorIzquierdo: { marginLeft: 15 },
  textoLogo: { color: '#fff', fontSize: 20, fontWeight: 'bold', letterSpacing: 0.5 },
  contenedorDerecho: { flexDirection: 'row', alignItems: 'center', marginRight: 5 },
  fotoPerfil: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: '#ffffff', marginRight: 5, backgroundColor: '#ccc' }
});