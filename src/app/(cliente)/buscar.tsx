// ============================================================
// ProFinder — Search Results
// Fiel al mockup: navbar morada con logo, filtros izquierda,
// cards centro, mapa derecha
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors } from '../../theme/Colors';
import { Radius, Shadow, Spacing } from '../../theme/Spacing';
import { Typography } from '../../theme/Typography';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const IS_MOBILE = SCREEN_W < 768;

// ── Datos de ejemplo ─────────────────────────────────────────
const PROFESIONISTAS = [
  {
    id: '1',
    nombre: 'Ana Sofia Moreno Gaytan',
    rol: 'Senior Product Designer',
    rating: 4.9,
    precio: 120,
    descripcion: 'Ex-Google designer con 8+ años de experiencia.',
    habilidades: ['UI Design', 'UX Research', 'Figma', 'Systems'],
  },
  {
    id: '2',
    nombre: 'Rosanen M.',
    rol: 'Full Stack Developer',
    rating: 4.8,
    precio: 95,
    descripcion: 'Building high-performance React...',
    habilidades: ['React', 'Node.js', 'Next.js', 'AWS'],
  },
  {
    id: '3',
    nombre: 'Borrman M.',
    rol: 'UX Strategist & Researcher',
    rating: 5.0,
    precio: 140,
    descripcion: 'Helping startups validate ideas through rigorous...',
    habilidades: ['User Testing', 'Strategy'],
  },
  {
    id: '4',
    nombre: 'Carlos Mendez',
    rol: 'Mobile Developer',
    rating: 4.7,
    precio: 85,
    descripcion: 'Especialista en React Native y Flutter.',
    habilidades: ['React Native', 'Flutter', 'Firebase'],
  },
];

const EXPERIENCIAS = ['Junior (0-2 yrs)', 'Mid-Level (3-5 yrs)', 'Senior (6+ yrs)'];
const RATINGS_OPTS = ['3+', '4+', '4.5+'];
const CERTS_OPTS   = ['Google UX Design', 'NN/g Certified'];

