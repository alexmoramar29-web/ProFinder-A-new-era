import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions, Modal } from 'react-native';
import NavbarProfesionista from '../../../components/NavbarProfesionista';
import { supabase } from '../../../lib/supabase';
import { Colors } from '../../../theme/Colors';
import { Radius, Shadow, Spacing } from '../../../theme/Spacing';
import { Typography } from '../../../theme/Typography';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';

export default function ClientePerfilScreen() {
  const { isDark, colors } = useTheme();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [cliente, setCliente] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const cargarPerfilCliente = async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', id)
            .single();

          if (error) throw error;
          setCliente(data);
        } catch (e) {
          console.log("Error al cargar cliente:", e);
        } finally {
          setCargando(false);
        }
      };

      cargarPerfilCliente();
    }, [id])
  );

  const iniciarChat = () => {
    if (!cliente) return;
    const nombreUrl = encodeURIComponent(cliente.full_name || 'Cliente');
    const inicial = cliente.full_name ? cliente.full_name.charAt(0).toUpperCase() : 'C';
    const fotoUrl = encodeURIComponent(cliente.profile_picture || '');
    router.push(`/(profesionista)/chat/${cliente.user_id}?nombre=${nombreUrl}&inicial=${inicial}&verificado=false&foto=${fotoUrl}`);
  };

  if (cargando) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.neutral[50] }}>
        <NavbarProfesionista />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
        </View>
      </View>
    );
  }

  if (!cliente) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.neutral[50] }}>
        <NavbarProfesionista />
        <View style={styles.centerContainer}>
          <Text style={{ ...Typography.styles.h5, color: colors.text.disabled }}>{t('No se encontró el cliente')}</Text>
          <TouchableOpacity style={styles.backBtnFallback} onPress={() => router.back()}>
            <Text style={{ color: colors.neutral[0] }}>{t('Volver')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <NavbarProfesionista />
      
      <ScrollView contentContainerStyle={[styles.scroll, { padding: isMobile ? Spacing[4] : Spacing[8] }]}>
        <View style={{ maxWidth: 600, width: '100%', alignSelf: 'center' }}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
            <Text style={styles.backTxt}>{t('Volver')}</Text>
          </TouchableOpacity>

          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.avatarWrap}>
                <TouchableOpacity onPress={() => { if (cliente.profile_picture) setFotoAmpliada(cliente.profile_picture); }} activeOpacity={0.8}>
                  {cliente.profile_picture ? (
                    <Image source={{ uri: cliente.profile_picture }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Text style={styles.avatarPlaceholderTxt}>
                        {cliente.full_name ? cliente.full_name.charAt(0).toUpperCase() : 'C'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.name}>{cliente.full_name || t('Cliente')}</Text>
              
              {cliente.username && (
                <Text style={{ ...Typography.styles.body, color: colors.text.secondary, marginBottom: 4 }}>
                  @{cliente.username}
                </Text>
              )}
            </View>

            <View style={styles.divider} />

            <View style={{ marginBottom: Spacing[6] }}>
              <TouchableOpacity style={styles.chatBtn} onPress={iniciarChat}>
                <Ionicons name="chatbubbles-outline" size={22} color={colors.neutral[0]} />
                <Text style={styles.chatBtnTxt}>{t('Enviar Mensaje')}</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </ScrollView>

      {/* MODAL ZOOM FOTO */}
      <Modal visible={fotoAmpliada !== null} transparent={true} animationType="fade">
        <View style={styles.modalFondoOscuro}>
          <TouchableOpacity style={styles.botonCerrarModal} onPress={() => setFotoAmpliada(null)}>
            <Text style={styles.textoCerrarModal}>{t('cerrarModal', 'Cerrar')}</Text>
          </TouchableOpacity>
          
          {fotoAmpliada && (
            <Image source={{ uri: fotoAmpliada }} style={styles.fotoGigante} resizeMode="contain" />
          )}
        </View>
      </Modal>

    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.neutral[50] },
  scroll: { flexGrow: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing[4] },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[4], alignSelf: 'flex-start' },
  backTxt: { ...Typography.styles.body, fontWeight: '600', color: colors.text.primary, marginLeft: 8 },
  backBtnFallback: { backgroundColor: colors.primary[600], paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.md, marginTop: 16 },
  card: { backgroundColor: colors.neutral[0], borderRadius: Radius.xl, padding: Spacing[6], ...Shadow.md, borderWidth: 1, borderColor: colors.border.default },
  header: { alignItems: 'center', marginBottom: Spacing[2] },
  avatarWrap: { position: 'relative', marginBottom: Spacing[4] },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.neutral[200] },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary[100] },
  avatarPlaceholderTxt: { ...Typography.styles.h1, color: colors.primary[700], fontWeight: 'bold' },
  name: { ...Typography.styles.h2, color: colors.text.primary, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  divider: { height: 1, backgroundColor: colors.border.default, marginVertical: Spacing[6] },
  chatBtn: { backgroundColor: colors.primary[600], flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing[4], borderRadius: Radius.md, ...Shadow.brand },
  chatBtnTxt: { ...Typography.styles.btn, color: colors.neutral[0], marginLeft: 8, fontWeight: '700' },
  modalFondoOscuro: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.95)', justifyContent: 'center', alignItems: 'center' },
  botonCerrarModal: { position: 'absolute', top: 50, right: 20, padding: 10, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: Radius.button, zIndex: 10 },
  textoCerrarModal: { color: colors.neutral[0], fontWeight: 'bold', fontSize: 16 },
  fotoGigante: { width: '90%', height: '80%' }
});
