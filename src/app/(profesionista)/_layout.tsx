import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItem, DrawerItemList, DrawerToggleButton } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React, { useEffect } from 'react';
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

useEffect(() => {
    const revisarAduanaYFoto = async () => {
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

        // EL CADENERO INVISIBLE: Si no tiene profesión anotada, o dice 'Por definir', o de plano no existe, ¡A LA ADUANA!
        if (!data || !data.speciality || data.speciality === 'Por definir') {
          router.replace('/(profesionista)/completar-registro');
        }
      }
    };
    revisarAduanaYFoto();
  }, []);
    

  const fotoMostrar = fotoGlobal || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  const logoProfinder = require('../../../assets/images/logo.png');

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <MenuPersonalizado {...props} />}
        screenOptions={{
          // Eliminamos el 'height' fijo para que el celular respete su barra de estado
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
  
  // Agregamos más margen a la izquierda
  contenedorIzquierdo: { marginLeft: 20, justifyContent: 'center' },
  
  // Tamaño más limpio y equilibrado (42x42)
  logoImagen: { width: 42, height: 42, borderRadius: 21, overflow: 'hidden', resizeMode: 'cover' },
  
  // Separamos todo de la orilla derecha
  contenedorDerecho: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  
  // Reducimos el tamaño de la foto (40x40) y la separamos del menú (marginRight: 15)
  fotoPerfil: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#ffffff', marginRight: 15, backgroundColor: '#ccc', overflow: 'hidden' },
  
  // Escalamos el menú de hamburguesa de forma más sutil
  contenedorMenuBoton: { transform: [{ scale: 1.1 }], justifyContent: 'center', alignItems: 'center' }
});