export default function BuscarScreen() {
  const router = useRouter();

  const [busqueda,     setBusqueda]     = useState('');
  const [experiencias, setExperiencias] = useState<string[]>(['Mid-Level (3-5 yrs)']);
  const [ratingMin,    setRatingMin]    = useState('4+');
  const [certs,        setCerts]        = useState<string[]>([]);

  const toggleExp  = (v: string) =>
    setExperiencias(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  const toggleCert = (v: string) =>
    setCerts(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);

  const resultados = PROFESIONISTAS.filter(p => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return p.nombre.toLowerCase().includes(q) ||
           p.rol.toLowerCase().includes(q) ||
           p.habilidades.some(h => h.toLowerCase().includes(q));
  });

  return (
    <View style={styles.root}>

      {/* ══════════════════════════════════════
          NAVBAR MORADA
      ══════════════════════════════════════ */}
      <View style={styles.navbar}>
        {/* Logo */}
        <Pressable style={styles.navBrand} onPress={() => router.replace('/(cliente)')}>
          <Image
            source={require('../../../assets/images/logo.png')}
            style={styles.navLogo}
            resizeMode="contain"
          />
          <Text style={styles.navLogoText}>ProFinder</Text>
        </Pressable>

        {/* Links centrales (solo desktop) */}
        {!IS_MOBILE && (
          <View style={styles.navLinks}>
            {['Find Professionals', 'How it works', 'Messages', 'Appointments'].map(l => (
              <Pressable key={l}>
                <Text style={[
                  styles.navLink,
                  l === 'Find Professionals' && styles.navLinkActive,
                ]}>
                  {l}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Derecha */}
        <View style={styles.navRight}>
          <Pressable style={styles.navIconBtn}>
            <Ionicons name="notifications-outline" size={20} color="#fff" />
          </Pressable>
          <View style={styles.navAvatar}>
            <Ionicons name="person" size={16} color={Colors.primary[300]} />
          </View>
          {!IS_MOBILE && (
            <View style={styles.navUserRow}>
              <Text style={styles.navUserName}>Jordan S.</Text>
              <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.7)" />
            </View>
          )}
        </View>
      </View>

      {/* ══════════════════════════════════════
          CUERPO: filtros | cards | mapa
      ══════════════════════════════════════ */}
      <View style={styles.body}>

        {/* ── PANEL FILTROS ── */}
        {!IS_MOBILE && (
          <View style={styles.filtersPanel}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filters</Text>
              <Pressable onPress={() => { setExperiencias([]); setCerts([]); setRatingMin('3+'); }}>
                <Text style={styles.filterReset}>Reset All</Text>
              </Pressable>
            </View>

            {/* Experiencia */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>EXPERIENCE</Text>
              {EXPERIENCIAS.map(exp => (
                <Pressable key={exp} style={styles.checkRow} onPress={() => toggleExp(exp)}>
                  <View style={[styles.checkbox, experiencias.includes(exp) && styles.checkboxOn]}>
                    {experiencias.includes(exp) && <Ionicons name="checkmark" size={10} color="#fff" />}
                  </View>
                  <Text style={styles.checkText}>{exp}</Text>
                </Pressable>
              ))}
            </View>

            {/* Grado */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>DEGREE</Text>
              <View style={styles.selectBox}>
                <Text style={styles.selectText}>All Degrees</Text>
                <Ionicons name="chevron-down" size={13} color={Colors.text.secondary} />
              </View>
            </View>

            {/* Ubicación */}
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

            {/* Rating */}
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

            {/* Certificaciones */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>CERTIFICATIONS</Text>
              {CERTS_OPTS.map(c => (
                <Pressable key={c} style={styles.checkRow} onPress={() => toggleCert(c)}>
                  <View style={[styles.checkbox, certs.includes(c) && styles.checkboxOn]}>
                    {certs.includes(c) && <Ionicons name="checkmark" size={10} color="#fff" />}
                  </View>
                  <Text style={styles.checkText}>{c}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ── CARDS ── */}
        <View style={styles.cardsCol}>
          <Text style={styles.resultsTitle}>Top Rated Near You</Text>
          <Text style={styles.resultsCount}>
            Showing {resultados.length} high-performance professionals
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: Spacing[4] }}>
            <View style={styles.cardsGrid}>
              {resultados.map(prof => (
                <View key={prof.id} style={styles.card}>
                  {/* Header: avatar + badge */}
                  <View style={styles.cardTop}>
                    <View style={styles.avatar}>
                      <Ionicons name="person" size={26} color={Colors.primary[400]} />
                    </View>
                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingStar}>★</Text>
                      <Text style={styles.ratingNum}>{prof.rating.toFixed(1)}</Text>
                    </View>
                  </View>

                  <Text style={styles.cardNombre}>{prof.nombre}</Text>
                  <Text style={styles.cardRol}>{prof.rol}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>{prof.descripcion}</Text>

                  {/* Chips */}
                  <View style={styles.chips}>
                    {prof.habilidades.map(h => (
                      <View key={h} style={styles.chip}>
                        <Text style={styles.chipTxt}>{h}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Footer */}
                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.startingAt}>STARTING AT</Text>
                      <Text style={styles.precio}>${prof.precio}/hr</Text>
                    </View>
                    <Pressable style={styles.viewBtn} onPress={() => {}}>
                      <Text style={styles.viewBtnTxt}>View{'\n'}Profile</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* ── MAPA (placeholder) ── */}
        {!IS_MOBILE && (
          <View style={styles.mapCol}>
            <View style={styles.mapPlaceholder}>
              {/* Pins simulados */}
              {[
                { top: '30%', left: '60%' },
                { top: '55%', left: '20%' },
                { top: '70%', left: '75%' },
              ].map((pos, i) => (
                <View key={i} style={[styles.mapPin, { top: pos.top as any, left: pos.left as any }]}>
                  <Ionicons name="location" size={28} color={Colors.primary[600]} />
                </View>
              ))}

              {/* Controles del mapa */}
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
    </View>
  );
}

// ── Estilos ──────────────────────────────────────────────────
const FILTER_W = 180;
const MAP_W    = SCREEN_W * 0.30;
const CARDS_W  = IS_MOBILE ? SCREEN_W : SCREEN_W - FILTER_W - MAP_W;
const CARD_W   = IS_MOBILE ? '100%' : (CARDS_W - Spacing[4] * 3) / 2;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.neutral[100] },

  // ── Navbar morada ──
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    height: 56,
  },
  navBrand:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navLogo:     { width: 28, height: 28 },
  navLogoText: { ...Typography.styles.h5, color: '#fff', letterSpacing: 0.3 },

  navLinks: { flexDirection: 'row', gap: Spacing[5] },
  navLink:  { ...Typography.styles.body, color: 'rgba(255,255,255,0.75)' },
  navLinkActive: { color: '#fff', fontWeight: '600' },

  navRight:   { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  navIconBtn: { padding: 4 },
  navAvatar:  {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primary[200],
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
  },
  navUserRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  navUserName:{ ...Typography.styles.body, color: '#fff', fontWeight: '600' },

  // ── Body ──
  body: { flex: 1, flexDirection: 'row' },

  // ── Filtros ──
  filtersPanel: {
    width: FILTER_W,
    backgroundColor: Colors.background.card,
    borderRightWidth: 1,
    borderRightColor: Colors.border.default,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  filterTitle: { ...Typography.styles.h5, color: Colors.text.primary },
  filterReset: { ...Typography.styles.bodySm, color: Colors.primary[600] },

  filterGroup: { marginBottom: Spacing[4] },
  filterLabel: { ...Typography.styles.overline, color: Colors.text.secondary, marginBottom: Spacing[2] },

  checkRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  checkbox:    {
    width: 15, height: 15, borderRadius: 3,
    borderWidth: 1.5, borderColor: Colors.border.default,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn:  { backgroundColor: Colors.primary[600], borderColor: Colors.primary[600] },
  checkText:   { ...Typography.styles.bodySm, color: Colors.text.primary },

  selectBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: Colors.border.default,
    borderRadius: Radius.input, paddingHorizontal: 10, paddingVertical: 7,
  },
  selectText: { ...Typography.styles.bodySm, color: Colors.text.primary },

  locBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: Colors.border.default,
    borderRadius: Radius.input, paddingHorizontal: 10, paddingVertical: 7,
  },
  locInput: { flex: 1, ...Typography.styles.bodySm, color: Colors.text.primary },

  ratingRow: { flexDirection: 'row', gap: 6 },
  ratingChip: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.border.default,
    backgroundColor: '#fff',
  },
  ratingChipOn:    { backgroundColor: Colors.primary[600], borderColor: Colors.primary[600] },
  ratingChipTxt:   { ...Typography.styles.label, color: Colors.text.secondary, fontSize: 11 },
  ratingChipTxtOn: { color: '#fff' },

  // ── Cards ──
  cardsCol: {
    width: IS_MOBILE ? '100%' : CARDS_W,
    padding: Spacing[4],
  },
  resultsTitle: { ...Typography.styles.h3, color: Colors.text.primary },
  resultsCount: { ...Typography.styles.body, color: Colors.text.secondary, marginTop: 2 },

  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
  },

  card: {
    width: CARD_W as any,
    backgroundColor: Colors.background.card,
    borderRadius: Radius.card,
    padding: Spacing[4],
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border.default,
    gap: Spacing[2],
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  avatar: {
    width: 52, height: 52, borderRadius: Radius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary[100],
  },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.primary[600],
    borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  ratingStar:  { color: '#FCD34D', fontSize: 11 },
  ratingNum:   { ...Typography.styles.label, color: '#fff', fontSize: 12 },

  cardNombre: { ...Typography.styles.h5, color: Colors.text.primary, fontSize: 15 },
  cardRol:    { ...Typography.styles.label, color: Colors.primary[600], fontSize: 12 },
  cardDesc:   { ...Typography.styles.bodySm, color: Colors.text.secondary, lineHeight: 18 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  chip:  {
    backgroundColor: Colors.primary[50],
    borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.primary[100],
  },
  chipTxt: { ...Typography.styles.caption, color: Colors.primary[700], fontWeight: '600' },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing[2],
    paddingTop: Spacing[2],
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
  },
  startingAt: { ...Typography.styles.overline, color: Colors.text.disabled, fontSize: 8 },
  precio:     { ...Typography.styles.h4, color: Colors.text.primary, fontSize: 18 },

  viewBtn: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.button,
    ...Shadow.brand,
  },
  viewBtnTxt: { ...Typography.styles.btn, color: '#fff', textAlign: 'center', fontSize: 12 },

  // ── Mapa ──
  mapCol: { width: MAP_W, backgroundColor: Colors.neutral[200] },
  mapPlaceholder: { flex: 1, position: 'relative', backgroundColor: '#e8eaed' },
  mapPin: { position: 'absolute' },
  mapControls: {
    position: 'absolute',
    right: 12, bottom: 80,
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    ...Shadow.sm,
    overflow: 'hidden',
  },
  mapControlBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 1, borderBottomColor: Colors.border.default,
  },
  mapControlTxt: { fontSize: 18, color: Colors.text.secondary, fontWeight: '300' },

  // ── Footer ──
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.background.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
  },
  footerLogo: { ...Typography.styles.label, color: Colors.text.primary, fontSize: 13 },
  footerTag:  { ...Typography.styles.caption, color: Colors.text.secondary, flex: 1 },
  footerLinks:{ flexDirection: 'row', gap: Spacing[4] },
  footerLink: { ...Typography.styles.caption, color: Colors.text.secondary },
  footerCopy: { ...Typography.styles.caption, color: Colors.text.disabled },
});
