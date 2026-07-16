import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItem, DrawerItemList, DrawerToggleButton } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PerfilProvider, usePerfil } from '../../context/PerfilContext';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

// 1. Aquí armamos la caja de tu menú lateral
function MenuPersonalizado(props: DrawerContentComponentProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const salirDeLaCuenta = async () => {
    await supabase.auth.signOut();
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.removeItem('last_portal');
    router.replace('/(auth)/sign-in');
  };

  const alternarModo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Verificar si ya tiene perfil de cliente
    const { data: cliente } = await supabase.from('users').select('user_id').eq('user_id', user.id).maybeSingle();
    
    if (!cliente) {
      // Crear perfil básico si no existe
      const nombreUsuarioGenerado = (user.email?.split('@')[0] || 'user') + Math.floor(Math.random() * 100);
      const nombreCompleto = user.user_metadata?.full_name || user.user_metadata?.name || 'Usuario';
      
      await supabase.from('users').insert([{
        user_id: user.id,
        username: nombreUsuarioGenerado,
        full_name: nombreCompleto,
        email: user.email,
        password_hash: 'PROTEGIDO_POR_RED_SOCIAL'
      }]);
    }
    
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem('last_portal', 'cliente');
    router.replace('/(cliente)');
  };

  return (
    <View style={styles.contenedorPrincipal}>
      <DrawerContentScrollView {...props}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <View style={styles.contenedorFijoAbajo}>
        <DrawerItem
          label="Modo Cliente"
          icon={({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />}
          onPress={alternarModo}
          labelStyle={styles.textoMenuAbajo}
        />
        <DrawerItem
          label={t('configuracionMenu')}
          icon={({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />}
          onPress={() => router.push('/(profesionista)/configuracion' as any)}
          labelStyle={styles.textoMenuAbajo}
        />
        <DrawerItem
          label={t('ayudaMenu')}
          icon={({ color, size }) => <Ionicons name="help-circle-outline" size={size} color={color} />}
          onPress={() => router.push('/(profesionista)/ayuda' as any)}
          labelStyle={styles.textoMenuAbajo}
        />
        <DrawerItem
          label={t('cerrarSesion')}
          icon={({ color, size }) => <Ionicons name="log-out-outline" size={size} color="#FF3B30" />}
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

  const fotoMostrar = fotoGlobal || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';
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