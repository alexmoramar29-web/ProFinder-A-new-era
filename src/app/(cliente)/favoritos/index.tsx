import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { supabase } from '../../../lib/supabase';
import NavbarCliente from '../../../components/NavbarCliente';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';

export default function FavoritosDashboard() {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { t } = useTranslation();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profesionalesFav, setProfesionalesFav] = useState<any[]>([]);

  const cargarDatosPerfil = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('users').select('profile_picture').eq('user_id', user.id).maybeSingle();
      if (data?.profile_picture) setAvatarUrl(data.profile_picture);
    }
  };

  const cargarFavoritos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('favorite_professionals')
      .select('professionals(*)')
      .eq('user_id', user.id);

    if (data) setProfesionalesFav(data.map(item => item.professionals));
  };

  useFocusEffect(useCallback(() => {
    cargarDatosPerfil();
    cargarFavoritos();
  }, []));

  return (
    <View style={styles.container}>
      <NavbarCliente />

      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: colors.text.primary }}>{t('Mis Favoritos')}</Text>
      </View>
      <FlatList 
        data={profesionalesFav}
        keyExtractor={(item) => item.prof_id.toString()}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: colors.border.default, width: '100%' }}
            onPress={() => router.push(`/(cliente)/profesionista/${item.prof_id}` as any)}
          >
            {item.profile_picture ? (
              <Image source={{ uri: item.profile_picture }} style={{ width: 50, height: 50, borderRadius: 25, marginRight: 15 }} />
            ) : (
              <View style={{ width: 50, height: 50, borderRadius: 25, marginRight: 15, backgroundColor: colors.neutral[100], justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text.secondary }}>
                  {item.full_name ? item.full_name.charAt(0).toUpperCase() : 'P'}
                </Text>
              </View>
            )}
            <View>
              <Text style={{ fontWeight: 'bold', fontSize: 16, color: colors.text.primary }}>{item.full_name}</Text>
              <Text style={{ fontSize: 14, color: colors.text.secondary }}>{item.speciality}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <Text style={{ textAlign: 'center', color: colors.text.disabled, marginTop: 50 }}>{t('Aún no tienes profesionistas favoritos.')}</Text>
        )}
      />
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  navbar: { height: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, borderColor: colors.border.default },
  navbarTitle: { fontSize: 18, fontWeight: 'bold' },
  rightHeaderContainer: { flexDirection: 'row', alignItems: 'center' },
  profileCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.neutral[100], borderWidth: 1, borderColor: colors.border.default },
  modalContainer: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
  sideMenu: { width: 220, backgroundColor: colors.neutral[50], padding: 20, paddingTop: 60, elevation: 10 },
  menuItem: { paddingVertical: 10 },
  menuText: { fontSize: 16, color: colors.text.primary }
});