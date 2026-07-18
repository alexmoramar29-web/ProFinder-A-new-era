import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItem, DrawerItemList, DrawerToggleButton } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../theme/Colors';
import { Typography } from '../../theme/Typography';
import { Spacing } from '../../theme/Spacing';
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
          headerShown: false,
          drawerActiveTintColor: Colors.primary[700],
          drawerActiveBackgroundColor: Colors.primary[100],
          drawerInactiveTintColor: Colors.text.secondary,
          drawerPosition: 'right',
          drawerStyle: { width: 280, backgroundColor: Colors.neutral[50] },
          drawerLabelStyle: { ...Typography.styles.body, fontWeight: '600' },
        }}
      >
        <Drawer.Screen name="index" options={{ drawerLabel: t('Inicio'), drawerIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }} />
        <Drawer.Screen name="perfil/index" options={{ drawerLabel: t('Perfil'), drawerIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }} />
        <Drawer.Screen name="calendario/index" options={{ drawerLabel: t('Citas'), drawerIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} /> }} />
        <Drawer.Screen name="servicios/index" options={{ drawerLabel: t('Servicios'), drawerIcon: ({ color, size }) => <Ionicons name="briefcase-outline" size={size} color={color} /> }} />
        <Drawer.Screen name="horarios/index" options={{ drawerLabel: t('Horarios'), drawerIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} /> }} />
        <Drawer.Screen name="chat/index" options={{ drawerLabel: t('Chat'), drawerIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" size={size} color={color} /> }} />
        <Drawer.Screen name="reseñas/index" options={{ drawerLabel: t('Reseñas'), drawerIcon: ({ color, size }) => <Ionicons name="star-outline" size={size} color={color} /> }} />
        
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
        <Drawer.Screen name="notificaciones" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="cliente/[id]" options={{ drawerItemStyle: { display: 'none' } }} />
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
  contenedorPrincipal: { flex: 1, backgroundColor: Colors.neutral[50] },
  contenedorFijoAbajo: { borderTopWidth: 1, borderTopColor: Colors.border.default, paddingBottom: 25, paddingTop: Spacing[3], backgroundColor: '#fff' },
  textoMenuAbajo: { ...Typography.styles.body, color: Colors.text.primary, fontWeight: '600' },
  textoSalir: { ...Typography.styles.body, color: Colors.error.main, fontWeight: '700' },
  contenedorIzquierdo: { marginLeft: 20, justifyContent: 'center' },
  logoImagen: { width: 42, height: 42, borderRadius: 21, overflow: 'hidden', resizeMode: 'cover' },
  contenedorDerecho: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  fotoPerfil: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#ffffff', marginRight: 15, backgroundColor: Colors.neutral[200], overflow: 'hidden' },
  contenedorMenuBoton: { transform: [{ scale: 1.1 }], justifyContent: 'center', alignItems: 'center' }
});