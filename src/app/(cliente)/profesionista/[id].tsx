import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import NavbarCliente from '../../../components/NavbarCliente';
import { supabase } from '../../../lib/supabase';
import { Colors } from '../../../theme/Colors';
import { Radius, Shadow, Spacing } from '../../../theme/Spacing';
import { Typography } from '../../../theme/Typography';

export default function PerfilProfesionistaScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [profesional, setProfesional] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const cargarPerfil = async () => {
        try {
          const { data, error } = await supabase
            .from('professionals')
            .select('*')
            .eq('prof_id', id)
            .single();

          if (error) throw error;
          setProfesional(data);
        } catch (e) {
          console.log("Error al cargar profesional:", e);
        } finally {
          setCargando(false);
        }
      };

      cargarPerfil();
    }, [id])
  );

  const iniciarChat = () => {
    if (!profesional) return;
    const nombreUrl = encodeURIComponent(profesional.full_name || 'Profesional');
    const inicial = profesional.full_name ? profesional.full_name.charAt(0).toUpperCase() : 'P';
    router.push(`/(cliente)/chat/${profesional.prof_id}?nombre=${nombreUrl}&inicial=${inicial}`);
  };

  if (cargando) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.neutral[50] }}>
        <NavbarCliente />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
        </View>
      </View>
    );
  }

  if (!profesional) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.neutral[50] }}>
        <NavbarCliente />
        <View style={styles.centerContainer}>
          <Text style={{ ...Typography.styles.h5, color: Colors.text.disabled }}>No se encontró el profesionista</Text>
          <TouchableOpacity style={styles.backBtnFallback} onPress={() => router.back()}>
            <Text style={{ color: '#fff' }}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <NavbarCliente />
      
      <ScrollView contentContainerStyle={[styles.scroll, { padding: isMobile ? Spacing[4] : Spacing[8] }]}>
        <View style={{ maxWidth: 800, width: '100%', alignSelf: 'center' }}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
            <Text style={styles.backTxt}>Volver</Text>
          </TouchableOpacity>

          <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.avatarWrap}>
              {profesional.profile_picture ? (
                <Image source={{ uri: profesional.profile_picture }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarPlaceholderTxt}>
                    {profesional.full_name ? profesional.full_name.charAt(0).toUpperCase() : 'P'}
                  </Text>
                </View>
              )}
              {profesional.verification_status && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success.main} />
                </View>
              )}
            </View>
            
            <Text style={styles.name}>{profesional.full_name}</Text>
            <Text style={styles.speciality}>{profesional.speciality || 'Especialidad no especificada'}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>${profesional.hourly_rate || 0}/hr</Text>
              <Text style={styles.statLabel}>Tarifa base</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{profesional.year_experience || 0}</Text>
              <Text style={styles.statLabel}>Años exp.</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Acerca de</Text>
          <Text style={styles.desc}>
            {profesional.profile_description || 'Este profesionista aún no ha agregado una descripción a su perfil.'}
          </Text>

          {/* Área protegida: Solo si el usuario quiere iniciar el chat */}
          <TouchableOpacity style={styles.chatBtn} onPress={iniciarChat}>
            <Ionicons name="chatbubbles-outline" size={22} color="#fff" />
            <Text style={styles.chatBtnTxt}>Enviar Mensaje</Text>
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.neutral[100] },
  scroll: { padding: Spacing[4] },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtnFallback: { backgroundColor: Colors.primary[600], paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.button, marginTop: 20 },
  
  backBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: Spacing[4] },
  backTxt: { ...Typography.styles.body, marginLeft: Spacing[2], fontWeight: '500', color: Colors.text.primary },

  card: { backgroundColor: Colors.background.card, borderRadius: Radius.card, padding: Spacing[6], ...Shadow.md },
  
  header: { alignItems: 'center', marginBottom: Spacing[5] },
  avatarWrap: { position: 'relative', marginBottom: Spacing[3] },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { backgroundColor: Colors.primary[200], justifyContent: 'center', alignItems: 'center' },
  avatarPlaceholderTxt: { ...Typography.styles.h2, color: Colors.primary[700] },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#fff', borderRadius: 10, padding: 2 },
  
  name: { ...Typography.styles.h4, color: Colors.text.primary, marginBottom: 2 },
  speciality: { ...Typography.styles.body, color: Colors.primary[600], fontWeight: '500' },

  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing[6], marginBottom: Spacing[5] },
  statBox: { alignItems: 'center' },
  statVal: { ...Typography.styles.h5, color: Colors.text.primary },
  statLabel: { ...Typography.styles.caption, color: Colors.text.secondary },

  divider: { height: 1, backgroundColor: Colors.border.default, marginVertical: Spacing[4] },

  sectionTitle: { ...Typography.styles.h5, color: Colors.text.primary, marginBottom: Spacing[3] },
  desc: { ...Typography.styles.body, color: Colors.text.secondary, lineHeight: 22, marginBottom: Spacing[6] },

  chatBtn: { flexDirection: 'row', backgroundColor: Colors.primary[600], paddingVertical: 14, borderRadius: Radius.button, justifyContent: 'center', alignItems: 'center', ...Shadow.brand, gap: 10 },
  chatBtnTxt: { ...Typography.styles.btn, color: '#fff', fontSize: 16 }
});
