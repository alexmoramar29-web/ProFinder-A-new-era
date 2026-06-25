import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItem, DrawerItemList, DrawerToggleButton } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PerfilProvider, usePerfil } from '../../context/PerfilContext';
import { supabase } from '../../lib/supabase';

// 1. Aquí armamos la caja de tu menú lateral
function MenuPersonalizado(props: DrawerContentComponentProps) {
  const router = useRouter();

  const salirDeLaCuenta = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/sign-in');
  };

  return (
    <View style={styles.contenedorPrincipal}>
      {/* Esta parte muestra las pantallas de trabajo arriba */}
      <DrawerContentScrollView {...props}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Esta parte deja fijos los botones de configuración y salida abajo */}
      <View style={styles.contenedorFijoAbajo}>
        <DrawerItem 
          label="Configuración" 
          onPress={() => router.push('/(profesionista)/configuracion' as any)}
          labelStyle={styles.textoMenuAbajo}
        />
        <DrawerItem 
          label="Ayuda" 
          onPress={() => router.push('/(profesionista)/ayuda' as any)}
          labelStyle={styles.textoMenuAbajo}
        />
        <DrawerItem 
          label="Cerrar Sesión" 
          onPress={salirDeLaCuenta}
          labelStyle={styles.textoSalir}
        />
      </View>
    </View>
  );
}

// 2. Aquí controlamos quién puede entrar y cómo se ven las pantallas
function EnrutadorProfesionista() {
  const router = useRouter();
  const { fotoGlobal, setFotoGlobal } = usePerfil();
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    const revisarSeguridadYDatos = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.replace('/(auth)/sign-in');
        return;
      }

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

      setVerificando(false);
    };

    revisarSeguridadYDatos();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/(auth)/sign-in');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
          headerTitleAlign: 'center',
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
        {/* PANTALLAS VISIBLES EN EL MENÚ DE ARRIBA */}
        <Drawer.Screen name="index" options={{ drawerLabel: 'Inicio', headerTitle: 'Inicio' }} />
        <Drawer.Screen name="calendario/index" options={{ drawerLabel: 'Citas', headerTitle: 'Mis Citas' }}/>
        <Drawer.Screen name="horarios/index" options={{ drawerLabel: 'Mis Horarios', headerTitle: 'Mis Horarios' }}/>
        <Drawer.Screen name="servicios/index" options={{ drawerLabel: 'Mis Servicios', headerTitle: 'Mis Servicios' }} />
        <Drawer.Screen name="chat/index" options={{ drawerLabel: 'Chat', headerTitle: 'Mis Mensajes' }} />
        <Drawer.Screen name="perfil/index" options={{ drawerLabel: 'Mi Perfil', headerTitle: 'Mi Perfil' }} />
        <Drawer.Screen name="reseñas/index" options={{ drawerLabel: 'Reseñas', headerTitle: 'Mis Reseñas' }} />
        
        
        <Drawer.Screen name="servicios/agregar" options={{ drawerItemStyle: { display: 'none' }, headerTitle: 'Agregar Servicio' }} />
        <Drawer.Screen name="servicios/editar" options={{ drawerItemStyle: { display: 'none' }, headerTitle: 'Editar Servicio' }} />
        <Drawer.Screen name="perfil/editar" options={{ drawerItemStyle: { display: 'none' }, headerTitle: 'Editar Perfil' }} />
        <Drawer.Screen name="completar-registro" options={{ drawerItemStyle: { display: 'none' }, headerTitle: 'Verificación Profesional' }} />
        <Drawer.Screen name="chat/[id]" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="configuracion/index" options={{ drawerItemStyle: { display: 'none' }, headerTitle: 'Configuración' }} />
        <Drawer.Screen name="ayuda/index" options={{ drawerItemStyle: { display: 'none' }, headerTitle: 'Centro de Ayuda' }} />
      </Drawer>
    </GestureHandlerRootView>
  );
}

// 3. Exportamos todo envuelto en tu proveedor de perfil
export default function ProfesionistaLayout() {
  return (
    <PerfilProvider>
      <EnrutadorProfesionista />
    </PerfilProvider>
  );
}

// 4. Estilos visuales
const styles = StyleSheet.create({
  contenedorPrincipal: { flex: 1 },
  contenedorFijoAbajo: { borderTopWidth: 1, borderTopColor: '#E5E5EA', paddingBottom: 25, paddingTop: 5, backgroundColor: '#FAFAFC' },
  textoMenuAbajo: { color: '#1C1C1E', fontWeight: '500', fontSize: 16 },
  textoSalir: { color: '#FF3B30', fontWeight: 'bold', fontSize: 16 },
  contenedorIzquierdo: { marginLeft: 20, justifyContent: 'center' },
  logoImagen: { width: 42, height: 42, borderRadius: 21, overflow: 'hidden', resizeMode: 'cover' },
  contenedorDerecho: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  fotoPerfil: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#ffffff', marginRight: 15, backgroundColor: '#ccc', overflow: 'hidden' },
  contenedorMenuBoton: { transform: [{ scale: 1.1 }], justifyContent: 'center', alignItems: 'center' }
});