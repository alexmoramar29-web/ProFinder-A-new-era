import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItem, DrawerItemList, DrawerToggleButton } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PerfilProvider, usePerfil } from '../../context/PerfilContext';
import { supabase } from '../../lib/supabase';

// 1. Aquí armamos la caja de tu menú lateral
function MenuPersonalizado(props: DrawerContentComponentProps) {
  const router = useRouter();
  const { t } = useTranslation();

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
          label={t('configuracionMenu')}
          onPress={() => router.push('/(profesionista)/configuracion' as any)}
          labelStyle={styles.textoMenuAbajo}
        />
        <DrawerItem
          label={t('ayudaMenu')}
          onPress={() => router.push('/(profesionista)/ayuda' as any)}
          labelStyle={styles.textoMenuAbajo}
        />
        <DrawerItem
          label={t('cerrarSesion')}
          onPress={salirDeLaCuenta}
          labelStyle={styles.textoSalir}
        />
      </View>
    </View>
  );
}

function EnrutadorProfesionista() {
  const router = useRouter();
  const { t } = useTranslation();
  const { setFotoGlobal, fotoGlobal } = usePerfil();
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
          
        if (!data) {
          router.replace('/(cliente)');
          return;
        }
        
        if (data?.profile_picture) {
          setFotoGlobal(data.profile_picture);
        }

        if (!data.speciality || data.speciality === 'Por definir') {
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

  const fotoMostrar = fotoGlobal || 'https://st3.depositphotos.com/15648834/17930/v/600/depositphotos_179308454-stock-illustration-unknown-person-silhouette-glasses-profile.jpg';
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
              <TouchableOpacity onPress={() => router.push('/(profesionista)/perfil' as any)}>
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
        <Drawer.Screen name="index" options={{ drawerLabel: t('Inicio') }} />
        <Drawer.Screen name="perfil/index" options={{ drawerLabel: t('Perfil') }} />
        <Drawer.Screen name="calendario/index" options={{ drawerLabel: t('Citas') }} />
        <Drawer.Screen name="servicios/index" options={{ drawerLabel: t('Servicios') }} />
        <Drawer.Screen name="horarios/index" options={{ drawerLabel: t('Horarios') }} />
        <Drawer.Screen name="chat/index" options={{ drawerLabel: t('Chat') }} />
        <Drawer.Screen name="reseñas/index" options={{ drawerLabel: t('Reseñas') }} />
        
        {/* PANTALLAS OCULTAS DEL MENÚ */}
        <Drawer.Screen name="servicios/agregar" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="servicios/editar" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="servicios/ubicacion" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="perfil/editar" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="completar-registro" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="chat/[id]" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="configuracion/index" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="ayuda/index" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="configuracion/cambiar-contrasena" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="configuracion/privacidad" options={{ drawerItemStyle: { display: 'none' } }} />
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