// ============================================================
// ProFinder — Dashboard Cliente / Find Professionals
// Conectado con Supabase: tabla professionals + services
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../theme/Colors';
import { Radius, Shadow, Spacing } from '../../theme/Spacing';
import { Typography } from '../../theme/Typography';

const { width: SCREEN_W } = Dimensions.get('window');
const IS_MOBILE = SCREEN_W < 768;

// ── Tipos ────────────────────────────────────────────────────
type Profesional = {
  prof_id: string;
  full_name: string;
  speciality: string;
  profile_description: string | null;
  profile_picture: string | null;
  hourly_rate: number | null;
  year_experience: number | null;
  verification_status: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

const RATINGS_OPTS = ['3+', '4+', '4.5+'];

export default function ClienteDashboard() {
  const router = useRouter();

  // ── Estado del usuario real ──────────────────────────────
  const [nombreUsuario, setNombreUsuario] = useState('Mi cuenta');
  const [inicialUsuario, setInicialUsuario] = useState('U');

  // ── Estado de búsqueda ───────────────────────────────────
  const [busqueda, setBusqueda]       = useState('');
  const [ratingMin, setRatingMin]     = useState('4+');
  const [ubicacion, setUbicacion]     = useState('');
  const [resultados, setResultados]   = useState<Profesional[]>([]);
  const [cargando, setCargando]       = useState(false);
  const [buscado, setBuscado]         = useState(false);

  // ── Cargar nombre del usuario ────────────────────────────
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
    // Cargar todos al inicio
    buscarProfesionales('');
  }, []);

  // ── Buscar en Supabase ───────────────────────────────────
  const buscarProfesionales = async (query: string) => {
    setCargando(true);
    setBuscado(true);
    try {
      let q = supabase
        .from('professionals')
        .select('prof_id, full_name, speciality, profile_description, profile_picture, hourly_rate, year_experience, verification_status, address')
        .eq('is_active', true);

      if (query.trim()) {
        q = q.or(`full_name.ilike.%${query}%,speciality.ilike.%${query}%,profile_description.ilike.%${query}%`);
      }

      if (ubicacion.trim()) {
        q = q.ilike('address', `%${ubicacion}%`);
      }

      const { data, error } = await q.limit(20);
      if (error) throw error;
      setResultados((data as Profesional[]) || []);
    } catch (err) {
      console.error('Error buscando profesionales:', err);
      setResultados([]);
    } finally {
      setCargando(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/sign-in' as any);
  };

  const FILTER_W = 185;
  const MAP_W    = SCREEN_W * 0.28;
  const CARDS_W  = IS_MOBILE ? SCREEN_W : SCREEN_W - FILTER_W - MAP_W;
  const CARD_W   = IS_MOBILE ? ('100%' as any) : (CARDS_W - Spacing[4] * 3) / 2;

  return (
    <View style={styles.root}>

      {/* ── NAVBAR ── */}
      <View style={styles.navbar}>
        <Pressable style={styles.navBrand}>
          <Image source={require('../../../assets/images/logo.png')} style={styles.navLogo} resizeMode="contain" />
          <Text style={styles.navLogoText}>ProFinder</Text>
        </Pressable>

        {!IS_MOBILE && (
          <View style={styles.navLinks}>
            {['Find Professionals', 'How it works', 'Messages', 'Appointments'].map(l => (
              <Pressable key={l} onPress={() => {
                if (l === 'Messages') router.push('/(cliente)/mensajes' as any);
              }}>
                <Text style={[styles.navLink, l === 'Find Professionals' && styles.navLinkActive]}>{l}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.navRight}>
          <Pressable style={styles.navIconBtn}>
            <Ionicons name="notifications-outline" size={20} color="#fff" />
          </Pressable>
          {/* Avatar con inicial real */}
          <View style={styles.navAvatar}>
            <Text style={styles.navAvatarTxt}>{inicialUsuario}</Text>
          </View>
          {!IS_MOBILE && (
            <Pressable onPress={handleLogout} style={styles.navUserRow}>
              <Text style={styles.navUserName}>{nombreUsuario}</Text>
              <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.7)" />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── SEARCH BAR ── */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchInputRow}>
          <Ionicons name="search-outline" size={18} color={Colors.text.disabled} />
          <TextInput
            style={styles.searchInput}
            placeholder="Busca profesionistas, habilidades, categorías..."
            placeholderTextColor={Colors.text.disabled}
            value={busqueda}
            onChangeText={setBusqueda}
            onSubmitEditing={() => buscarProfesionales(busqueda)}
          />
          {busqueda.length > 0 && (
            <Pressable onPress={() => { setBusqueda(''); buscarProfesionales(''); }}>
              <Ionicons name="close-circle" size={18} color={Colors.text.disabled} />
            </Pressable>
          )}
        </View>
        <Pressable style={styles.searchBtn} onPress={() => buscarProfesionales(busqueda)}>
          <Text style={styles.searchBtnTxt}>Buscar</Text>
        </Pressable>
      </View>

      {/* ── CUERPO ── */}
      <View style={styles.body}>

        {/* ── FILTROS ── */}
        {!IS_MOBILE && (
          <View style={[styles.filtersPanel, { width: FILTER_W }]}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filters</Text>
              <Pressable onPress={() => { setRatingMin('3+'); setUbicacion(''); buscarProfesionales(busqueda); }}>
                <Text style={styles.filterReset}>Reset All</Text>
              </Pressable>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>LOCATION</Text>
              <View style={styles.locBox}>
                <Ionicons name="location-outline" size={13} color={Colors.text.disabled} />
                <TextInput
                  placeholder="City or Remote"
                  placeholderTextColor={Colors.text.disabled}
                  style={styles.locInput}
                  value={ubicacion}
                  onChangeText={setUbicacion}
                  onSubmitEditing={() => buscarProfesionales(busqueda)}
                />
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>MINIMUM RATING</Text>
              <View style={styles.ratingRow}>
                {RATINGS_OPTS.map(r => (
                  <Pressable key={r} style={[styles.ratingChip, ratingMin === r && styles.ratingChipOn]} onPress={() => setRatingMin(r)}>
                    <Text style={[styles.ratingChipTxt, ratingMin === r && styles.ratingChipTxtOn]}>{r}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Cerrar sesión */}
            <Pressable style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={15} color={Colors.error.main} />
              <Text style={styles.logoutTxt}>Cerrar sesión</Text>
            </Pressable>
          </View>
        )}

        {/* ── RESULTADOS ── */}
        <View style={[styles.cardsCol, { width: IS_MOBILE ? '100%' : CARDS_W }]}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              {buscado && busqueda ? `Resultados para "${busqueda}"` : 'Profesionistas disponibles'}
            </Text>
            <Text style={styles.resultsCount}>
              {cargando ? 'Buscando...' : `Showing ${resultados.length} resultado${resultados.length !== 1 ? 's' : ''}`}
            </Text>
          </View>

          {cargando ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={Colors.primary[600]} />
              <Text style={styles.loadingTxt}>Buscando profesionistas...</Text>
            </View>
          ) : resultados.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="search-outline" size={48} color={Colors.text.disabled} />
              <Text style={styles.emptyTxt}>No se encontraron profesionistas.</Text>
              <Text style={styles.emptySubTxt}>Intenta con otros términos de búsqueda.</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.cardsGrid}>
                {resultados.map(prof => (
                  <View key={prof.prof_id} style={[styles.card, { width: CARD_W }]}>
                    {/* Avatar */}
                    <View style={styles.cardTop}>
                      {prof.profile_picture ? (
                        <Image source={{ uri: prof.profile_picture }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatar, styles.avatarFallback]}>
                          <Text style={styles.avatarInitial}>
                            {prof.full_name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      {prof.verification_status === 'verified' && (
                        <View style={styles.verifiedBadge}>
                          <Ionicons name="checkmark-circle" size={14} color={Colors.success.main} />
                          <Text style={styles.verifiedTxt}>Verificado</Text>
                        </View>
                      )}
                    </View>

                    {/* Info */}
                    <Text style={styles.cardNombre}>{prof.full_name}</Text>
                    <Text style={styles.cardRol}>{prof.speciality}</Text>
                    {prof.profile_description && (
                      <Text style={styles.cardDesc} numberOfLines={2}>{prof.profile_description}</Text>
                    )}

                    {/* Detalles */}
                    <View style={styles.cardDetails}>
                      {prof.year_experience != null && (
                        <View style={styles.detailItem}>
                          <Ionicons name="briefcase-outline" size={13} color={Colors.text.disabled} />
                          <Text style={styles.detailTxt}>{prof.year_experience} {prof.year_experience === 1 ? 'año' : 'años'}</Text>
                        </View>
                      )}
                      {prof.address && (
                        <View style={styles.detailItem}>
                          <Ionicons name="location-outline" size={13} color={Colors.text.disabled} />
                          <Text style={styles.detailTxt} numberOfLines={1}>{prof.address}</Text>
                        </View>
                      )}
                    </View>

                    {/* Footer */}
                    <View style={styles.cardFooter}>
                      <View>
                        {prof.hourly_rate != null && (
                          <>
                            <Text style={styles.startingAt}>TARIFA</Text>
                            <Text style={styles.precio}>${prof.hourly_rate}/hr</Text>
                          </>
                        )}
                      </View>
                      <Pressable style={styles.viewBtn}>
                        <Text style={styles.viewBtnTxt}>Ver{'\n'}Perfil</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* ── MAPA placeholder ── */}
        {!IS_MOBILE && (
          <View style={[styles.mapCol, { width: MAP_W }]}>
            <View style={styles.mapPlaceholder}>
              {resultados.map((prof, i) => prof.latitude != null && (
                <View key={prof.prof_id} style={[styles.mapPin, { top: `${20 + i * 20}%` as any, left: `${30 + i * 15}%` as any }]}>
                  <Ionicons name="location" size={28} color={Colors.primary[600]} />
                </View>
              ))}
              <View style={styles.mapControls}>
                <Pressable style={styles.mapControlBtn}><Text style={styles.mapControlTxt}>+</Text></Pressable>
                <Pressable style={styles.mapControlBtn}><Text style={styles.mapControlTxt}>−</Text></Pressable>
                <Pressable style={styles.mapControlBtn}><Ionicons name="locate-outline" size={16} color={Colors.text.secondary} /></Pressable>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* ── FOOTER ── */}
      <View style={styles.footer}>
        <Text style={styles.footerLogo}>ProFinder</Text>
        <Text style={styles.footerTag}>Connecting visionaries with experts.</Text>
        <View style={styles.footerLinks}>
          {['Privacy', 'Terms', 'Support'].map(l => (
            <Pressable key={l}><Text style={styles.footerLink}>{l}</Text></Pressable>
          ))}
        </View>
        <Text style={styles.footerCopy}>© 2024 ProFinder.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.neutral[100] },

  // Navbar
  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.primary[600], paddingHorizontal: Spacing[5], paddingVertical: Spacing[3], height: 56 },
  navBrand:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navLogo:     { width: 44, height: 44 },
  navLogoText: { ...Typography.styles.h5, color: '#fff', letterSpacing: 0.3 },
  navLinks:    { flexDirection: 'row', gap: Spacing[5] },
  navLink:     { ...Typography.styles.body, color: 'rgba(255,255,255,0.75)' },
  navLinkActive: { color: '#fff', fontWeight: '600' },
  navRight:    { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  navIconBtn:  { padding: 4 },
  navAvatar:   { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary[400], alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)' },
  navAvatarTxt:{ ...Typography.styles.label, color: '#fff', fontSize: 13 },
  navUserRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  navUserName: { ...Typography.styles.body, color: '#fff', fontWeight: '600' },

  // Search bar
  searchBarWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], backgroundColor: Colors.background.card, paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], borderBottomWidth: 1, borderBottomColor: Colors.border.default, ...Shadow.xs },
  searchInputRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing[2], backgroundColor: Colors.neutral[100], borderRadius: Radius.input, paddingHorizontal: Spacing[3], height: 42, borderWidth: 1.5, borderColor: Colors.border.default },
  searchInput: { flex: 1, ...Typography.styles.body, color: Colors.text.primary },
  searchBtn:   { backgroundColor: Colors.primary[600], paddingHorizontal: Spacing[4], paddingVertical: 10, borderRadius: Radius.button, ...Shadow.brand },
  searchBtnTxt:{ ...Typography.styles.btn, color: '#fff' },

  body: { flex: 1, flexDirection: 'row' },

  // Filtros
  filtersPanel: { backgroundColor: Colors.background.card, borderRightWidth: 1, borderRightColor: Colors.border.default, paddingHorizontal: Spacing[4], paddingVertical: Spacing[4] },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[4] },
  filterTitle:  { ...Typography.styles.h5, color: Colors.text.primary },
  filterReset:  { ...Typography.styles.bodySm, color: Colors.primary[600] },
  filterGroup:  { marginBottom: Spacing[4] },
  filterLabel:  { ...Typography.styles.overline, color: Colors.text.secondary, marginBottom: Spacing[2] },
  locBox:       { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: Colors.border.default, borderRadius: Radius.input, paddingHorizontal: 10, paddingVertical: 7 },
  locInput:     { flex: 1, ...Typography.styles.bodySm, color: Colors.text.primary },
  ratingRow:    { flexDirection: 'row', gap: 6 },
  ratingChip:   { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border.default, backgroundColor: '#fff' },
  ratingChipOn: { backgroundColor: Colors.primary[600], borderColor: Colors.primary[600] },
  ratingChipTxt:   { ...Typography.styles.label, color: Colors.text.secondary, fontSize: 11 },
  ratingChipTxtOn: { color: '#fff' },
  logoutBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 'auto' as any, paddingTop: Spacing[4], borderTopWidth: 1, borderTopColor: Colors.border.default },
  logoutTxt:    { ...Typography.styles.bodySm, color: Colors.error.main },

  // Resultados
  cardsCol:      { padding: Spacing[4] },
  resultsHeader: { marginBottom: Spacing[4] },
  resultsTitle:  { ...Typography.styles.h3, color: Colors.text.primary },
  resultsCount:  { ...Typography.styles.body, color: Colors.text.secondary, marginTop: 2 },
  cardsGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },

  // Loading / Empty
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing[12], gap: Spacing[3] },
  loadingTxt:  { ...Typography.styles.body, color: Colors.text.secondary },
  emptyWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing[12], gap: Spacing[2] },
  emptyTxt:    { ...Typography.styles.h5, color: Colors.text.secondary },
  emptySubTxt: { ...Typography.styles.body, color: Colors.text.disabled },

  // Card
  card: { backgroundColor: Colors.background.card, borderRadius: Radius.card, padding: Spacing[4], ...Shadow.sm, borderWidth: 1, borderColor: Colors.border.default, gap: Spacing[2] },
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  avatar:     { width: 52, height: 52, borderRadius: Radius.full },
  avatarFallback: { backgroundColor: Colors.primary[100], alignItems: 'center', justifyContent: 'center' },
  avatarInitial:  { ...Typography.styles.h4, color: Colors.primary[600] },
  verifiedBadge:  { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.success.light, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  verifiedTxt:    { ...Typography.styles.caption, color: Colors.success.dark, fontWeight: '600' },
  cardNombre: { ...Typography.styles.h5, color: Colors.text.primary, fontSize: 15 },
  cardRol:    { ...Typography.styles.label, color: Colors.primary[600], fontSize: 12 },
  cardDesc:   { ...Typography.styles.bodySm, color: Colors.text.secondary, lineHeight: 18 },
  cardDetails:{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3], marginTop: 2 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailTxt:  { ...Typography.styles.caption, color: Colors.text.disabled, maxWidth: 100 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing[2], paddingTop: Spacing[2], borderTopWidth: 1, borderTopColor: Colors.border.default },
  startingAt: { ...Typography.styles.overline, color: Colors.text.disabled, fontSize: 8 },
  precio:     { ...Typography.styles.h4, color: Colors.text.primary, fontSize: 18 },
  viewBtn:    { backgroundColor: Colors.primary[600], paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.button, ...Shadow.brand },
  viewBtnTxt: { ...Typography.styles.btn, color: '#fff', textAlign: 'center', fontSize: 12 },

  // Mapa
  mapCol:         { backgroundColor: Colors.neutral[200] },
  mapPlaceholder: { flex: 1, position: 'relative', backgroundColor: '#e8eaed' },
  mapPin:         { position: 'absolute' },
  mapControls:    { position: 'absolute', right: 12, bottom: 80, backgroundColor: '#fff', borderRadius: Radius.md, ...Shadow.sm, overflow: 'hidden' },
  mapControlBtn:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: Colors.border.default },
  mapControlTxt:  { fontSize: 18, color: Colors.text.secondary, fontWeight: '300' },

  // Footer
  footer:      { flexDirection: 'row', alignItems: 'center', gap: Spacing[4], paddingHorizontal: Spacing[5], paddingVertical: Spacing[3], backgroundColor: Colors.background.card, borderTopWidth: 1, borderTopColor: Colors.border.default },
  footerLogo:  { ...Typography.styles.label, color: Colors.text.primary, fontSize: 13 },
  footerTag:   { ...Typography.styles.caption, color: Colors.text.secondary, flex: 1 },
  footerLinks: { flexDirection: 'row', gap: Spacing[4] },
  footerLink:  { ...Typography.styles.caption, color: Colors.text.secondary },
  footerCopy:  { ...Typography.styles.caption, color: Colors.text.disabled },
});
