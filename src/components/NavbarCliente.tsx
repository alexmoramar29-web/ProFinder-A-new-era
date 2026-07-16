import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useRouter, usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Colors } from '../theme/Colors';
import { Shadow, Spacing } from '../theme/Spacing';
import { Typography } from '../theme/Typography';

export default function NavbarCliente() {
  const router = useRouter();
  const navigation = useNavigation();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isMobile = width < 768;

  const [nombreUsuario, setNombreUsuario] = useState('Mi cuenta');
  const [inicialUsuario, setInicialUsuario] = useState('U');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const nombre = user.user_metadata?.fullname_temporal
        || user.user_metadata?.full_name
        || user.email?.split('@')[0]
        || 'Mi cuenta';
      setNombreUsuario(nombre);
      setInicialUsuario(nombre.charAt(0).toUpperCase());
    });
  }, []);

  return (
    <View style={[styles.navbar, isMobile && { paddingTop: insets.top + Spacing[3], height: 64 + insets.top }]}>
      <Pressable style={styles.navBrand} onPress={() => router.replace('/(cliente)' as any)}>
        <Image source={require('../../assets/images/logo.png')} style={styles.navLogo} resizeMode="contain" />
        <Text style={styles.navLogoText}>ProFinder</Text>
      </Pressable>

      {!isMobile && (
        <View style={styles.navLinks}>
          <Pressable onPress={() => router.replace('/(cliente)' as any)}>
            <Text style={[styles.navLink, pathname === '/(cliente)' && styles.navLinkActive]}>
              Find Professionals
            </Text>
          </Pressable>
          <Pressable>
            <Text style={styles.navLink}>How it works</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(cliente)/chat' as any)}>
            <Text style={[styles.navLink, pathname?.includes('/chat') && styles.navLinkActive]}>
              Messages
            </Text>
          </Pressable>
          <Pressable>
            <Text style={styles.navLink}>Appointments</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.navRight}>
        <Pressable style={styles.navIconBtn}>
          <Ionicons name="notifications-outline" size={20} color="#fff" />
        </Pressable>
        {/* Avatar y Menú */}
        <Pressable 
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())} 
          style={isMobile ? { flexDirection: 'row', alignItems: 'center', gap: 8 } : styles.navUserRow}
        >
          {isMobile ? (
            <>
              <View style={styles.navAvatar}>
                <Text style={styles.navAvatarTxt}>{inicialUsuario}</Text>
              </View>
              <Ionicons name="menu" size={24} color="#fff" />
            </>
          ) : (
            <>
              <View style={styles.navAvatar}>
                <Text style={styles.navAvatarTxt}>{inicialUsuario}</Text>
              </View>
              <Text style={styles.navUserName}>{nombreUsuario}</Text>
              <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.7)" />
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary[700],
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    ...Shadow.sm,
  },
  navBrand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  navLogo: { width: 38, height: 38 },
  navLogoText: { ...Typography.styles.h4, color: '#fff', letterSpacing: 0.5, fontWeight: '800' },

  navLinks: { flexDirection: 'row', gap: Spacing[6] },
  navLink: { ...Typography.styles.body, color: 'rgba(255,255,255,0.65)', fontSize: 15 },
  navLinkActive: { color: '#fff', fontWeight: '800' },

  navRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing[4] },
  navIconBtn: { padding: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 999 },
  navAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primary[400],
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)',
  },
  navAvatarTxt: { ...Typography.styles.label, color: '#fff', fontSize: 15 },
  navUserRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 999 },
  navUserName: { ...Typography.styles.body, color: '#fff', fontWeight: '700', fontSize: 14 },
});
