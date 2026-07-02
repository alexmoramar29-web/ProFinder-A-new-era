// ============================================================
// ProFinder — Dashboard Cliente
// La pantalla de búsqueda ES el dashboard principal
// Diseño visual: versión HEAD | Datos: conectados a Supabase (Incoming)
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../theme/Colors';
import { Radius, Shadow, Spacing } from '../../theme/Spacing';
import { Typography } from '../../theme/Typography';

const { width: SCREEN_W } = Dimensions.get('window');
const IS_MOBILE = SCREEN_W < 768;

const RATINGS_OPTS = ['3+', '4+', '4.5+'];

export default function ClienteDashboard() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // ── Estado de datos reales ──
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState<any>(null);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [ratingMin, setRatingMin] = useState('4+');

  const cargarDatosIniciales = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('users')
        .select('profile_picture')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.profile_picture) setAvatarUrl(data.profile_picture);
    }

    const { data: catData } = await supabase.from('categories').select('*');
    if (catData) setCategorias(catData);
  };

  const cargarServicios = async () => {
    let query = supabase.from('services').select('*, categories(category_name)');

    if (busqueda && busqueda.trim() !== '') {
      query = query.ilike('service_name', `%${busqueda}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al cargar servicios:', error);
      return;
    }

    if (data) {
      if (categoria) {
        setServicios(data.filter((s) => s.category_id === categoria.category_id));
      } else {
        setServicios(data);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarDatosIniciales();
      cargarServicios();
    }, [busqueda, categoria])
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/sign-in');
  };

  const fotoNavbar = avatarUrl
    ? `${avatarUrl}?t=${new Date().getTime()}`
    : null;

  return (
    <View style={styles.root}>

      {/* ══════════════════════════════════════
          NAVBAR MORADA
      ══════════════════════════════════════ */}
      <View style={styles.navbar}>
        <Pressable style={styles.navBrand}>
          <Image
            source={require('../../../assets/images/logo.png')}
            style={styles.navLogo}
            resizeMode="contain"
          />
          <Text style={styles.navLogoText}>ProFinder</Text>
        </Pressable>

        {!IS_MOBILE && (
          <View style={styles.navLinks}>
            {['Find Professionals', 'How it works', 'Messages', 'Appointments'].map(l => (
              <Pressable key={l}>
                <Text style={[styles.navLink, l === 'Find Professionals' && styles.navLinkActive]}>
                  {l}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.navRight}>
          <Pressable style={styles.navIconBtn}>
            <Ionicons name="notifications-outline" size={20} color="#fff" />
          </Pressable>

          <Pressable onPress={() => router.push('/(cliente)/perfil')}>
            {fotoNavbar ? (
              <Image source={{ uri: fotoNavbar }} style={styles.navAvatarImg} />
            ) : (
              <View style={styles.navAvatar}>
                <Ionicons name="person" size={16} color={Colors.primary[300]} />
              </View>
            )}
          </Pressable>

          <Pressable onPress={() => setMenuVisible(true)} style={styles.navUserRow}>
            {!IS_MOBILE && <Text style={styles.navUserName}>Mi cuenta</Text>}
            <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>
      </View>

      {/* ── Search bar debajo de la navbar ── */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchInputRow}>
          <Ionicons name="search-outline" size={18} color={Colors.text.disabled} />
          <TextInput
            style={styles.searchInput}
            placeholder="Busca profesionistas, habilidades, categorías..."
            placeholderTextColor={Colors.text.disabled}
            value={busqueda}
            onChangeText={setBusqueda}
          />
          {busqueda.length > 0 && (
            <Pressable onPress={() => setBusqueda('')}>
              <Ionicons name="close-circle" size={18} color={Colors.text.disabled} />
            </Pressable>
          )}
        </View>
        <Pressable style={styles.searchBtn} onPress={cargarServicios}>
          <Text style={styles.searchBtnTxt}>Buscar</Text>
        </Pressable>
      </View>

      {/* ══════════════════════════════════════
          CUERPO
      ══════════════════════════════════════ */}
      <View style={styles.body}>

        {/* ── FILTROS ── */}
        {!IS_MOBILE && (
          <View style={styles.filtersPanel}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filters</Text>
              <Pressable onPress={() => { setCategoria(null); setRatingMin('3+'); }}>
                <Text style={styles.filterReset}>Reset All</Text>
              </Pressable>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>CATEGORÍA</Text>
              <Pressable style={styles.selectBox} onPress={() => setCatModalVisible(true)}>
                <Text style={styles.selectText}>
                  {categoria ? categoria.category_name : 'Todas las categorías'}
                </Text>
                <Ionicons name="chevron-down" size={13} color={Colors.text.secondary} />
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
                />
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>MINIMUM RATING</Text>
              <View style={styles.ratingRow}>
                {RATINGS_OPTS.map(r => (
                  <Pressable
                    key={r}
                    style={[styles.ratingChip, ratingMin === r && styles.ratingChipOn]}
                    onPress={() => setRatingMin(r)}
                  >
                    <Text style={[styles.ratingChipTxt, ratingMin === r && styles.ratingChipTxtOn]}>
                      {r}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Botón cerrar sesión al fondo */}
            <Pressable style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={15} color={Colors.error.main} />
              <Text style={styles.logoutTxt}>Cerrar sesión</Text>
            </Pressable>
          </View>
        )}

        {/* ── CARDS ── */}
        <View style={styles.cardsCol}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>Servicios disponibles</Text>
            <Text style={styles.resultsCount}>
              Showing {servicios.length} resultados
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.cardsGrid}>
              {servicios.map((item) => (
                <Pressable
                  key={item.service_id}
                  style={styles.card}
                  onPress={() => router.push(`/(cliente)/servicios/${item.service_id}` as any)}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.avatar}>
                      <Ionicons name="briefcase-outline" size={26} color={Colors.primary[400]} />
                    </View>
                    {item.rating != null && (
                      <View style={styles.ratingBadge}>
                        <Text style={styles.ratingStar}>★</Text>
                        <Text style={styles.ratingNum}>{Number(item.rating).toFixed(1)}</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.cardNombre}>{item.service_name}</Text>
                  <Text style={styles.cardRol}>{item.categories?.category_name ?? 'Sin categoría'}</Text>
                  {item.description ? (
                    <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                  ) : null}

                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.startingAt}>PRECIO</Text>
                      <Text style={styles.precio}>
                        {item.price != null ? `$${item.price}` : 'Consultar'}
                      </Text>
                    </View>
                    <View style={styles.viewBtn}>
                      <Text style={styles.viewBtnTxt}>Ver{'\n'}Detalle</Text>
                    </View>
                  </View>
                </Pressable>
              ))}

              {servicios.length === 0 && (
                <Text style={styles.emptyText}>No se encontraron servicios.</Text>
              )}
            </View>
          </ScrollView>
        </View>

        {/* ── MAPA ── */}
        {!IS_MOBILE && (
          <View style={styles.mapCol}>
            <View style={styles.mapPlaceholder}>
              <View style={styles.mapControls}>
                <Pressable style={styles.mapControlBtn}>
                  <Text style={styles.mapControlTxt}>+</Text>
                </Pressable>
                <Pressable style={styles.mapControlBtn}>
                  <Text style={styles.mapControlTxt}>−</Text>
                </Pressable>
                <Pressable style={styles.mapControlBtn}>
                  <Ionicons name="locate-outline" size={16} color={Colors.text.secondary} />
                </Pressable>
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

      {/* ── MENÚ LATERAL (cuenta) ── */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>
          <View style={styles.sideMenu}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { title: 'Inicio', route: '/(cliente)' },
                { title: 'Favoritos', route: '/(cliente)/favoritos' },
                { title: 'Chat', route: '/(cliente)/chat' },
                { title: 'Mi Perfil', route: '/(cliente)/perfil' },
                { title: 'Configuración', route: '/(cliente)/configuracion' },
                { title: 'Ayuda', route: '/(cliente)/ayuda' },
              ].map((item, index) => (
                <Pressable
                  key={index}
                  style={styles.menuItem}
                  onPress={() => { setMenuVisible(false); router.push(item.route as any); }}
                >
                  <Text style={styles.menuText}>{item.title}</Text>
                </Pressable>
              ))}
              <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 20 }} />
              <Pressable
                onPress={() => { setMenuVisible(false); handleLogout(); }}
                style={styles.menuItem}
              >
                <Text style={{ color: 'red', fontWeight: 'bold' }}>Cerrar Sesión</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL CATEGORÍAS ── */}
      <Modal visible={catModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback onPress={() => setCatModalVisible(false)}>
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>
          <View style={styles.sideMenu}>
            <Pressable onPress={() => { setCategoria(null); setCatModalVisible(false); }} style={styles.menuItem}>
              <Text style={styles.menuText}>Todas</Text>
            </Pressable>
            {categorias.map((cat) => (
              <Pressable
                key={cat.category_id}
                style={styles.menuItem}
                onPress={() => { setCategoria(cat); setCatModalVisible(false); }}
              >
                <Text style={styles.menuText}>{cat.category_name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ── Estilos ──────────────────────────────────────────────────
const FILTER_W = 185;
const MAP_W    = SCREEN_W * 0.28;
const CARDS_W  = IS_MOBILE ? SCREEN_W : SCREEN_W - FILTER_W - MAP_W;
const CARD_W   = IS_MOBILE ? ('100%' as any) : (CARDS_W - Spacing[4] * 3) / 2;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.neutral[100] },

  // Navbar
  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing[5], paddingVertical: Spacing[3], height: 56,
  },
  navBrand:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navLogo:     { width: 44, height: 44 },
  navLogoText: { ...Typography.styles.h5, color: '#fff', letterSpacing: 0.3 },
  navLinks:    { flexDirection: 'row', gap: Spacing[5] },
  navLink:     { ...Typography.styles.body, color: 'rgba(255,255,255,0.75)' },
  navLinkActive: { color: '#fff', fontWeight: '600' },
  navRight:    { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  navIconBtn:  { padding: 4 },
  navAvatar:   {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primary[200],
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
  },
  navAvatarImg: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
  },
  navUserRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  navUserName: { ...Typography.styles.body, color: '#fff', fontWeight: '600' },

  // Search bar
  searchBarWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    backgroundColor: Colors.background.card,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
    borderBottomWidth: 1, borderBottomColor: Colors.border.default,
    ...Shadow.xs,
  },
  searchInputRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    backgroundColor: Colors.neutral[100],
    borderRadius: Radius.input,
    paddingHorizontal: Spacing[3], height: 42,
    borderWidth: 1.5, borderColor: Colors.border.default,
  },
  searchInput: { flex: 1, ...Typography.styles.body, color: Colors.text.primary },
  searchBtn: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing[4], paddingVertical: 10,
    borderRadius: Radius.button,
    ...Shadow.brand,
  },
  searchBtnTxt: { ...Typography.styles.btn, color: '#fff' },

  // Body
  body: { flex: 1, flexDirection: 'row' },

  // Filtros
  filtersPanel: {
    width: FILTER_W,
    backgroundColor: Colors.background.card,
    borderRightWidth: 1, borderRightColor: Colors.border.default,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[4],
  },
  filterHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing[4],
  },
  filterTitle: { ...Typography.styles.h5, color: Colors.text.primary },
  filterReset: { ...Typography.styles.bodySm, color: Colors.primary[600] },
  filterGroup: { marginBottom: Spacing[4] },
  filterLabel: { ...Typography.styles.overline, color: Colors.text.secondary, marginBottom: Spacing[2] },
  selectBox:   {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: Colors.border.default,
    borderRadius: Radius.input, paddingHorizontal: 10, paddingVertical: 7,
  },
  selectText:  { ...Typography.styles.bodySm, color: Colors.text.primary },
  locBox:      {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: Colors.border.default,
    borderRadius: Radius.input, paddingHorizontal: 10, paddingVertical: 7,
  },
  locInput:    { flex: 1, ...Typography.styles.bodySm, color: Colors.text.primary },
  ratingRow:   { flexDirection: 'row', gap: 6 },
  ratingChip:  {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.full, borderWidth: 1.5,
    borderColor: Colors.border.default, backgroundColor: '#fff',
  },
  ratingChipOn:    { backgroundColor: Colors.primary[600], borderColor: Colors.primary[600] },
  ratingChipTxt:   { ...Typography.styles.label, color: Colors.text.secondary, fontSize: 11 },
  ratingChipTxtOn: { color: '#fff' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 'auto' as any, paddingTop: Spacing[4],
    borderTopWidth: 1, borderTopColor: Colors.border.default,
  },
  logoutTxt: { ...Typography.styles.bodySm, color: Colors.error.main },

  // Cards
  cardsCol: { width: IS_MOBILE ? '100%' : CARDS_W, padding: Spacing[4] },
  resultsHeader: { marginBottom: Spacing[4] },
  resultsTitle:  { ...Typography.styles.h3, color: Colors.text.primary },
  resultsCount:  { ...Typography.styles.body, color: Colors.text.secondary, marginTop: 2 },
  cardsGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
  emptyText:     { ...Typography.styles.body, color: Colors.text.secondary, padding: Spacing[4] },

  card: {
    width: CARD_W,
    backgroundColor: Colors.background.card,
    borderRadius: Radius.card, padding: Spacing[4],
    ...Shadow.sm, borderWidth: 1, borderColor: Colors.border.default, gap: Spacing[2],
  },
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  avatar:     {
    width: 52, height: 52, borderRadius: Radius.full,
    backgroundColor: Colors.primary[50], alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary[100],
  },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.primary[600],
    borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 4,
  },
  ratingStar:  { color: '#FCD34D', fontSize: 11 },
  ratingNum:   { ...Typography.styles.label, color: '#fff', fontSize: 12 },
  cardNombre:  { ...Typography.styles.h5, color: Colors.text.primary, fontSize: 15 },
  cardRol:     { ...Typography.styles.label, color: Colors.primary[600], fontSize: 12 },
  cardDesc:    { ...Typography.styles.bodySm, color: Colors.text.secondary, lineHeight: 18 },
  cardFooter:  {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: Spacing[2], paddingTop: Spacing[2],
    borderTopWidth: 1, borderTopColor: Colors.border.default,
  },
  startingAt:  { ...Typography.styles.overline, color: Colors.text.disabled, fontSize: 8 },
  precio:      { ...Typography.styles.h4, color: Colors.text.primary, fontSize: 18 },
  viewBtn:     {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: Radius.button, ...Shadow.brand,
  },
  viewBtnTxt:  { ...Typography.styles.btn, color: '#fff', textAlign: 'center', fontSize: 12 },

  // Mapa
  mapCol:         { width: MAP_W, backgroundColor: Colors.neutral[200] },
  mapPlaceholder: { flex: 1, position: 'relative', backgroundColor: '#e8eaed' },
  mapControls:    {
    position: 'absolute', right: 12, bottom: 80,
    backgroundColor: '#fff', borderRadius: Radius.md, ...Shadow.sm, overflow: 'hidden',
  },
  mapControlBtn:  {
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 1, borderBottomColor: Colors.border.default,
  },
  mapControlTxt:  { fontSize: 18, color: Colors.text.secondary, fontWeight: '300' },

  // Footer
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[4],
    paddingHorizontal: Spacing[5], paddingVertical: Spacing[3],
    backgroundColor: Colors.background.card,
    borderTopWidth: 1, borderTopColor: Colors.border.default,
  },
  footerLogo: { ...Typography.styles.label, color: Colors.text.primary, fontSize: 13 },
  footerTag:  { ...Typography.styles.caption, color: Colors.text.secondary, flex: 1 },
  footerLinks:{ flexDirection: 'row', gap: Spacing[4] },
  footerLink: { ...Typography.styles.caption, color: Colors.text.secondary },
  footerCopy: { ...Typography.styles.caption, color: Colors.text.disabled },

  // Modales (menú lateral y categorías)
  modalContainer: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
  sideMenu: { width: 240, backgroundColor: '#fff', padding: 20, paddingTop: 60, elevation: 10 },
  menuItem: { paddingVertical: 10 },
  menuText: { fontSize: 15, color: '#333' },
});
