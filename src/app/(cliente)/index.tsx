import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions, Modal, TouchableOpacity, Platform } from 'react-native';
import NavbarCliente from '../../components/NavbarCliente';
import MapaWeb from '../../components/shared/MapaWeb';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../theme/Colors';
import { Radius, Shadow, Spacing } from '../../theme/Spacing';
import { Typography } from '../../theme/Typography';
import { useTranslation } from 'react-i18next';

const RATINGS_OPTS = ['1+', '2+', '3+', '4+', '4.5+'];

export default function ClienteDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobileLayout = width < 768;
  const isTouchDevice = Platform.OS !== 'web' || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);
  const shouldUseModalMap = isMobileLayout && isTouchDevice;
  const isMobile = isMobileLayout; // Alias for backward compatibility in the rest of the code

  const [busqueda, setBusqueda] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [ratingMin, setRatingMin] = useState('');
  const [distanciaMax, setDistanciaMax] = useState('');
  const [soloVerificados, setSoloVerificados] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [resultados, setResultados] = useState<any[]>([]);
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [miUbicacion, setMiUbicacion] = useState<any>(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setMiUbicacion({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        }
      } catch (e) {
        // Ignorar si el usuario deniega o falla
      }
    })();
  }, []);

  const buscarProfesionales = async (termino: string) => {
    try {
      setCargando(true);
      setBuscado(true);
      let query = supabase.from('professionals').select('*, services(reviews(rating))');

      if (termino.trim()) {
        const terminoLower = termino.toLowerCase().trim();
        const predefinedSpecialities = ['Ingeniero Civil', 'Doctor', 'Ingeniero en Sistemas Software', 'Por definir'];
        const matchedSpecialities = predefinedSpecialities.filter(spec => 
          t(spec).toLowerCase().includes(terminoLower)
        );

        let orConditions = [];
        
        if (matchedSpecialities.length > 0) {
          matchedSpecialities.forEach(spec => {
            orConditions.push(`speciality.ilike.%${spec}%`);
          });
        } else {
          orConditions.push(`speciality.ilike.%${termino}%`);
        }
        
        orConditions.push(`full_name.ilike.%${termino}%`);
        orConditions.push(`profile_description.ilike.%${termino}%`);
        
        query = query.or(orConditions.join(','));
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setResultados(data || []);
    } catch (e) {
      console.log('Error buscando:', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const initData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        const { data: favs } = await supabase.from('favorite_professionals').select('prof_id').eq('user_id', session.user.id);
        if (favs) setFavoritos(favs.map(f => f.prof_id));
      }
      buscarProfesionales('');
    };
    initData();
  }, []);

  const alternarFavorito = async (profId: string) => {
    if (!userId) return;
    const esFav = favoritos.includes(profId);
    if (esFav) {
      await supabase.from('favorite_professionals').delete().eq('user_id', userId).eq('prof_id', profId);
      setFavoritos(prev => prev.filter(id => id !== profId));
    } else {
      await supabase.from('favorite_professionals').insert([{ user_id: userId, prof_id: profId }]);
      setFavoritos(prev => [...prev, profId]);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.removeItem('last_portal');
    router.replace('/(auth)/sign-in' as any);
  };

  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const resultadosProcesados = resultados.map(prof => {
    let totalRating = 0;
    let reviewCount = 0;
    if (prof.services) {
      prof.services.forEach((s: any) => {
        if (s.reviews) {
          s.reviews.forEach((r: any) => {
            totalRating += r.rating;
            reviewCount++;
          });
        }
      });
    }
    const avgRating = reviewCount > 0 ? Number((totalRating / reviewCount).toFixed(1)) : 0;
    return { ...prof, avgRating, reviewCount };
  }).filter(prof => {
    if (userId && prof.prof_id === userId) return false;

    if (ubicacion.trim()) {
      const ubiNorm = ubicacion.toLowerCase().trim();
      const predefinedLocations = ['México', 'Estados Unidos', 'España', 'Colombia', 'Argentina', 'Chile', 'Perú', 'Ciudad de México', 'Nueva York'];
      const matchedLocations = predefinedLocations.filter(loc => 
        t(loc).toLowerCase().includes(ubiNorm)
      );

      const addrNorm = (prof.address || '').toLowerCase();
      const matchInTranslations = matchedLocations.some(loc => addrNorm.includes(loc.toLowerCase()));
      
      if (!addrNorm.includes(ubiNorm) && !matchInTranslations) {
        return false;
      }
    }
    if (ratingMin === '4.5+' && prof.avgRating < 4.5) return false;
    if (ratingMin === '4+' && prof.avgRating < 4) return false;
    if (ratingMin === '3+' && prof.avgRating < 3) return false;
    if (ratingMin === '2+' && prof.avgRating < 2) return false;
    if (ratingMin === '1+' && prof.avgRating < 1) return false;

    if (soloVerificados) {
      const estado = (prof.verification_status || '').toLowerCase();
      const esAprobado = estado === 'verificado' || estado === 'aprobado' || estado === 'perfil aprobado';
      if (!esAprobado) return false;
    }

    if (distanciaMax.trim() && !isNaN(Number(distanciaMax)) && miUbicacion && prof.latitude && prof.longitude) {
      const maxKm = Number(distanciaMax);
      const dist = getDistanceFromLatLonInKm(
        miUbicacion.latitude, miUbicacion.longitude,
        parseFloat(prof.latitude), parseFloat(prof.longitude)
      );
      if (dist > maxKm) return false;
    }

    return true;
  });

  const marcadores = resultadosProcesados
    .filter(p => p.latitude != null && p.longitude != null)
    .map(p => ({
      id: p.prof_id,
      latitude: parseFloat(p.latitude as any),
      longitude: parseFloat(p.longitude as any),
      title: p.full_name,
      subtitle: p.speciality,
      rating: p.avgRating,
      reviewCount: p.reviewCount,
      color: 'morado' as any
    }))
    .filter(p => !isNaN(p.latitude) && !isNaN(p.longitude));

  if (miUbicacion) {
    marcadores.push({
      id: 'mi-ubicacion',
      latitude: miUbicacion.latitude,
      longitude: miUbicacion.longitude,
      title: 'Mi Ubicación',
      subtitle: 'Estás aquí',
      color: 'plateado' as any
    });
  }

  let latSum = 0, lonSum = 0;
  marcadores.forEach(m => { latSum += m.latitude; lonSum += m.longitude; });
  const centroMapa = miUbicacion 
    ? miUbicacion 
    : marcadores.length > 0
      ? { latitude: latSum / marcadores.length, longitude: lonSum / marcadores.length }
      : { latitude: 23.6345, longitude: -102.5528 }; // Centro de México default

  return (
    <View style={styles.root}>
      {/* ── NAVBAR GLOBAL ── */}
      <NavbarCliente />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
        {/* ── SEARCH BAR (Premium) ── */}
        <View style={styles.searchBarWrap}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputRow}>
              <Ionicons name="search" size={22} color={Colors.primary[600]} />
              <TextInput
                placeholder={t('¿Qué servicio buscas? Ej. Plomero, Electricista')}
                placeholderTextColor={Colors.text.disabled}
                style={styles.searchInput}
                value={busqueda}
                onChangeText={setBusqueda}
                onSubmitEditing={() => buscarProfesionales(busqueda)}
              />
            </View>
            {!isMobile && (
              <Pressable style={styles.searchBtn} onPress={() => buscarProfesionales(busqueda)}>
                <Text style={styles.searchBtnTxt}>{t('Buscar')}</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* ── CUERPO ── */}
        <View style={[styles.body, { flexDirection: isMobile ? 'column' : 'row' }]}>

          {/* ── FILTROS ── */}
          {isMobile ? (
            <View style={styles.mobileFiltersWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileFiltersScroll}>
                <View style={styles.locBoxMobile}>
                  <Ionicons name="location-outline" size={18} color={Colors.primary[600]} />
                  <TextInput
                    placeholder={t('Ciudad o CP')}
                    placeholderTextColor={Colors.text.disabled}
                    style={styles.locInputMobile}
                    value={ubicacion}
                    onChangeText={setUbicacion}
                    onSubmitEditing={() => buscarProfesionales(busqueda)}
                  />
                </View>
                <View style={styles.locBoxMobile}>
                  <Ionicons name="navigate-outline" size={18} color={Colors.primary[600]} />
                  <TextInput
                    placeholder={t('Máx Km')}
                    placeholderTextColor={Colors.text.disabled}
                    style={[styles.locInputMobile, { width: 70 }]}
                    value={distanciaMax}
                    onChangeText={setDistanciaMax}
                    keyboardType="numeric"
                  />
                </View>
                <Pressable style={[styles.ratingChipMobile, soloVerificados && styles.ratingChipOnMobile]} onPress={() => setSoloVerificados(!soloVerificados)}>
                  <Text style={[styles.ratingChipTxtMobile, soloVerificados && styles.ratingChipTxtOnMobile]}>{t('Verificados')}</Text>
                </Pressable>
                {RATINGS_OPTS.map(r => (
                  <Pressable key={r} style={[styles.ratingChipMobile, ratingMin === r && styles.ratingChipOnMobile]} onPress={() => setRatingMin(r)}>
                    <Text style={[styles.ratingChipTxtMobile, ratingMin === r && styles.ratingChipTxtOnMobile]}>{r}★</Text>
                  </Pressable>
                ))}
                <Pressable onPress={() => { setRatingMin(''); setUbicacion(''); setDistanciaMax(''); setSoloVerificados(false); buscarProfesionales(busqueda); }} style={styles.filterResetBtnMobile}>
                   <Text style={styles.filterResetTxtMobile}>{t('Limpiar')}</Text>
                </Pressable>
              </ScrollView>
            </View>
          ) : (
            <View style={[styles.filtersPanel, { width: 280 }]}>
              <View style={styles.filterHeader}>
                <Text style={styles.filterTitle}>{t('Filtros')}</Text>
                <Pressable onPress={() => { setRatingMin(''); setUbicacion(''); setDistanciaMax(''); setSoloVerificados(false); buscarProfesionales(busqueda); }}>
                  <Text style={styles.filterReset}>{t('Limpiar')}</Text>
                </Pressable>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>{t('UBICACIÓN')}</Text>
                <View style={styles.locBox}>
                  <Ionicons name="location-outline" size={16} color={Colors.primary[600]} />
                  <TextInput
                    placeholder={t('Ciudad o CP')}
                    placeholderTextColor={Colors.text.disabled}
                    style={styles.locInput}
                    value={ubicacion}
                    onChangeText={setUbicacion}
                    onSubmitEditing={() => buscarProfesionales(busqueda)}
                  />
                </View>
                <View style={[styles.locBox, { marginTop: 8 }]}>
                  <Ionicons name="navigate-outline" size={16} color={Colors.primary[600]} />
                  <TextInput
                    placeholder={t('Distancia Máx (Km)')}
                    placeholderTextColor={Colors.text.disabled}
                    style={styles.locInput}
                    value={distanciaMax}
                    onChangeText={setDistanciaMax}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>{t('VERIFICACIÓN')}</Text>
                <Pressable 
                  style={[styles.locBox, { backgroundColor: soloVerificados ? Colors.primary[50] : '#fff', borderColor: soloVerificados ? Colors.primary[400] : Colors.border.default }]} 
                  onPress={() => setSoloVerificados(!soloVerificados)}
                >
                  <Ionicons name={soloVerificados ? "checkmark-circle" : "ellipse-outline"} size={16} color={soloVerificados ? Colors.primary[600] : Colors.text.disabled} />
                  <Text style={{ marginLeft: 8, color: soloVerificados ? Colors.primary[700] : Colors.text.secondary }}>{t('Solo Verificados')}</Text>
                </Pressable>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>{t('CALIFICACIÓN')}</Text>
                <View style={styles.ratingRow}>
                  {RATINGS_OPTS.map(r => (
                    <Pressable key={r} style={[styles.ratingChip, ratingMin === r && styles.ratingChipOn]} onPress={() => setRatingMin(r)}>
                      <Text style={[styles.ratingChipTxt, ratingMin === r && styles.ratingChipTxtOn]}>{r}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

            </View>
          )}

          {/* ── MAPA PARA MÓVIL (PREVIEW) ── */}
          {isMobile && (
            <View style={{ width: '100%', paddingHorizontal: 16, marginBottom: 16 }}>
              <View style={{ height: 350, borderRadius: 20, overflow: 'hidden', position: 'relative', ...Shadow.md }}>
                <MapaWeb 
                  coordenadas={centroMapa} 
                  marcadores={marcadores}
                  onMarkerPress={(id) => router.push(`/(cliente)/profesionista/${id}` as any)}
                  height={350}
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
                       <Ionicons name="expand-outline" size={20} color="#fff" />
                       <Text style={styles.mapOverlayBtnTxt}>{t('Tocar para interactuar')}</Text>
                     </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* ── RESULTADOS ── */}
          <View style={[styles.cardsCol, !isMobile && { flex: 1 }]}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                {buscado && busqueda ? `${t('resultadosPara')} "${busqueda}"` : t('Profesionistas Disponibles')}
              </Text>
              <Text style={styles.resultsCount}>
                {cargando ? t('Buscando expertos...') : `${t('Mostrando')} ${resultadosProcesados.length} ${resultadosProcesados.length !== 1 ? t('resultados') : t('resultado')}`}
              </Text>
            </View>

            {cargando ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={Colors.primary[600]} />
                <Text style={styles.loadingTxt}>{t('Encontrando a los mejores...')}</Text>
              </View>
            ) : resultadosProcesados.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="search-outline" size={64} color={Colors.neutral[300]} />
                <Text style={styles.emptyTxt}>{t('No se encontraron profesionistas.')}</Text>
                <Text style={styles.emptySubTxt}>{t('Intenta con otros términos de búsqueda.')}</Text>
              </View>
            ) : (
              <View style={[styles.cardsGrid, isMobile && { flexDirection: 'column', flexWrap: 'nowrap' }]}>
                {resultadosProcesados.map(prof => (
                    <Pressable key={prof.prof_id} style={[styles.card, { width: isMobile ? '100%' : '48%', minWidth: isMobile ? 'auto' : 320 }]} onPress={() => router.push(`/(cliente)/profesionista/${prof.prof_id}` as any)}>
                      {/* Avatar Header */}
                    <View style={styles.cardHeader}>
                      <View style={styles.avatarContainer}>
                        {prof.profile_picture ? (
                          <Image source={{ uri: prof.profile_picture }} style={styles.avatar} />
                        ) : (
                          <View style={[styles.avatar, styles.avatarFallback]}>
                            <Text style={styles.avatarInitial}>
                              {prof.full_name ? prof.full_name.charAt(0).toUpperCase() : 'P'}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.cardHeaderInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          {(() => {
                            const estado = (prof.verification_status || '').toLowerCase();
                            return estado === 'verificado' || estado === 'aprobado' || estado === 'perfil aprobado';
                          })() && (
                            <View style={styles.verifiedBadge}>
                              <Ionicons name="checkmark-circle" size={12} color={Colors.primary[700]} />
                              <Text style={styles.verifiedTxt}>{t('Verificado')}</Text>
                            </View>
                          )}
                          <Text style={styles.cardNombre} numberOfLines={1}>{prof.full_name}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={styles.cardRol}>{t(prof.speciality || 'Por definir')}</Text>
                          <Pressable onPress={() => alternarFavorito(prof.prof_id)} style={{ padding: 4 }}>
                            <Ionicons name={favoritos.includes(prof.prof_id) ? "heart" : "heart-outline"} size={20} color={favoritos.includes(prof.prof_id) ? Colors.primary[600] : Colors.text.secondary} />
                          </Pressable>
                        </View>
                      </View>
                    </View>

                    {/* Desc */}
                    {prof.profile_description ? (
                      <Text style={styles.cardDesc} numberOfLines={2}>{prof.profile_description}</Text>
                    ) : null}

                    {/* Footer / Acción */}
                    <View style={[styles.cardFooter, isMobile && { flexDirection: 'column', alignItems: 'stretch', gap: 16 }]}>
                      <View style={isMobile && { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                          <Text style={styles.startingAt}>{t('RESEÑAS')}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Ionicons name="star" size={16} color="#F59E0B" />
                            <Text style={styles.precio}>{prof.avgRating > 0 ? prof.avgRating : 'N/A'}</Text>
                            <Text style={styles.precioSub}>({prof.reviewCount})</Text>
                          </View>
                        </View>
                      </View>
                      <Pressable style={[styles.viewBtn, isMobile && { justifyContent: 'center', height: 44 }]} onPress={() => router.push(`/(cliente)/profesionista/${prof.prof_id}` as any)}>
                        <Text style={styles.viewBtnTxt}>{t('Agendar / Ver más')}</Text>
                        <Ionicons name="arrow-forward" size={16} color="#fff" />
                      </Pressable>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* ── MAPA real ── */}
          {!isMobile && (
            <View style={[styles.mapCol, { width: '30%', padding: Spacing[4], position: 'sticky' as any, top: 16, alignSelf: 'flex-start' }]}>
              <View style={{ flex: 1, height: 600, borderRadius: 20, overflow: 'hidden', ...Shadow.md }}>
                <MapaWeb 
                  coordenadas={centroMapa} 
                  marcadores={marcadores} 
                  height={600} 
                  onMarkerPress={(id) => router.push(`/(cliente)/profesionista/${id}` as any)}
                  requireConfirmToNavigate={true}
                />
              </View>
            </View>
          )}
        </View>

        {/* ── FOOTER ── */}
        <View style={styles.footer}>
          <View style={styles.footerBrand}>
            <Text style={styles.footerLogo}>{t('ProFinder')}</Text>
            <Text style={styles.footerTag}>{t('Connecting visionaries with experts.')}</Text>
          </View>
          <View style={styles.footerLinks}>
            {['Privacy', 'Terms', 'Support'].map(l => (
              <Pressable key={l}><Text style={styles.footerLink}>{l}</Text></Pressable>
            ))}
          </View>
          <Text style={styles.footerCopy}>{t('© 2024 ProFinder.')}</Text>
        </View>
      </ScrollView>

      {/* ── MAPA MODAL (PANTALLA COMPLETA) ── */}
      <Modal visible={isMapModalOpen} transparent={true} animationType="fade" onRequestClose={() => setIsMapModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('Mapa de Profesionistas')}</Text>
              <TouchableOpacity onPress={() => setIsMapModalOpen(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <MapaWeb 
                coordenadas={centroMapa} 
                marcadores={marcadores}
                onMarkerPress={(id) => {
                   setIsMapModalOpen(false);
                   router.push(`/(cliente)/profesionista/${id}` as any);
                }}
                height="100%"
                readOnly={false}
                requireConfirmToNavigate={true}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },

  // Search Bar Premium
  searchBarWrap: { backgroundColor: '#fff', paddingVertical: Spacing[3], paddingHorizontal: Spacing[4], zIndex: 10, ...Shadow.sm },
  searchContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], maxWidth: 1200, alignSelf: 'center', width: '100%' },
  searchInputRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing[3], backgroundColor: '#F3F4F6', borderRadius: 999, paddingHorizontal: Spacing[4], height: 48 },
  searchInput: { flex: 1, ...Typography.styles.body, color: Colors.text.primary, fontSize: 16 },
  searchBtn: { backgroundColor: Colors.primary[600], paddingHorizontal: Spacing[6], height: 48, justifyContent: 'center', borderRadius: 999, ...Shadow.brand },
  searchBtnTxt: { ...Typography.styles.btn, color: '#fff', fontSize: 15, fontWeight: '700' },

  body: { flex: 1, flexDirection: 'row', maxWidth: 1600, alignSelf: 'center', width: '100%' },

  // Filtros Mobile
  mobileFiltersWrapper: { backgroundColor: '#fff', paddingVertical: Spacing[3] },
  mobileFiltersScroll: { paddingHorizontal: Spacing[4], gap: Spacing[3], alignItems: 'center' },
  locBoxMobile: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F3F4F6', borderRadius: 999, paddingHorizontal: 16, height: 38 },
  locInputMobile: { minWidth: 120, ...Typography.styles.bodySm, color: Colors.text.primary, fontWeight: '500' },
  ratingChipMobile: { paddingHorizontal: 16, height: 38, justifyContent: 'center', borderRadius: 999, backgroundColor: '#F3F4F6' },
  ratingChipOnMobile: { backgroundColor: Colors.primary[100] },
  ratingChipTxtMobile: { ...Typography.styles.label, color: Colors.text.secondary, fontSize: 13 },
  ratingChipTxtOnMobile: { color: Colors.primary[700], fontWeight: '700' },
  filterResetBtnMobile: { paddingHorizontal: 12, height: 38, justifyContent: 'center' },
  filterResetTxtMobile: { ...Typography.styles.label, color: Colors.text.secondary, textDecorationLine: 'underline' },

  // Filtros PC
  filtersPanel: { backgroundColor: '#fff', paddingHorizontal: Spacing[6], paddingVertical: Spacing[6] },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[6] },
  filterTitle: { ...Typography.styles.h4, color: Colors.text.primary, fontWeight: '700' },
  filterReset: { ...Typography.styles.bodySm, color: Colors.primary[600], fontWeight: '600' },
  filterGroup: { marginBottom: Spacing[6] },
  filterLabel: { ...Typography.styles.overline, color: Colors.text.secondary, marginBottom: Spacing[3], letterSpacing: 0.8 },
  locBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 14, height: 46 },
  locInput: { flex: 1, ...Typography.styles.body, color: Colors.text.primary },
  ratingRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  ratingChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  ratingChipOn: { backgroundColor: Colors.primary[100] },
  ratingChipTxt: { ...Typography.styles.label, color: Colors.text.secondary, fontSize: 13 },
  ratingChipTxtOn: { color: Colors.primary[700], fontWeight: '700' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 'auto' as any, paddingTop: Spacing[6] },
  logoutTxt: { ...Typography.styles.body, color: Colors.error.main, fontWeight: '600' },

  // Resultados
  cardsCol: { padding: Spacing[5], backgroundColor: '#F8F9FA' },
  resultsHeader: { marginBottom: Spacing[5] },
  resultsTitle: { ...Typography.styles.h3, color: Colors.text.primary, fontWeight: '800', letterSpacing: -0.5 },
  resultsCount: { ...Typography.styles.body, color: Colors.text.secondary, marginTop: 4 },
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[4] },

  // Loading / Empty
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing[12], gap: Spacing[4] },
  loadingTxt: { ...Typography.styles.h5, color: Colors.text.secondary },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing[16], gap: Spacing[3] },
  emptyTxt: { ...Typography.styles.h4, color: Colors.text.primary, fontWeight: '700' },
  emptySubTxt: { ...Typography.styles.body, color: Colors.text.secondary },

  // Premium Card
  card: { backgroundColor: '#fff', borderRadius: 20, padding: Spacing[5], ...Shadow.md, gap: Spacing[4] },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: { backgroundColor: Colors.primary[100], alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { ...Typography.styles.h3, color: Colors.primary[700], fontWeight: 'bold' },
  cardHeaderInfo: { flex: 1 },
  cardNombre: { ...Typography.styles.h5, color: Colors.text.primary, fontWeight: '700', fontSize: 17 },
  cardRol: { ...Typography.styles.label, color: Colors.primary[600], fontSize: 13, marginTop: 2, fontWeight: '600' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary[100], paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, gap: 2 },
  verifiedTxt: { ...Typography.styles.caption, color: Colors.primary[700], fontSize: 10, fontWeight: '600' },
  cardDesc: { ...Typography.styles.body, color: Colors.text.secondary, lineHeight: 22, fontSize: 14 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4, paddingTop: Spacing[4] },
  startingAt: { ...Typography.styles.overline, color: Colors.text.disabled, fontSize: 10, letterSpacing: 0.5, marginBottom: 2 },
  precio: { ...Typography.styles.h3, color: Colors.text.primary, fontWeight: '800' },
  precioSub: { fontSize: 14, color: Colors.text.secondary, fontWeight: '500' },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary[600], paddingHorizontal: 20, height: 40, borderRadius: 999, ...Shadow.brand },
  viewBtnTxt: { ...Typography.styles.btn, color: '#fff', fontSize: 13, fontWeight: '700' },
  mapOverlayMobile: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)' },
  mapOverlayBtn: { backgroundColor: Colors.primary[700], paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 8, ...Shadow.lg },
  mapOverlayBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { width: '100%', height: '85%', backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', ...Shadow.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' },
  modalTitle: { ...Typography.styles.h5, color: Colors.text.primary },
  modalCloseBtn: { padding: 4 },

  // Mapa
  mapCol: { backgroundColor: '#E5E7EB' },
  mapPlaceholder: { flex: 1, position: 'relative', backgroundColor: '#F3F4F6' },
  mapPin: { position: 'absolute', alignItems: 'center' },
  mapPinDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#000', opacity: 0.2, marginTop: -4 },
  mapControls: { position: 'absolute', right: 16, bottom: 24, backgroundColor: '#fff', borderRadius: 12, ...Shadow.md, overflow: 'hidden' },
  mapControlBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  mapControlTxt: { fontSize: 22, color: Colors.text.secondary, fontWeight: '300' },

  // Footer
  footer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: Spacing[4], paddingHorizontal: Spacing[6], paddingVertical: Spacing[4], backgroundColor: '#fff' },
  footerBrand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  footerLogo: { ...Typography.styles.label, color: Colors.text.primary, fontSize: 14, fontWeight: '700' },
  footerTag: { ...Typography.styles.caption, color: Colors.text.secondary },
  footerLinks: { flexDirection: 'row', gap: Spacing[5] },
  footerLink: { ...Typography.styles.caption, color: Colors.text.secondary, fontWeight: '500' },
  footerCopy: { ...Typography.styles.caption, color: Colors.text.disabled },
});
