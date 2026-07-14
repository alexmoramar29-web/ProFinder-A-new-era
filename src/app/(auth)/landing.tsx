// ============================================================
// ProFinder — Landing Page
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../theme/Colors';
import { Radius, Shadow, Spacing } from '../../theme/Spacing';
import { Typography } from '../../theme/Typography';

const { width: SCREEN_W } = Dimensions.get('window');
const IS_MOBILE = SCREEN_W < 768;

export default function LandingScreen() {
  const router    = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  // ── Guardián de sesión ──────────────────────────────────────
  // Si ya hay sesión activa, redirige directo sin mostrar la landing
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return; // Sin sesión → quedarse en landing

      const userId = session.user.id;

      // ¿Es cliente?
      const { data: cliente } = await supabase
        .from('users')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (cliente) {
        router.replace('/(cliente)');
        return;
      }

      // ¿Es profesionista?
      router.replace('/(profesionista)');
    });
  }, []);

  const irALogin    = () => router.push('/(auth)/sign-in');
  const irARegistro = () => router.push('/(auth)/sign-up');

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.root}
      showsVerticalScrollIndicator={false}
      stickyHeaderIndices={[0]}
    >

      {/* ══════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════ */}
      <View style={styles.navbar}>
        <Pressable style={styles.navLogo} onPress={() => scrollRef.current?.scrollTo({ y: 0 })}>
          <Image
            source={require('../../../assets/images/logo.png')}
            style={styles.navLogoImg}
            resizeMode="contain"
          />
          <Text style={styles.navLogoText}>ProFinder</Text>
        </Pressable>

        {!IS_MOBILE && (
          <View style={styles.navLinks}>
            <Pressable onPress={() => router.push('/(cliente)')}><Text style={styles.navLink}>Find Professionals</Text></Pressable>
            <Pressable><Text style={styles.navLink}>How it works</Text></Pressable>
            <Pressable><Text style={styles.navLink}>Messages</Text></Pressable>
            <Pressable><Text style={styles.navLink}>Appointments</Text></Pressable>
          </View>
        )}

        <View style={styles.navActions}>
          <Pressable onPress={irALogin} style={styles.navBtnOutline}>
            <Text style={styles.navBtnOutlineText}>Iniciar sesión</Text>
          </Pressable>
          <Pressable onPress={irARegistro} style={styles.navBtnPrimary}>
            <Text style={styles.navBtnPrimaryText}>Registrarse</Text>
          </Pressable>
        </View>
      </View>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <View style={styles.hero}>
        <View style={[styles.heroLeft, IS_MOBILE && styles.heroLeftMobile]}>
          <View style={styles.heroBadge}>
            <Ionicons name="shield-checkmark" size={13} color={Colors.primary[600]} />
            <Text style={styles.heroBadgeText}>TRUSTED BY 10,000+ PROFESSIONALS</Text>
          </View>

          <Text style={styles.heroTitle}>
            Find and Book the{'\n'}
            <Text style={styles.heroTitleAccent}>Right</Text>
            {' '}Professional{'\n'}
            for You
          </Text>

          <Text style={styles.heroSubtitle}>
            Connect with verified experts across tech, design, marketing, and strategy.
            ProFinder handles the sourcing so you can focus on the interview.
          </Text>

          <View style={styles.heroButtons}>
            <Pressable onPress={irARegistro} style={styles.heroBtnPrimary}>
              <Text style={styles.heroBtnPrimaryText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.text.inverse} />
            </Pressable>
            <Pressable style={styles.heroBtnGhost}>
              <Text style={styles.heroBtnGhostText}>View Showcase</Text>
            </Pressable>
          </View>

          <View style={styles.socialProof}>
            <View style={styles.avatarStack}>
              {['#7C3AED','#8B5CF6','#A78BFA'].map((c, i) => (
                <View key={i} style={[styles.avatarCircle, { backgroundColor: c, marginLeft: i === 0 ? 0 : -10 }]}>
                  <Ionicons name="person" size={12} color="#fff" />
                </View>
              ))}
            </View>
            <Text style={styles.socialProofText}>Join our growing community of experts</Text>
          </View>
        </View>

        {!IS_MOBILE && (
          <View style={styles.heroRight}>
            <View style={styles.mockupFrame}>
              <View style={styles.mockupBar}>
                <View style={styles.mockupBarDot} />
                <View style={[styles.mockupBarDot, { backgroundColor: '#FCD34D' }]} />
                <View style={[styles.mockupBarDot, { backgroundColor: '#34D399' }]} />
                <View style={styles.mockupBarUrl}>
                  <Text style={styles.mockupBarUrlText}>profinder.app</Text>
                </View>
              </View>
              <View style={styles.mockupContent}>
                <View style={styles.mockupNav}>
                  <Text style={styles.mockupNavLogo}>ProFinder</Text>
                  <View style={styles.mockupNavLinks}>
                    {['Find Pros','How it works','About'].map(l => (
                      <Text key={l} style={styles.mockupNavLink}>{l}</Text>
                    ))}
                  </View>
                </View>
                <View style={styles.mockupHero}>
                  <Text style={styles.mockupHeroTitle}>Find and Book the{'\n'}
                    <Text style={{ color: Colors.primary[600] }}>Right</Text> Professional
                  </Text>
                  <Pressable style={styles.mockupBtn}>
                    <Text style={styles.mockupBtnText}>Get Started →</Text>
                  </Pressable>
                </View>
                <View style={styles.mockupCards}>
                  {[
                    { name: 'Ana S.', role: 'UX Designer', rating: '4.9', color: Colors.primary[200] },
                    { name: 'Marco V.', role: 'Full Stack Dev', rating: '4.8', color: Colors.primary[300] },
                  ].map((p, i) => (
                    <View key={i} style={styles.mockupCard}>
                      <View style={[styles.mockupAvatar, { backgroundColor: p.color }]}>
                        <Ionicons name="person" size={10} color={Colors.primary[700]} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.mockupCardName}>{p.name}</Text>
                        <Text style={styles.mockupCardRole}>{p.role}</Text>
                      </View>
                      <Text style={styles.mockupCardRating}>★ {p.rating}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* ══════════════════════════════════════════
          HOW PROFINDER WORKS
      ══════════════════════════════════════════ */}
      <View style={styles.howSection}>
        <Text style={styles.sectionEyebrow}>PROCESO SIMPLE</Text>
        <Text style={styles.sectionTitle}>
          How <Text style={styles.sectionTitleAccent}>ProFinder</Text> Works
        </Text>
        <Text style={styles.sectionSubtitle}>
          Three simple steps to connect with high-caliber talent ready to contribute to your success.
        </Text>
        <View style={styles.stepsRow}>
          {[
            { icon: 'search-outline' as const, step: '01', title: 'Look for professionals', desc: 'Search through our curated marketplace of professionals using advanced filters for skills, experience, and location.', cta: 'Explore Search' },
            { icon: 'person-circle-outline' as const, step: '02', title: 'Read their profiles', desc: 'Dive deep into verified portfolio, client testimonials, and technical assessment results for every single candidate.', cta: 'View Sample' },
            { icon: 'calendar-outline' as const, step: '03', title: 'Book an interview', desc: 'Sync with their calendar and book a virtual meeting directly through our platform in just a few clicks.', cta: 'Book Now' },
          ].map((s, i) => (
            <View key={i} style={[styles.stepCard, IS_MOBILE && styles.stepCardMobile]}>
              <View style={styles.stepIconWrap}>
                <Ionicons name={s.icon} size={26} color={Colors.primary[600]} />
              </View>
              <Text style={styles.stepNumber}>{s.step}</Text>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepDesc}>{s.desc}</Text>
              <Pressable style={styles.stepCta}>
                <Text style={styles.stepCtaText}>{s.cta}</Text>
                <Ionicons name="arrow-forward-outline" size={13} color={Colors.primary[600]} />
              </Pressable>
            </View>
          ))}
        </View>
      </View>

      {/* ══════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════ */}
      <View style={styles.ctaBanner}>
        <Text style={styles.ctaTitle}>Ready to hire your next superstar?</Text>
        <Text style={styles.ctaSubtitle}>
          Join thousands of companies already finding talent through ProFinder.
        </Text>
        <View style={styles.ctaButtons}>
          <Pressable onPress={irARegistro} style={styles.ctaBtnWhite}>
            <Text style={styles.ctaBtnWhiteText}>Start Hiring</Text>
          </Pressable>
          <Pressable style={styles.ctaBtnOutline}>
            <Text style={styles.ctaBtnOutlineText}>Browse Talent</Text>
          </Pressable>
        </View>
      </View>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerLogo}>ProFinder</Text>
          <Text style={styles.footerTagline}>Connecting visionaries with experts.</Text>
          <Text style={styles.footerCopy}>© 2024 ProFinder. All rights reserved.</Text>
        </View>
        <View style={styles.footerLinks}>
          {['Privacy', 'Terms', 'Support', 'Careers', 'Press'].map(l => (
            <Pressable key={l}><Text style={styles.footerLink}>{l}</Text></Pressable>
          ))}
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background.app },

  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing[6], paddingVertical: Spacing[3],
    ...Shadow.sm,
  },
  navLogo:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navLogoImg:      { width: 44, height: 44 },
  navLogoText:     { ...Typography.styles.h5, color: '#fff', letterSpacing: 0.3 },
  navLinks:        { flexDirection: 'row', gap: Spacing[6] },
  navLink:         { ...Typography.styles.body, color: 'rgba(255,255,255,0.80)' },
  navActions:      { flexDirection: 'row', gap: Spacing[2], alignItems: 'center' },
  navBtnOutline:   { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.button, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)' },
  navBtnOutlineText: { ...Typography.styles.btn, color: '#fff' },
  navBtnPrimary:   { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.button, backgroundColor: '#fff' },
  navBtnPrimaryText: { ...Typography.styles.btn, color: Colors.primary[600] },

  hero: {
    flexDirection: IS_MOBILE ? 'column' : 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingVertical: IS_MOBILE ? Spacing[8] : Spacing[12],
    gap: Spacing[8], maxWidth: 1100, alignSelf: 'center', width: '100%',
  },
  heroLeft:       { flex: 1, gap: Spacing[5] },
  heroLeftMobile: { alignItems: 'center' },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: Colors.primary[50], borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.primary[200],
  },
  heroBadgeText:    { ...Typography.styles.overline, color: Colors.primary[600], fontSize: 10 },
  heroTitle:        { ...Typography.styles.h1, color: Colors.text.primary, fontSize: IS_MOBILE ? 32 : 44, lineHeight: IS_MOBILE ? 42 : 56 },
  heroTitleAccent:  { color: Colors.primary[600] },
  heroSubtitle:     { ...Typography.styles.bodyLg, color: Colors.text.secondary, maxWidth: 440, lineHeight: 26 },
  heroButtons:      { flexDirection: 'row', gap: Spacing[3], flexWrap: 'wrap' },
  heroBtnPrimary:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary[600], paddingHorizontal: 22, paddingVertical: 13, borderRadius: Radius.button, ...Shadow.brand },
  heroBtnPrimaryText: { ...Typography.styles.btnLg, color: '#fff' },
  heroBtnGhost:     { paddingHorizontal: 22, paddingVertical: 13, borderRadius: Radius.button, borderWidth: 1.5, borderColor: Colors.border.default },
  heroBtnGhostText: { ...Typography.styles.btnLg, color: Colors.text.primary },
  socialProof:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarStack:      { flexDirection: 'row' },
  avatarCircle:     { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  socialProofText:  { ...Typography.styles.bodySm, color: Colors.text.secondary },

  heroRight:       { flex: 1, alignItems: 'center' },
  mockupFrame:     { width: '100%', maxWidth: 420, backgroundColor: Colors.background.card, borderRadius: Radius.xl, overflow: 'hidden', ...Shadow.lg, borderWidth: 1, borderColor: Colors.border.default },
  mockupBar:       { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.neutral[100], paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  mockupBarDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FC5753' },
  mockupBarUrl:    { flex: 1, backgroundColor: '#fff', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 6 },
  mockupBarUrlText:{ ...Typography.styles.caption, color: Colors.text.secondary, textAlign: 'center' },
  mockupContent:   { padding: 16, gap: 12 },
  mockupNav:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mockupNavLogo:   { ...Typography.styles.label, color: Colors.primary[600], fontSize: 13 },
  mockupNavLinks:  { flexDirection: 'row', gap: 8 },
  mockupNavLink:   { ...Typography.styles.caption, color: Colors.text.secondary },
  mockupHero:      { backgroundColor: Colors.primary[50], borderRadius: Radius.md, padding: 14, gap: 8 },
  mockupHeroTitle: { ...Typography.styles.bodySm, color: Colors.text.primary, fontWeight: '700', lineHeight: 18 },
  mockupBtn:       { backgroundColor: Colors.primary[600], borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
  mockupBtnText:   { ...Typography.styles.caption, color: '#fff', fontWeight: '600' },
  mockupCards:     { gap: 8 },
  mockupCard:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.neutral[50], borderRadius: Radius.md, padding: 10, borderWidth: 1, borderColor: Colors.border.default },
  mockupAvatar:    { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  mockupCardName:  { ...Typography.styles.label, color: Colors.text.primary, fontSize: 11 },
  mockupCardRole:  { ...Typography.styles.caption, color: Colors.text.secondary },
  mockupCardRating:{ ...Typography.styles.label, color: Colors.primary[600], fontSize: 11 },

  howSection:        { paddingHorizontal: Spacing[6], paddingVertical: Spacing[12], alignItems: 'center', backgroundColor: Colors.background.card },
  sectionEyebrow:    { ...Typography.styles.overline, color: Colors.primary[600], marginBottom: Spacing[2] },
  sectionTitle:      { ...Typography.styles.h2, color: Colors.text.primary, textAlign: 'center', marginBottom: Spacing[3] },
  sectionTitleAccent:{ color: Colors.primary[600] },
  sectionSubtitle:   { ...Typography.styles.bodyLg, color: Colors.text.secondary, textAlign: 'center', maxWidth: 520, marginBottom: Spacing[10] },
  stepsRow:          { flexDirection: IS_MOBILE ? 'column' : 'row', gap: Spacing[5], width: '100%', maxWidth: 1000 },
  stepCard:          { flex: 1, backgroundColor: Colors.background.app, borderRadius: Radius.card, padding: Spacing[6], gap: Spacing[2], borderWidth: 1, borderColor: Colors.border.default },
  stepCardMobile:    { width: '100%' },
  stepIconWrap:      { width: 48, height: 48, borderRadius: Radius.full, backgroundColor: Colors.primary[50], alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[2] },
  stepNumber:        { ...Typography.styles.overline, color: Colors.primary[400] },
  stepTitle:         { ...Typography.styles.h5, color: Colors.text.primary },
  stepDesc:          { ...Typography.styles.body, color: Colors.text.secondary, lineHeight: 22 },
  stepCta:           { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing[2] },
  stepCtaText:       { ...Typography.styles.btn, color: Colors.primary[600] },

  ctaBanner:         { margin: Spacing[6], borderRadius: Radius['2xl'], backgroundColor: Colors.primary[600], padding: Spacing[10], alignItems: 'center', gap: Spacing[4], ...Shadow.brand },
  ctaTitle:          { ...Typography.styles.h2, color: '#fff', textAlign: 'center' },
  ctaSubtitle:       { ...Typography.styles.bodyLg, color: Colors.primary[200], textAlign: 'center', maxWidth: 460 },
  ctaButtons:        { flexDirection: 'row', gap: Spacing[3], marginTop: Spacing[2] },
  ctaBtnWhite:       { backgroundColor: '#fff', paddingHorizontal: 22, paddingVertical: 13, borderRadius: Radius.button },
  ctaBtnWhiteText:   { ...Typography.styles.btnLg, color: Colors.primary[600] },
  ctaBtnOutline:     { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', paddingHorizontal: 22, paddingVertical: 13, borderRadius: Radius.button },
  ctaBtnOutlineText: { ...Typography.styles.btnLg, color: '#fff' },

  footer:        { flexDirection: IS_MOBILE ? 'column' : 'row', justifyContent: 'space-between', alignItems: IS_MOBILE ? 'flex-start' : 'center', paddingHorizontal: Spacing[6], paddingVertical: Spacing[6], borderTopWidth: 1, borderTopColor: Colors.border.default, gap: Spacing[4] },
  footerLeft:    { gap: 4 },
  footerLogo:    { ...Typography.styles.h5, color: Colors.text.primary },
  footerTagline: { ...Typography.styles.body, color: Colors.text.secondary },
  footerCopy:    { ...Typography.styles.caption, color: Colors.text.disabled },
  footerLinks:   { flexDirection: 'row', gap: Spacing[5], flexWrap: 'wrap' },
  footerLink:    { ...Typography.styles.body, color: Colors.text.secondary },
});
