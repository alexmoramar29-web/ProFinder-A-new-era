import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItem, DrawerItemList, DrawerToggleButton } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
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
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    const revisarSeguridadYDatos = async () => {
      // 1. EL GUARDIA: Revisamos si hay una sesión activa
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Si no hay sesión, lo pateamos al inicio de sesión y terminamos el proceso
        router.replace('/(auth)/sign-in');
        return;
      }

      // 2. EL CADENERO: Si hay sesión, revisamos sus datos de profesionista
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('professionals')
          .select('profile_picture, speciality')
          .eq('prof_id', user.id)
          .maybeSingle();
          
        if (data?.profile_picture) {
          setFotoGlobal(data.profile_picture);
        }

        if (!data || !data.speciality || data.speciality === 'Por definir') {
          router.replace('/(profesionista)/completar-registro');
        }
      }

      // 3. Si todo está en orden, quitamos la pantalla de carga invisible
      setVerificando(false);
    };

    revisarSeguridadYDatos();

    // 4. Oyente extra por si cierran sesión desde el menú estando adentro
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/(auth)/sign-in');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Pantalla en blanco mientras verifica, para no mostrar contenido prohibido
  if (verificando) {
    return null; 
  }

  const fotoMostrar = fotoGlobal || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  const logoProfinder = require('../../../assets/images/logo.png');

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
          drawerStyle: { width: 260 },
          drawerLabelStyle: { fontSize: 16, fontWeight: '500' },
          headerLeft: () => (
            <View style={styles.contenedorIzquierdo}>
              <TouchableOpacity onPress={() => router.push('/(profesionista)')}>
                <Image 
                  source={logoProfinder} 
                  style={styles.logoImagen} 
                />
              </TouchableOpacity>
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
              <View style={styles.contenedorMenuBoton}>
                <DrawerToggleButton tintColor="#fff" />
              </View>
            </View>
          ),
        }}
      >
        <Drawer.Screen name="index" options={{ drawerLabel: 'Inicio' }} />
        <Drawer.Screen name="horarios" options={{ drawerLabel: 'Mis Horarios' }} />
        <Drawer.Screen name="servicios/index" options={{ drawerLabel: 'Mis Servicios' }} />
        <Drawer.Screen name="servicios/agregar" options={{ drawerItemStyle: { display: 'none' }, headerTitle: 'Agregar Servicio' }} />
        <Drawer.Screen name="perfil/index" options={{ drawerLabel: 'Mi Perfil' }} />
        <Drawer.Screen name="perfil/editar" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="completar-registro" options={{ drawerItemStyle: { display: 'none' }, headerTitle: '' }} />
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
  textoSalir: { color: '#d9534f', fontWeight: 'bold', fontSize: 16 },
  contenedorIzquierdo: { marginLeft: 20, justifyContent: 'center' },
  logoImagen: { width: 42, height: 42, borderRadius: 21, overflow: 'hidden', resizeMode: 'cover' },
  contenedorDerecho: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  fotoPerfil: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#ffffff', marginRight: 15, backgroundColor: '#ccc', overflow: 'hidden' },
  contenedorMenuBoton: { transform: [{ scale: 1.1 }], justifyContent: 'center', alignItems: 'center' }
});