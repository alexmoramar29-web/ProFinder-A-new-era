import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItem, DrawerItemList, DrawerToggleButton } from '@react-navigation/drawer';
import { useRouter, usePathname } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';

function MenuPersonalizado(props: DrawerContentComponentProps) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const router = useRouter();
  const [secretTap, setSecretTap] = useState(0);

  const handleSecret = async () => {
    const newTap = secretTap + 1;
    if (newTap >= 5) {
      setSecretTap(0);
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email === 'alexitojaja111@gmail.com') {
        router.push('/(admin)' as any);
      }
    } else {
      setSecretTap(newTap);
      setTimeout(() => setSecretTap(0), 3000);
    }
  };
  const pathname = usePathname();
  
    const activeBg = isDark ? 'rgba(255,255,255,0.1)' : '#f0eaff';
  const activeColor = colors.primary?.[700] || '#5c4b8a';
  const inactiveColor = colors.text?.primary || '#1C1C1E';
  
  const isConfig = pathname.includes('/configuracion');
  const isAyuda = pathname.includes('/ayuda');

  const salirDeLaCuenta = async () => {
    await supabase.auth.signOut();
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.removeItem('last_portal');
    router.replace('/(auth)/sign-in');
  };

  const alternarModo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Verificar si ya tiene perfil de profesionista
    const { data: prof } = await supabase.from('professionals').select('prof_id').eq('prof_id', user.id).maybeSingle();
    
    if (!prof) {
      // Crear perfil básico si no existe
      const nombreUsuarioGenerado = (user.email?.split('@')[0] || 'user') + Math.floor(Math.random() * 100);
      const nombreCompleto = user.user_metadata?.full_name || user.user_metadata?.name || 'Usuario';
      
      await supabase.from('professionals').insert([{
        prof_id: user.id,
        username: nombreUsuarioGenerado,
        full_name: nombreCompleto,
        email: user.email,
        speciality: 'Por definir',
        password_hash: 'PROTEGIDO_POR_RED_SOCIAL'
      }]);
    }
    
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem('last_portal', 'profesionista');
    router.replace('/(profesionista)');
  };

  return (
    <View style={styles.contenedorPrincipal}>
      <DrawerContentScrollView {...(props as any)}>
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={handleSecret} 
          style={{ width: '100%', height: 60, position: 'absolute', top: -20, left: 0, zIndex: 999 }} 
        />
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <View style={styles.contenedorFijoAbajo}>
        <DrawerItem
          label={t('Modo Profesionista')}
          inactiveTintColor={inactiveColor}
          icon={({ color, size }) => <Ionicons name="briefcase-outline" size={size} color={color} />}
          onPress={alternarModo}
          labelStyle={styles.textoMenuAbajo}
        />
        <DrawerItem
          label={t('Configuración')}
          focused={isConfig}
          activeBackgroundColor={activeBg}
          activeTintColor={activeColor}
          inactiveTintColor={inactiveColor}
          icon={({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />}
          onPress={() => router.push('/(cliente)/configuracion' as any)}
          labelStyle={styles.textoMenuAbajo}
        />
        <DrawerItem
          label={t('Ayuda')}
          focused={isAyuda}
          activeBackgroundColor={activeBg}
          activeTintColor={activeColor}
          inactiveTintColor={inactiveColor}
          icon={({ color, size }) => <Ionicons name="help-circle-outline" size={size} color={color} />}
          onPress={() => router.push('/(cliente)/ayuda' as any)}
          labelStyle={styles.textoMenuAbajo}
        />
        <DrawerItem
          label={t('Cerrar sesión')}
          icon={({ color, size }) => <Ionicons name="log-out-outline" size={size} color="#FF3B30" />}
          onPress={salirDeLaCuenta}
          labelStyle={styles.textoSalir}
        />
      </View>
    </View>
  );
}

export default function ClienteLayout() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const router = useRouter();
  const [verificando, setVerificando] = useState(true);
  const [fotoGlobal, setFotoGlobal] = useState<string | null>(null);

  useEffect(() => {
    const revisarSeguridadYDatos = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.replace('/(auth)/sign-in');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Obtenemos los datos del cliente
        const { data } = await supabase
          .from('users')
          .select('profile_picture')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (!data) {
          // Si no está en 'users', lo mandamos a profesionista
          router.replace('/(profesionista)');
          return;
        }
        
        if (data?.profile_picture) {
          setFotoGlobal(data.profile_picture);
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
          drawerActiveTintColor: colors.primary[700],
          drawerActiveBackgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0eaff',
          drawerInactiveTintColor: colors.text.primary,
          drawerPosition: 'right',
          drawerStyle: { width: 280, backgroundColor: colors.neutral[50] },
          drawerLabelStyle: { fontSize: 16, fontWeight: '600' },
        }}
      >
        <Drawer.Screen name="index" options={{ drawerLabel: t('Inicio'), drawerIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }} />
        <Drawer.Screen name="chat/index" options={{ drawerLabel: t('Chat'), drawerIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" size={size} color={color} /> }} />
        <Drawer.Screen name="favoritos/index" options={{ drawerLabel: t('Favoritos'), drawerIcon: ({ color, size }) => <Ionicons name="heart-outline" size={size} color={color} /> }} />
        <Drawer.Screen name="perfil/index" options={{ drawerLabel: t('Perfil'), drawerIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }} />
        <Drawer.Screen name="servicios/index" options={{ drawerLabel: t('Citas'), drawerIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} /> }} />
        
        {/* PANTALLAS OCULTAS DEL MENÚ */}
        <Drawer.Screen name="perfil/editar" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="chat/[id]" options={{ drawerItemStyle: { display: 'none' }, headerShown: false }} />
        <Drawer.Screen name="servicios/[id]" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="profesionista/[id]" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="agendar/[id]" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="configuracion/index" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="configuracion/cambiar-contrasena" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="configuracion/terminos" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="ayuda/index" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="notificaciones" options={{ drawerItemStyle: { display: 'none' } }} />
      </Drawer>
    </GestureHandlerRootView>
  );
}


const getStyles = (colors: any) => StyleSheet.create({
  contenedorPrincipal: { flex: 1, backgroundColor: colors.neutral[50] },
  contenedorFijoAbajo: { 
    borderTopWidth: 1, 
    borderTopColor: colors.border?.default || colors.neutral[200], 
    paddingBottom: 25, 
    paddingTop: 15, 
    backgroundColor: colors.background?.card || colors.neutral[50] 
  },
  textoMenuAbajo: { color: colors.text.primary, fontWeight: '600', fontSize: 16 },
  textoSalir: { color: '#FF3B30', fontWeight: 'bold', fontSize: 16 },
  contenedorIzquierdo: { marginLeft: 20, justifyContent: 'center' },
  logoImagen: { width: 42, height: 42, borderRadius: 21, overflow: 'hidden', resizeMode: 'cover' },
  contenedorDerecho: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  fotoPerfil: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#ffffff', marginRight: 15, backgroundColor: colors.border?.default || colors.neutral[200], overflow: 'hidden' },
  contenedorMenuBoton: { transform: [{ scale: 1.1 }], justifyContent: 'center', alignItems: 'center' }
});
