import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import NavbarCliente from '../../../components/NavbarCliente';
import { Colors } from '../../../theme/Colors';
import { Radius, Shadow, Spacing } from '../../../theme/Spacing';
import { Typography } from '../../../theme/Typography';

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
    descripcion: 'Building high-performance React applications.',
    habilidades: ['React', 'Node.js', 'Next.js', 'AWS'],
  },
  {
    id: '3',
    nombre: 'Borrman M.',
    rol: 'UX Strategist & Researcher',
    rating: 5.0,
    precio: 140,
    descripcion: 'Helping startups validate ideas through rigorous testing.',
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

const EXPERIENCIAS = ['Junior (0-2)', 'Mid-Level (3-5)', 'Senior (6+)'];
const RATINGS_OPTS = ['3+', '4+', '4.5+'];
const CERTS_OPTS   = ['Google UX', 'NN/g'];

export default function BuscarScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [busqueda,     setBusqueda]     = useState('');
  const [experiencias, setExperiencias] = useState<string[]>(['Mid-Level (3-5)']);
  const [ratingMin,    setRatingMin]    = useState('4+');
  const [certs,        setCerts]        = useState<string[]>([]);
  const [ubicacion,    setUbicacion]    = useState('');

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
      {/* ── NAVBAR GLOBAL ── */}
      <NavbarCliente />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
        {/* ── SEARCH BAR (Premium Floating) ── */}
        <View style={styles.searchBarWrap}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputRow}>
              <Ionicons name="search" size={22} color={Colors.primary[600]} />
              <TextInput
                placeholder="¿Qué servicio buscas? Ej. Diseño UI, Desarrollo React"
                placeholderTextColor={Colors.text.disabled}
                style={styles.searchInput}
                value={busqueda}
                onChangeText={setBusqueda}
              />
            </View>
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
                    placeholder="Ubicación"
                    placeholderTextColor={Colors.text.disabled}
                    style={styles.locInputMobile}
                    value={ubicacion}
                    onChangeText={setUbicacion}
                  />
                </View>
                {RATINGS_OPTS.map(r => (
                  <Pressable key={r} style={[styles.ratingChipMobile, ratingMin === r && styles.ratingChipOnMobile]} onPress={() => setRatingMin(r)}>
                    <Text style={[styles.ratingChipTxtMobile, ratingMin === r && styles.ratingChipTxtOnMobile]}>{r}★</Text>
                  </Pressable>
                ))}
                <Pressable onPress={() => { setRatingMin('3+'); setUbicacion(''); setExperiencias([]); setCerts([]); }} style={styles.filterResetBtnMobile}>
                   <Text style={styles.filterResetTxtMobile}>Limpiar</Text>
                </Pressable>
              </ScrollView>
            </View>
          ) : (
            <View style={[styles.filtersPanel, { width: 280 }]}>
              <View style={styles.filterHeader}>
                <Text style={styles.filterTitle}>Filtros Avanzados</Text>
                <Pressable onPress={() => { setRatingMin('3+'); setUbicacion(''); setExperiencias([]); setCerts([]); }}>
                  <Text style={styles.filterReset}>Limpiar</Text>
                </Pressable>
              </View>

              {/* Experiencia */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>EXPERIENCIA</Text>
                {EXPERIENCIAS.map(exp => (
                  <Pressable key={exp} style={styles.checkRow} onPress={() => toggleExp(exp)}>
                    <View style={[styles.checkbox, experiencias.includes(exp) && styles.checkboxOn]}>
                      {experiencias.includes(exp) && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                    <Text style={styles.checkText}>{exp}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Ubicación */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>UBICACIÓN</Text>
                <View style={styles.locBox}>
                  <Ionicons name="location-outline" size={16} color={Colors.primary[600]} />
                  <TextInput
                    placeholder="Ciudad o Remoto"
                    placeholderTextColor={Colors.text.disabled}
                    style={styles.locInput}
                    value={ubicacion}
                    onChangeText={setUbicacion}
                  />
                </View>
              </View>

              {/* Rating */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>RATING MÍNIMO</Text>
                <View style={styles.ratingRow}>
                  {RATINGS_OPTS.map(r => (
                    <Pressable key={r} style={[styles.ratingChip, ratingMin === r && styles.ratingChipOn]} onPress={() => setRatingMin(r)}>
                      <Text style={[styles.ratingChipTxt, ratingMin === r && styles.ratingChipTxtOn]}>{r}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Certificaciones */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>CERTIFICACIONES</Text>
                {CERTS_OPTS.map(c => (
                  <Pressable key={c} style={styles.checkRow} onPress={() => toggleCert(c)}>
                    <View style={[styles.checkbox, certs.includes(c) && styles.checkboxOn]}>
                      {certs.includes(c) && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                    <Text style={styles.checkText}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* ── RESULTADOS ── */}
          <View style={[styles.cardsCol, { flex: 1 }]}>
            <Text style={styles.resultsTitle}>Mejores calificados cerca de ti</Text>
            <Text style={styles.resultsCount}>
              Mostrando {resultados.length} expertos de alto rendimiento
            </Text>

            <View style={styles.cardsGrid}>
              {resultados.map(prof => (
                <Pressable key={prof.id} style={[styles.card, { width: isMobile ? '100%' : '48%', minWidth: isMobile ? 'auto' : 320, flex: isMobile ? 0 : 1 }]} onPress={() => router.push(`/(cliente)/profesionista/${prof.id}` as any)}>
                  {/* Header: avatar + badge */}
                  <View style={styles.cardHeader}>
                    <View style={styles.avatarContainer}>
                      <View style={styles.avatar}>
                        <Ionicons name="person" size={26} color={Colors.primary[500]} />
                      </View>
                    </View>
                    <View style={styles.cardHeaderInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={styles.cardNombre} numberOfLines={1}>{prof.nombre}</Text>
                        <View style={styles.ratingBadge}>
                          <Ionicons name="star" size={11} color="#F59E0B" />
                          <Text style={styles.ratingNum}>{prof.rating.toFixed(1)}</Text>
                        </View>
                      </View>
                      <Text style={styles.cardRol}>{prof.rol}</Text>
                    </View>
                  </View>

                  <Text style={styles.cardDesc} numberOfLines={2}>{prof.descripcion}</Text>

                  {/* Chips */}
                  <View style={styles.chips}>
                    {prof.habilidades.map(h => (
                      <View key={h} style={styles.chip}>
                        <Text style={styles.chipTxt}>{h}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Footer / Acción */}
                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.startingAt}>TARIFA DESDE</Text>
                      <Text style={styles.precio}>${prof.precio}<Text style={styles.precioSub}>/hr</Text></Text>
                    </View>
                    <View style={styles.viewBtn}>
                      <Text style={styles.viewBtnTxt}>Ver Perfil</Text>
                      <Ionicons name="arrow-forward" size={16} color="#fff" />
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* ── MAPA placeholder ── */}
          {!isMobile && (
            <View style={[styles.mapCol, { width: '30%' }]}>
              <View style={styles.mapPlaceholder}>
                {/* Pins simulados */}
                {[
                  { top: '30%', left: '60%' },
                  { top: '55%', left: '20%' },
                  { top: '70%', left: '75%' },
                ].map((pos, i) => (
                  <View key={i} style={[styles.mapPin, { top: pos.top as any, left: pos.left as any }]}>
                    <Ionicons name="location" size={36} color={Colors.primary[600]} />
                    <View style={styles.mapPinDot} />
                  </View>
                ))}

                <View style={styles.mapControls}>
                  <Pressable style={styles.mapControlBtn}><Text style={styles.mapControlTxt}>+</Text></Pressable>
                  <Pressable style={styles.mapControlBtn}><Text style={styles.mapControlTxt}>−</Text></Pressable>
                  <Pressable style={styles.mapControlBtn}><Ionicons name="locate-outline" size={20} color={Colors.text.secondary} /></Pressable>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ── FOOTER ── */}
        <View style={styles.footer}>
          <View style={styles.footerBrand}>
            <Text style={styles.footerLogo}>ProFinder</Text>
            <Text style={styles.footerTag}>Connecting visionaries with experts.</Text>
          </View>
          <View style={styles.footerLinks}>
            {['Privacy', 'Terms', 'Support'].map(l => (
              <Pressable key={l}><Text style={styles.footerLink}>{l}</Text></Pressable>
            ))}
          </View>
          <Text style={styles.footerCopy}>© 2024 ProFinder.</Text>
        </View>
      </ScrollView>
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

  body: { flex: 1, flexDirection: 'row', maxWidth: 1600, alignSelf: 'center', width: '100%' },

  // Filtros Mobile
  mobileFiltersWrapper: { backgroundColor: '#fff', paddingVertical: Spacing[3] },
  mobileFiltersScroll: { paddingHorizontal: Spacing[4], gap: Spacing[3], alignItems: 'center' },
  locBoxMobile: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F3F4F6', borderRadius: 999, paddingHorizontal: 16, height: 38 },
  locInputMobile: { minWidth: 100, ...Typography.styles.bodySm, color: Colors.text.primary, fontWeight: '500' },
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
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  checkbox: { width: 18, height: 18, borderRadius: 4, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: Colors.primary[600] },
  checkText: { ...Typography.styles.body, color: Colors.text.primary, fontSize: 15 },

  // Resultados
  cardsCol: { padding: Spacing[5], backgroundColor: '#F8F9FA' },
  resultsTitle: { ...Typography.styles.h3, color: Colors.text.primary, fontWeight: '800', letterSpacing: -0.5 },
  resultsCount: { ...Typography.styles.body, color: Colors.text.secondary, marginTop: 4, marginBottom: 16 },
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[4] },

  // Premium Card
  card: { backgroundColor: '#fff', borderRadius: 20, padding: Spacing[5], ...Shadow.md, gap: Spacing[4] },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary[50], alignItems: 'center', justifyContent: 'center' },
  cardHeaderInfo: { flex: 1 },
  cardNombre: { ...Typography.styles.h5, color: Colors.text.primary, fontWeight: '700', fontSize: 17 },
  cardRol: { ...Typography.styles.label, color: Colors.primary[600], fontSize: 13, marginTop: 2, fontWeight: '600' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  ratingNum: { ...Typography.styles.caption, color: '#92400E', fontWeight: '800', fontSize: 11 },
  cardDesc: { ...Typography.styles.body, color: Colors.text.secondary, lineHeight: 22, fontSize: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: '#F3F4F6', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  chipTxt: { ...Typography.styles.caption, color: Colors.text.secondary, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4, paddingTop: Spacing[4] },
  startingAt: { ...Typography.styles.overline, color: Colors.text.disabled, fontSize: 10, letterSpacing: 0.5, marginBottom: 2 },
  precio: { ...Typography.styles.h3, color: Colors.text.primary, fontWeight: '800' },
  precioSub: { fontSize: 14, color: Colors.text.secondary, fontWeight: '500' },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary[600], paddingHorizontal: 20, height: 40, borderRadius: 999, ...Shadow.brand },
  viewBtnTxt: { ...Typography.styles.btn, color: '#fff', fontSize: 13, fontWeight: '700' },

  // Mapa
  mapCol: { backgroundColor: '#E5E7EB' },
  mapPlaceholder: { flex: 1, position: 'relative', backgroundColor: '#F3F4F6' },
  mapPin: { position: 'absolute', alignItems: 'center' },
  mapPinDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#000', opacity: 0.2, marginTop: -4 },
  mapControls: { position: 'absolute', right: 16, bottom: 24, backgroundColor: '#fff', borderRadius: 16, ...Shadow.md, overflow: 'hidden' },
  mapControlBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  mapControlTxt: { fontSize: 24, color: Colors.text.secondary, fontWeight: '300' },

  // Footer
  footer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: Spacing[4], paddingHorizontal: Spacing[6], paddingVertical: Spacing[4], backgroundColor: '#fff' },
  footerBrand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  footerLogo: { ...Typography.styles.label, color: Colors.text.primary, fontSize: 14, fontWeight: '700' },
  footerTag: { ...Typography.styles.caption, color: Colors.text.secondary },
  footerLinks: { flexDirection: 'row', gap: Spacing[5] },
  footerLink: { ...Typography.styles.caption, color: Colors.text.secondary, fontWeight: '500' },
  footerCopy: { ...Typography.styles.caption, color: Colors.text.disabled },
});
