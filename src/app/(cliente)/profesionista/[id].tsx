import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState, useEffect } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions, Platform, Modal } from 'react-native';
import * as Location from 'expo-location';
import NavbarCliente from '../../../components/NavbarCliente';
import { supabase } from '../../../lib/supabase';
import { Colors } from '../../../theme/Colors';
import { Radius, Shadow, Spacing } from '../../../theme/Spacing';
import { Typography } from '../../../theme/Typography';
import MapaWeb from '../../../components/shared/MapaWeb';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';

export default function PerfilProfesionistaScreen() {
  const { isDark, colors } = useTheme();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobileLayout = width < 768;
  const isTouchDevice = Platform.OS !== 'web' || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);
  const shouldUseModalMap = isMobileLayout && isTouchDevice;
  const isMobile = isMobileLayout;
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [showVerificationInfo, setShowVerificationInfo] = useState(false);
  const [profesional, setProfesional] = useState<any>(null);
  const [portafolio, setPortafolio] = useState<any[]>([]);
  const [reviewsStat, setReviewsStat] = useState({ avg: 0, count: 0 });
  const [cargando, setCargando] = useState(true);
  const [miUbicacion, setMiUbicacion] = useState<{ latitude: number; longitude: number } | null>(null);
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);
  const [esFavorito, setEsFavorito] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const location = await Location.getCurrentPositionAsync({});
        setMiUbicacion({ latitude: location.coords.latitude, longitude: location.coords.longitude });
      } catch (e) {
        console.log("Error obteniendo ubicación en perfil:", e);
      }
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const cargarPerfil = async () => {
        try {
          const { data, error } = await supabase
            .from('professionals')
            .select('*, services(reviews(rating))')
            .eq('prof_id', id)
            .single();

          if (error) throw error;
          setProfesional(data);

          let totalRating = 0;
          let reviewCount = 0;
          if (data.services) {
            data.services.forEach((s: any) => {
              if (s.reviews) {
                s.reviews.forEach((r: any) => {
                  totalRating += r.rating;
                  reviewCount++;
                });
              }
            });
          }
          const avg = reviewCount > 0 ? Number((totalRating / reviewCount).toFixed(1)) : 0;
          setReviewsStat({ avg, count: reviewCount });

          const { data: fotos } = await supabase.from('professional_images').select('*').eq('prof_id', id);
          if (fotos) setPortafolio(fotos);

          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setCurrentUserId(user.id);
            const { data: fav } = await supabase.from('favorite_professionals').select('*').eq('user_id', user.id).eq('prof_id', id).maybeSingle();
            setEsFavorito(!!fav);
          }
        } catch (e) {
          console.log("Error al cargar profesional:", e);
        } finally {
          setCargando(false);
        }
      };

      cargarPerfil();
    }, [id])
  );

  const alternarFavorito = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (esFavorito) {
      await supabase.from('favorite_professionals').delete().eq('user_id', user.id).eq('prof_id', id);
      setEsFavorito(false);
    } else {
      await supabase.from('favorite_professionals').insert([{ user_id: user.id, prof_id: id }]);
      setEsFavorito(true);
    }
  };

  const iniciarChat = () => {
    if (!profesional) return;
    const nombreUrl = encodeURIComponent(profesional.full_name || 'Profesional');
    const inicial = profesional.full_name ? profesional.full_name.charAt(0).toUpperCase() : 'P';
    const estado = (profesional.verification_status || '').toLowerCase();
    const esAprobado = estado === 'verificado' || estado === 'aprobado' || estado === 'perfil aprobado';
    const fotoUrl = encodeURIComponent(profesional.profile_picture || '');
    router.push(`/(cliente)/chat/${profesional.prof_id}?nombre=${nombreUrl}&inicial=${inicial}&verificado=${esAprobado}&foto=${fotoUrl}`);
  };

  if (cargando) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.neutral[50] }}>
        <NavbarCliente />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
        </View>
      </View>
    );
  }

  if (!profesional) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.neutral[50] }}>
        <NavbarCliente />
        <View style={styles.centerContainer}>
          <Text style={{ ...Typography.styles.h5, color: colors.text.disabled }}>{t('No se encontró el profesionista')}</Text>
          <TouchableOpacity style={styles.backBtnFallback} onPress={() => router.back()}>
            <Text style={{ color: colors.neutral[0] }}>{t('Volver')}</Text>
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
            <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
            <Text style={styles.backTxt}>{t('Volver')}</Text>
          </TouchableOpacity>

          <View style={styles.card}>
            <TouchableOpacity style={{ position: 'absolute', top: Spacing[4], right: Spacing[4], zIndex: 10, padding: 4 }} onPress={alternarFavorito}>
              <FontAwesome name={esFavorito ? "heart" : "heart-o"} size={28} color={esFavorito ? colors.primary[600] : colors.text.secondary} />
            </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.avatarWrap}>
              <TouchableOpacity onPress={() => { if (profesional.profile_picture) setFotoAmpliada(profesional.profile_picture); }} activeOpacity={0.8}>
                {profesional.profile_picture ? (
                  <Image source={{ uri: profesional.profile_picture }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarPlaceholderTxt}>
                      {profesional.full_name ? profesional.full_name.charAt(0).toUpperCase() : 'P'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              {(() => {
                const estado = (profesional.verification_status || '').toLowerCase();
                const esAprobado = estado === 'verificado' || estado === 'aprobado' || estado === 'perfil aprobado';
                if (!esAprobado) return null;
                return (
                  <TouchableOpacity 
                    style={styles.verifiedBadge} 
                    onPress={() => setShowVerificationInfo(!showVerificationInfo)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary[600]} />
                  </TouchableOpacity>
                );
              })()}
            </View>
            
            {showVerificationInfo && (
              <View style={styles.verificationTooltip}>
                <Ionicons name="shield-checkmark" size={16} color={colors.primary[700]} />
                <Text style={styles.verificationTooltipTxt}>{t('Perfil y documentos verificados por ProFinder')}</Text>
              </View>
            )}

            <Text style={styles.name}>{profesional.full_name}</Text>
            {profesional.username && (
              <Text style={{ ...Typography.styles.body, color: colors.text.secondary, marginBottom: 4 }}>
                @{profesional.username}
              </Text>
            )}
            <Text style={[styles.speciality, { fontSize: 18 }]}>{profesional.speciality || 'Especialidad no especificada'}</Text>
          </View>

          {/* Sección 5: Reseñas */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{reviewsStat.avg > 0 ? `★ ${reviewsStat.avg}` : 'Nuevo'}</Text>
              <Text style={styles.statLabel}>{reviewsStat.count} reseñas</Text>
            </View>
          </View>

          {/* Sección 6 y 7: Botones de Acción (Agendar y Mensaje) */}
          {currentUserId !== profesional.prof_id && (
            <View style={{ marginBottom: Spacing[6] }}>
              <TouchableOpacity style={styles.agendarBtn} onPress={() => router.push(`/(cliente)/agendar/${profesional.prof_id}` as any)}>
                <Ionicons name="calendar-outline" size={22} color={colors.primary[700]} />
                <Text style={styles.agendarBtnTxt}>{t('Agendar Cita')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.chatBtn} onPress={iniciarChat}>
                <Ionicons name="chatbubbles-outline" size={22} color={colors.neutral[0]} />
                <Text style={styles.chatBtnTxt}>{t('Enviar Mensaje')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.divider} />

          {/* Sección 8: Descripción */}
          <View style={{ marginBottom: Spacing[6] }}>
            <Text style={styles.sectionTitle}>{t('Acerca de')}</Text>
            <Text style={styles.desc}>
              {profesional.profile_description || 'Este profesionista aún no ha agregado una descripción a su perfil.'}
            </Text>
          </View>

          {/* Sección 9: Trabajos */}
          {portafolio.length > 0 && (
            <View style={{ marginBottom: Spacing[6] }}>
              <Text style={styles.sectionTitle}>{t('Trabajos')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing[4] }} contentContainerStyle={{ paddingHorizontal: Spacing[4], gap: 12 }}>
                {portafolio.map((item) => (
                  <TouchableOpacity key={item.image_id} onPress={() => setFotoAmpliada(item.image_url)} activeOpacity={0.8}>
                    <Image source={{ uri: item.image_url }} style={{ width: 120, height: 120, borderRadius: 12, backgroundColor: colors.neutral[200] }} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Sección 10: Ubicación */}
          {profesional.latitude && profesional.longitude && (
            <View style={{ marginBottom: Spacing[2] }}>
              <Text style={styles.sectionTitle}>{t('Ubicación de Trabajo')}</Text>
              <Text style={{ ...Typography.styles.body, color: colors.text.secondary, marginBottom: Spacing[3] }}>
                {(() => {
                  if (profesional.address && profesional.address.includes('|||')) {
                    const partes = profesional.address.split('|||');
                    const c = partes[0] || '';
                    const ne = partes[1] || '';
                    const ni = partes[2] || '';
                    const co = partes[3] || '';
                    const cp = partes[4] || '';
                    const r = partes[5] || '';
                    return `${c} ${ne} ${ni ? `Int ${ni}` : ''}, ${co}, CP ${cp}${r ? `. Ref: ${r}` : ''}`;
                  }
                  return profesional.address || 'Ubicación mostrada en el mapa';
                })()}
              </Text>
              <View style={{ height: 180, borderRadius: 16, overflow: 'hidden', ...Shadow.sm, position: 'relative' }}>
                <MapaWeb 
                  coordenadas={miUbicacion ? miUbicacion : { latitude: parseFloat(profesional.latitude as any), longitude: parseFloat(profesional.longitude as any) }} 
                  marcadores={[
                    {
                      id: profesional.prof_id,
                      latitude: parseFloat(profesional.latitude as any),
                      longitude: parseFloat(profesional.longitude as any),
                      title: profesional.full_name,
                      subtitle: profesional.speciality,
                      rating: reviewsStat.avg,
                      reviewCount: reviewsStat.count,
                      color: 'morado'
                    },
                    ...(miUbicacion ? [{
                      id: 'mi-ubicacion',
                      latitude: miUbicacion.latitude,
                      longitude: miUbicacion.longitude,
                      title: 'Mi Ubicación',
                      color: 'plateado' as any
                    }] : [])
                  ]}
                  height={180} 
                  readOnly={shouldUseModalMap}
                  requireConfirmToNavigate={true}
                />
                {shouldUseModalMap && (
                  <TouchableOpacity 
                     style={styles.mapOverlayMobile}
                     activeOpacity={0.8}
                     onPress={() => setIsMapModalOpen(true)}
                  >
                     <View style={styles.mapOverlayBtn}>
                       <Ionicons name="expand-outline" size={20} color={colors.neutral[0]} />
                       <Text style={styles.mapOverlayBtnTxt}>{t('Tocar para interactuar')}</Text>
                     </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
        </View>
      </ScrollView>

      {/* ── MAPA MODAL (PANTALLA COMPLETA) ── */}
      <Modal visible={isMapModalOpen} transparent={true} animationType="fade" onRequestClose={() => setIsMapModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('Ubicación de Trabajo')}</Text>
              <TouchableOpacity onPress={() => setIsMapModalOpen(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <MapaWeb 
                coordenadas={miUbicacion ? miUbicacion : { latitude: parseFloat(profesional.latitude as any), longitude: parseFloat(profesional.longitude as any) }} 
                marcadores={[
                  {
                    id: profesional.prof_id,
                    latitude: parseFloat(profesional.latitude as any),
                    longitude: parseFloat(profesional.longitude as any),
                    title: profesional.full_name,
                    subtitle: profesional.speciality,
                    rating: reviewsStat.avg,
                    reviewCount: reviewsStat.count,
                    color: 'morado'
                  },
                  ...(miUbicacion ? [{
                    id: 'mi-ubicacion',
                    latitude: miUbicacion.latitude,
                    longitude: miUbicacion.longitude,
                    title: 'Mi Ubicación',
                    color: 'plateado' as any
                  }] : [])
                ]}
                height="100%"
                readOnly={false}
                requireConfirmToNavigate={true}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL DE IMAGEN AMPLIADA ── */}
      <Modal visible={fotoAmpliada !== null} transparent={true} animationType="fade" onRequestClose={() => setFotoAmpliada(null)}>
        <View style={styles.imageModalBackdrop}>
          <TouchableOpacity style={styles.imageModalCloseBtn} onPress={() => setFotoAmpliada(null)}>
            <Text style={{ color: colors.neutral[0], fontSize: 16, fontWeight: 'bold' }}>{t('Cerrar')}</Text>
          </TouchableOpacity>
          {fotoAmpliada && (
            <Image source={{ uri: fotoAmpliada }} style={styles.imageModalImg} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.neutral[100] },
  scroll: { padding: Spacing[4] },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtnFallback: { backgroundColor: colors.primary[600], paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.button, marginTop: 20 },
  
  backBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: Spacing[4] },
  backTxt: { ...Typography.styles.body, marginLeft: Spacing[2], fontWeight: '500', color: colors.text.primary },

  card: { backgroundColor: colors.background.card, borderRadius: Radius.card, padding: Spacing[6], ...Shadow.md },
  
  header: { alignItems: 'center', marginBottom: Spacing[5] },
  avatarWrap: { position: 'relative', marginBottom: Spacing[3] },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { backgroundColor: colors.primary[200], justifyContent: 'center', alignItems: 'center' },
  avatarPlaceholderTxt: { ...Typography.styles.h2, color: colors.primary[700] },
  verifiedBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: colors.neutral[0], borderRadius: 15, padding: 2, ...Shadow.sm },
  verificationTooltip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary[100], paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.button, marginBottom: Spacing[4], gap: 8 },
  verificationTooltipTxt: { ...Typography.styles.caption, color: colors.primary[700], fontWeight: '500' },
  
  name: { ...Typography.styles.h4, color: colors.text.primary, marginBottom: 2 },
  speciality: { ...Typography.styles.body, color: colors.primary[600], fontWeight: '500' },

  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing[6], marginBottom: Spacing[5] },
  statBox: { alignItems: 'center' },
  statVal: { ...Typography.styles.h5, color: colors.text.primary },
  statLabel: { ...Typography.styles.caption, color: colors.text.secondary },

  divider: { height: 1, backgroundColor: colors.border.default, marginVertical: Spacing[4] },

  sectionTitle: { ...Typography.styles.h5, color: colors.text.primary, marginBottom: Spacing[3] },
  desc: { ...Typography.styles.body, color: colors.text.secondary, lineHeight: 22 },

  chatBtn: { flexDirection: 'row', backgroundColor: colors.primary[600], paddingVertical: 14, borderRadius: Radius.button, justifyContent: 'center', alignItems: 'center', ...Shadow.brand, gap: 10, marginBottom: Spacing[3] },
  chatBtnTxt: { ...Typography.styles.btn, color: colors.neutral[0], fontSize: 16 },

  agendarBtn: { flexDirection: 'row', backgroundColor: colors.primary[100], paddingVertical: 14, borderRadius: Radius.button, justifyContent: 'center', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.primary[200], marginBottom: Spacing[3] },
  agendarBtnTxt: { ...Typography.styles.btn, color: colors.primary[700], fontSize: 16 },

  mapOverlayMobile: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.15)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  mapOverlayBtn: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, alignItems: 'center', gap: 8 },
  mapOverlayBtnTxt: { color: colors.neutral[0], fontSize: 14, fontWeight: '600' },
  
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.neutral[0], height: '90%', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border.default },
  modalTitle: { ...Typography.styles.h4, color: colors.text.primary },
  modalCloseBtn: { padding: 4 },
  
  imageModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  imageModalCloseBtn: { position: 'absolute', top: 40, right: 20, zIndex: 10, padding: 10 },
  imageModalImg: { width: '100%', height: '80%' }
});
