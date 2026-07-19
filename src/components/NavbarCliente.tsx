import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation, usePathname, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '../lib/supabase';
import { Colors } from '../theme/Colors';
import { Shadow, Spacing } from '../theme/Spacing';
import { Typography } from '../theme/Typography';

export default function NavbarCliente() {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isMobile = width < 768;
  const { unreadCount } = useNotifications();
  const { isDark, colors } = useTheme();

  const [nombreUsuario, setNombreUsuario] = useState('Mi cuenta');
  const [inicialUsuario, setInicialUsuario] = useState('U');
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const nombre = user.user_metadata?.fullname_temporal
        || user.user_metadata?.full_name
        || user.email?.split('@')[0]
        || 'Mi cuenta';
      setNombreUsuario(nombre);
      setInicialUsuario(nombre.charAt(0).toUpperCase());
      
      const { data } = await supabase.from('users').select('profile_picture').eq('user_id', user.id).maybeSingle();
      if (data?.profile_picture) {
        setFotoPerfil(data.profile_picture);
      } else if (user.user_metadata?.avatar_url) {
        setFotoPerfil(user.user_metadata.avatar_url);
      } else if (user.user_metadata?.picture) {
        setFotoPerfil(user.user_metadata.picture);
      }
    });
  }, []);

  return (
    <View style={[styles.navbar, isMobile && { paddingTop: insets.top + Spacing[3], height: 64 + insets.top }, { backgroundColor: isDark ? '#1A1A2E' : Colors.primary[700], borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)' }]}>
      <Pressable style={styles.navBrand} onPress={() => router.replace('/(cliente)' as any)}>
        <Image source={require('../../assets/images/logo.png')} style={styles.navLogo} resizeMode="contain" />
        <Text style={styles.navLogoText}>{t('ProFinder')}</Text>
      </Pressable>

      {!isMobile && (
        <View style={styles.navLinks}>
          <Pressable onPress={() => router.replace('/(cliente)' as any)}>
            <Text style={[styles.navLink, (pathname === '/' || pathname === '/(cliente)') && styles.navLinkActive]}>{t('Find Professionals')}</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/(cliente)/chat' as any)}>
            <Text style={[styles.navLink, pathname?.includes('/chat') && styles.navLinkActive]}>{t('Chat')}</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(cliente)/servicios' as any)}>
            <Text style={[styles.navLink, pathname?.includes('/servicios') && styles.navLinkActive]}>{t('Citas')}</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.navRight}>
        <Pressable style={styles.navIconBtn} onPress={() => router.push('/(cliente)/notificaciones' as any)}>
          <Ionicons name="notifications-outline" size={20} color="#fff" />
          {unreadCount > 0 && (
            <View style={[styles.badge, { borderColor: isDark ? '#1A1A2E' : Colors.primary[700] }]}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </Pressable>
        {/* Avatar y Menú */}
        <Pressable 
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())} 
          style={isMobile ? { flexDirection: 'row', alignItems: 'center', gap: 8 } : styles.navUserRow}
        >
          {isMobile ? (
            <>
              <View style={styles.navAvatar}>
                {fotoPerfil ? (
                  <Image source={{ uri: fotoPerfil }} style={{ width: '100%', height: '100%', borderRadius: 19 }} />
                ) : (
                  <Text style={styles.navAvatarTxt}>{inicialUsuario}</Text>
                )}
              </View>
              <Ionicons name="menu" size={24} color="#fff" />
            </>
          ) : (
            <>
              <View style={styles.navAvatar}>
                {fotoPerfil ? (
                  <Image source={{ uri: fotoPerfil }} style={{ width: '100%', height: '100%', borderRadius: 19 }} />
                ) : (
                  <Text style={styles.navAvatarTxt}>{inicialUsuario}</Text>
                )}
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
  navIconBtn: { padding: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 999, position: 'relative' },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: Colors.error.main, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: Colors.primary[700] },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
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
