// ============================================================
// ProFinder — Landing Page
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import i18n from '../../i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Linking,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../theme/Colors';
import { Radius, Shadow, Spacing } from '../../theme/Spacing';
import { Typography } from '../../theme/Typography';

const { width: INITIAL_WIDTH } = Dimensions.get('window');
const INITIAL_IS_MOBILE = INITIAL_WIDTH < 900;

export default function LandingScreen() {
  const { width: SCREEN_W } = useWindowDimensions();
  const IS_MOBILE = SCREEN_W < 768;
  const HIDE_NAV_LINKS = SCREEN_W < 1050;
  const CENTER_PROS = SCREEN_W >= 1280;
  const styles = React.useMemo(() => getStyles(IS_MOBILE), [IS_MOBILE]);

  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router    = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [howItWorksY, setHowItWorksY] = useState(0);
  const [prosY, setProsY] = useState(0);
  const [featuresY, setFeaturesY] = useState(0);
  const [infoY, setInfoY] = useState(0);

  const cambiarIdioma = async () => {
    const nuevoIdioma = i18n.language === 'es' ? 'en' : 'es';
    await i18n.changeLanguage(nuevoIdioma);
    await AsyncStorage.setItem('user-language', nuevoIdioma);
  };

  // ── Guardián de sesión inteligente ─────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return; // Sin sesión → quedarse en landing

      const userId = session.user.id;
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const lastPortal = await AsyncStorage.getItem('last_portal');

      const pendingPortal = await AsyncStorage.getItem('pending_oauth_portal');
      if (pendingPortal) {
        if (Platform.OS === 'web') {
          // Están a mitad de un flujo OAuth en web. No interrumpir, enviarlos a sign-in.
          router.replace('/(auth)/sign-in');
          return;
        } else {
          // En móvil, si están en landing es porque cancelaron el in-app browser
          await AsyncStorage.removeItem('pending_oauth_portal');
          await AsyncStorage.removeItem('pending_oauth_provider');
        }
      }

      // 1. Si tienen una preferencia explícita y existen en esa base de datos
      if (lastPortal === 'profesionista') {
        const { data: prof } = await supabase.from('professionals').select('prof_id').eq('prof_id', userId).maybeSingle();
        if (prof) { router.replace('/(profesionista)'); return; }
      }
      if (lastPortal === 'cliente') {
        const { data: cliente } = await supabase.from('users').select('user_id').eq('user_id', userId).maybeSingle();
        if (cliente) { router.replace('/(cliente)'); return; }
      }

      // 2. Si vienen de confirmar su correo (tienen rol_temporal en metadata)
      const rolOriginal = session.user.user_metadata?.rol_temporal;
      if (rolOriginal === 'profesionista') {
        // Redirigir a sign-in para que la lógica termine de crear su perfil si no existe
        const { data: profFallback } = await supabase.from('professionals').select('prof_id').eq('prof_id', userId).maybeSingle();
        if (!profFallback) {
          await AsyncStorage.setItem('pending_oauth_portal', 'profesionista');
          await AsyncStorage.setItem('pending_oauth_provider', session.user.app_metadata?.provider || 'email');
          router.replace('/(auth)/sign-in');
          return;
        }
        router.replace('/(profesionista)');
        return;
      }

      if (rolOriginal === 'cliente') {
        const { data: clienteFallback } = await supabase.from('users').select('user_id').eq('user_id', userId).maybeSingle();
        if (!clienteFallback) {
          await AsyncStorage.setItem('pending_oauth_portal', 'cliente');
          await AsyncStorage.setItem('pending_oauth_provider', session.user.app_metadata?.provider || 'email');
          router.replace('/(auth)/sign-in');
          return;
        }
        router.replace('/(cliente)');
        return;
      }

      // 3. Fallback genérico si ya tienen cuenta
      const { data: isClient } = await supabase.from('users').select('user_id').eq('user_id', userId).maybeSingle();
      if (isClient) { router.replace('/(cliente)'); return; }
      
      const { data: isProf } = await supabase.from('professionals').select('prof_id').eq('prof_id', userId).maybeSingle();
      if (isProf) { router.replace('/(profesionista)'); return; }

      // 4. Si tienen sesión pero no existen en la BD, es porque Supabase los redirigió aquí por error
      // (falla de Redirect URL permitida). Los mandamos a sign-in para que se complete el registro.
      await AsyncStorage.setItem('pending_oauth_provider', session.user.app_metadata?.provider || 'email');
      router.replace('/(auth)/sign-in');
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
      <View style={{ backgroundColor: Colors.primary[600], paddingTop: Platform.OS === 'web' ? 0 : Math.max(insets.top || 30, 0) }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: Spacing[3],
          paddingHorizontal: IS_MOBILE ? Spacing[2] : Spacing[6],
          flexWrap: 'nowrap'
        }}>
          <Pressable style={styles.navLogo} onPress={() => scrollRef.current?.scrollTo({ y: 0 })}>
          <Image
            source={require('../../../assets/images/logo.png')}
            style={[styles.navLogoImg, IS_MOBILE && { width: 36, height: 36 }]}
            resizeMode="contain"
          />
          {!IS_MOBILE && <Text style={styles.navLogoText}>ProFinder</Text>}
        </Pressable>

        {!HIDE_NAV_LINKS && (
          <View style={styles.navLinks}>
            <Pressable onPress={() => scrollRef.current?.scrollTo({ y: prosY, animated: true })}><Text style={styles.navLink}>{t('Encontrar Profesionistas')}</Text></Pressable>
            <Pressable onPress={() => scrollRef.current?.scrollTo({ y: howItWorksY, animated: true })}><Text style={styles.navLink}>{t('Cómo funciona')}</Text></Pressable>
            <Pressable onPress={() => scrollRef.current?.scrollTo({ y: featuresY, animated: true })}><Text style={styles.navLink}>{t('Mensajes')}</Text></Pressable>
            <Pressable onPress={() => scrollRef.current?.scrollTo({ y: featuresY, animated: true })}><Text style={styles.navLink}>{t('Citas')}</Text></Pressable>
          </View>
        )}

        <View style={[styles.navActions, IS_MOBILE && { gap: 2, flexShrink: 1 }]}>
          <Pressable onPress={cambiarIdioma} style={({ hovered, pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: IS_MOBILE ? 2 : 10, paddingVertical: 8, borderRadius: 8 }, hovered && { backgroundColor: 'rgba(255,255,255,0.1)' }, pressed && { transform: [{ scale: 0.95 }] }] as any}>
            <Ionicons name="globe-outline" size={IS_MOBILE ? 20 : 20} color="#fff" />
            {!IS_MOBILE && <Text style={{ fontWeight: 'bold', color: '#fff', fontSize: 15 }}>{i18n.language === 'es' ? 'ES' : 'EN'}</Text>}
          </Pressable>
          <Pressable onPress={irALogin} style={({ hovered, pressed }) => [styles.navBtnOutline, IS_MOBILE && { paddingHorizontal: 6, paddingVertical: 6 }, hovered && { backgroundColor: 'rgba(255,255,255,0.1)' }, pressed && { transform: [{ scale: 0.97 }] }] as any}>
            <Text style={[styles.navBtnOutlineText, IS_MOBILE && { fontSize: 11 }]} numberOfLines={1} adjustsFontSizeToFit>{t('Iniciar sesión')}</Text>
          </Pressable>
          <Pressable onPress={irARegistro} style={({ hovered, pressed }) => [styles.navBtnPrimary, IS_MOBILE && { paddingHorizontal: 6, paddingVertical: 6 }, hovered && { opacity: 0.9 }, pressed && { transform: [{ scale: 0.97 }] }] as any}>
            <Text style={[styles.navBtnPrimaryText, IS_MOBILE && { fontSize: 11 }]} numberOfLines={1} adjustsFontSizeToFit>{t('Registrarse')}</Text>
          </Pressable>
        </View>
        </View>
      </View>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <View style={styles.hero}>
        <View style={[styles.heroLeft, IS_MOBILE && styles.heroLeftMobile]}>
          <View style={styles.heroBadge}>
            <Ionicons name="shield-checkmark" size={13} color={Colors.primary[600]} />
            <Text style={styles.heroBadgeText}>{t('ÚNETE A NUESTRA COMUNIDAD PIONERA')}</Text>
          </View>

          <Text style={styles.heroTitle}>
            {t('Encuentra al')}{'\n'}
            <Text style={styles.heroTitleAccent}>{t('Mejor')}</Text>
            {' '}{t('Profesionista')}{'\n'}
            {t('para ti')}
          </Text>

          <Text style={styles.heroSubtitle}>
            {t('Conecta con expertos verificados en tecnología, diseño, mantenimiento y más. ProFinder se encarga de la búsqueda para que tú te enfoques en los resultados.')}
          </Text>

          <View style={styles.heroButtons}>
            <Pressable onPress={irARegistro} style={({ hovered, pressed }) => [styles.heroBtnPrimary, hovered && { opacity: 0.9 }, pressed && { transform: [{ scale: 0.97 }] }] as any}>
              <Text style={styles.heroBtnPrimaryText}>{t('Comenzar ahora')}</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.text.inverse} />
            </Pressable>
            <Pressable onPress={() => scrollRef.current?.scrollTo({ y: prosY, animated: true })} style={({ hovered, pressed }) => [styles.heroBtnGhost, hovered && { backgroundColor: '#F3F4F6' }, pressed && { transform: [{ scale: 0.97 }] }] as any}>
              <Text style={styles.heroBtnGhostText}>{t('Ver perfiles')}</Text>
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
            <Text style={styles.socialProofText}>{t('Forma parte de nuestros primeros expertos')}</Text>
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
                  <Text style={styles.mockupHeroTitle}>{t('Encuentra al')}{'\n'}
                    <Text style={{ color: Colors.primary[600] }}>{t('Mejor')}</Text> {t('Profesionista')}
                  </Text>
                  <Pressable onPress={irARegistro} style={({ hovered, pressed }) => [styles.mockupBtn, hovered && { opacity: 0.9 }, pressed && { transform: [{ scale: 0.97 }] }] as any}>
                    <Text style={styles.mockupBtnText}>{t('Comenzar ahora')} →</Text>
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
          PROFESIONALES DESTACADOS
      ══════════════════════════════════════════ */}
      <View style={styles.prosSection} onLayout={(e) => setProsY(e.nativeEvent.layout.y - 100)}>
        <View style={{ alignItems: 'center', paddingHorizontal: Spacing[6] }}>
          <Text style={styles.sectionEyebrow}>{t('TALENTO VERIFICADO')}</Text>
          <Text style={styles.sectionTitle}>{t('Encuentra a los Mejores')}</Text>
          <Text style={styles.sectionSubtitle}>{t('Navega entre cientos de perfiles evaluados y listos para trabajar.')}</Text>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.prosScroll, CENTER_PROS && { justifyContent: 'center', flexGrow: 1 }]}>
          {[
            { name: 'Doctor', icon: 'medkit-outline' as const },
            { name: 'Abogado', icon: 'briefcase-outline' as const },
            { name: 'Dentista', icon: 'medical-outline' as const },
            { name: 'Ingeniero en Sistemas (Hardware)', icon: 'hardware-chip-outline' as const },
            { name: 'Ingeniero en Sistemas (Software)', icon: 'code-slash-outline' as const },
            { name: 'Ingeniero Civil', icon: 'business-outline' as const },
            { name: 'Arquitecto', icon: 'color-palette-outline' as const },
            { name: 'Otro', icon: 'ellipsis-horizontal-outline' as const }
          ].map((cat, i) => (
             <View key={i} style={styles.proCategoryCard}>
               <Ionicons name={cat.icon} size={32} color={Colors.primary[600]} />
               <Text style={styles.proCategoryTitle}>{t(cat.name)}</Text>
               <Pressable onPress={irARegistro} style={styles.proCategoryBtn}>
                 <Text style={styles.proCategoryBtnText}>{t('Explorar')}</Text>
               </Pressable>
             </View>
          ))}
        </ScrollView>
      </View>

      {/* ══════════════════════════════════════════
          FEATURES (Mensajes y Citas)
      ══════════════════════════════════════════ */}
      <View style={[styles.featuresSection, IS_MOBILE && { flexDirection: 'column' }]} onLayout={(e) => setFeaturesY(e.nativeEvent.layout.y - 80)}>
         <View style={styles.featureBlock}>
            <View style={styles.featureIcon}><Ionicons name="chatbubbles" size={28} color="#fff" /></View>
            <Text style={styles.featureTitle}>{t('Mensajería Integrada')}</Text>
            <Text style={styles.featureDesc}>{t('Chatea directamente con los profesionales sin compartir tu número personal hasta que estés listo.')}</Text>
         </View>
         <View style={styles.featureBlock}>
            <View style={styles.featureIcon}><Ionicons name="calendar" size={28} color="#fff" /></View>
            <Text style={styles.featureTitle}>{t('Citas y Calendarios')}</Text>
            <Text style={styles.featureDesc}>{t('Sincroniza agendas y realiza videollamadas dentro de nuestra plataforma con un solo clic.')}</Text>
         </View>
      </View>

      {/* ══════════════════════════════════════════
          HOW PROFINDER WORKS
      ══════════════════════════════════════════ */}
      <View style={styles.howSection} onLayout={(e) => setHowItWorksY(e.nativeEvent.layout.y - 100)}>
        <Text style={styles.sectionEyebrow}>{t('PROCESO SIMPLE')}</Text>
        <Text style={styles.sectionTitle}>
          {t('Cómo Funciona')} <Text style={styles.sectionTitleAccent}>ProFinder</Text>
        </Text>
        <Text style={styles.sectionSubtitle}>
          {t('Tres sencillos pasos para conectar con talento de alto calibre listo para contribuir a tu éxito.')}
        </Text>
        <View style={styles.stepsRow}>
          {[
            { icon: 'search-outline' as const, step: '01', title: t('Busca profesionales'), desc: t('Navega por nuestro mercado seleccionado de profesionales utilizando filtros avanzados.'), cta: t('Explorar Búsqueda') },
            { icon: 'person-circle-outline' as const, step: '02', title: t('Lee sus perfiles'), desc: t('Analiza a fondo el portafolio verificado y las reseñas de clientes para cada candidato.'), cta: t('Ver Muestra') },
            { icon: 'calendar-outline' as const, step: '03', title: t('Agenda una cita'), desc: t('Sincroniza con su calendario y programa una reunión virtual directamente desde nuestra plataforma.'), cta: t('Agendar Ahora') },
          ].map((s, i) => (
            <View key={i} style={[styles.stepCard, IS_MOBILE && styles.stepCardMobile]}>
              <View style={styles.stepIconWrap}>
                <Ionicons name={s.icon} size={26} color={Colors.primary[600]} />
              </View>
              <Text style={styles.stepNumber}>{s.step}</Text>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepDesc}>{s.desc}</Text>
              <Pressable onPress={irARegistro} style={({ hovered, pressed }) => [styles.stepCta, hovered && { opacity: 0.7 }, pressed && { transform: [{ scale: 0.97 }] }] as any}>
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
        <Text style={styles.ctaTitle}>{t('¿Listo para contratar a tu próxima estrella?')}</Text>
        <Text style={styles.ctaSubtitle}>
          {t('Únete a la nueva era del talento y empieza a crecer hoy mismo con ProFinder.')}
        </Text>
        <View style={styles.ctaButtons}>
          <Pressable onPress={irARegistro} style={({ hovered, pressed }) => [styles.ctaBtnWhite, hovered && { opacity: 0.9 }, pressed && { transform: [{ scale: 0.97 }] }] as any}>
            <Text style={styles.ctaBtnWhiteText}>{t('Comenzar ahora')}</Text>
          </Pressable>
          <Pressable onPress={() => scrollRef.current?.scrollTo({ y: prosY, animated: true })} style={({ hovered, pressed }) => [styles.ctaBtnOutline, hovered && { backgroundColor: 'rgba(255,255,255,0.1)' }, pressed && { transform: [{ scale: 0.97 }] }] as any}>
            <Text style={styles.ctaBtnOutlineText}>{t('Ver perfiles')}</Text>
          </Pressable>
        </View>
      </View>

      {/* ══════════════════════════════════════════
          INFORMACIÓN CORPORATIVA Y LEGAL
      ══════════════════════════════════════════ */}
      <View style={styles.infoSection} onLayout={(e) => setInfoY(e.nativeEvent.layout.y - 80)}>
         <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
               <Text style={styles.infoTitle}>{t('Privacidad')}</Text>
               <Text style={styles.infoText}>{t('Nos tomamos tu privacidad muy en serio. No compartiremos tus datos con terceros sin tu permiso explícito y protegemos toda tu información bajo estándares de seguridad.')}</Text>
            </View>
            <View style={styles.infoCol}>
               <Text style={styles.infoTitle}>{t('Términos')}</Text>
               <Text style={styles.infoText}>{t('Al usar ProFinder aceptas no subir contenido inapropiado, comportarte de manera profesional y respetar los acuerdos de trabajo de nuestra plataforma.')}</Text>
            </View>
            <View style={styles.infoCol}>
               <Text style={styles.infoTitle}>{t('Soporte y Prensa')}</Text>
               <Text style={styles.infoText}>{t('Si tienes problemas con la plataforma contáctanos. Para consultas de prensa, envía tus solicitudes a través de nuestras redes sociales o chat directo.')}</Text>
            </View>
            <View style={styles.infoCol}>
               <Text style={styles.infoTitle}>{t('Carreras')}</Text>
               <Text style={styles.infoText}>{t('Estamos en constante crecimiento. Mantente atento a nuestras redes para unirte a nuestro equipo global como desarrollador o diseñador.')}</Text>
            </View>
         </View>
      </View>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerLogo}>ProFinder</Text>
          <Text style={styles.footerTagline}>{t('Conectando visionarios con expertos.')}</Text>
          <Text style={styles.footerCopy}>© 2026 ProFinder. {t('Todos los derechos reservados.')}</Text>
        </View>
        <View style={styles.footerLinks}>
          <Pressable onPress={() => scrollRef.current?.scrollTo({ y: infoY, animated: true })}><Text style={styles.footerLink}>{t('Privacidad')}</Text></Pressable>
          <Pressable onPress={() => scrollRef.current?.scrollTo({ y: infoY, animated: true })}><Text style={styles.footerLink}>{t('Términos')}</Text></Pressable>
          <Pressable onPress={() => scrollRef.current?.scrollTo({ y: infoY, animated: true })}><Text style={styles.footerLink}>{t('Soporte')}</Text></Pressable>
          <Pressable onPress={() => scrollRef.current?.scrollTo({ y: infoY, animated: true })}><Text style={styles.footerLink}>{t('Carreras')}</Text></Pressable>
          <Pressable onPress={() => scrollRef.current?.scrollTo({ y: infoY, animated: true })}><Text style={styles.footerLink}>{t('Prensa')}</Text></Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const getStyles = (IS_MOBILE: boolean) => StyleSheet.create({
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
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: IS_MOBILE ? 'center' : 'flex-start',
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
  socialProof:      { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center', maxWidth: '100%' },
  avatarStack:      { flexDirection: 'row' },
  avatarCircle:     { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  socialProofText:  { ...Typography.styles.bodySm, color: Colors.text.secondary, textAlign: 'center', flexShrink: 1 },

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

  prosSection:       { paddingVertical: Spacing[10], backgroundColor: '#fff', width: '100%' },
  prosScroll:        { gap: Spacing[4], marginTop: Spacing[6], paddingHorizontal: Spacing[6] },
  proCategoryCard:   { width: 140, padding: 16, borderRadius: Radius.card, backgroundColor: Colors.primary[50], alignItems: 'center', gap: 12, borderWidth: 1, borderColor: Colors.primary[100] },
  proCategoryTitle:  { ...Typography.styles.label, color: Colors.text.primary, textAlign: 'center' },
  proCategoryBtn:    { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.button, borderWidth: 1, borderColor: Colors.border.default },
  proCategoryBtnText:{ ...Typography.styles.caption, color: Colors.primary[600], fontWeight: '600' },

  featuresSection:   { flexDirection: 'row', gap: Spacing[8], paddingHorizontal: Spacing[6], paddingVertical: Spacing[12], backgroundColor: Colors.primary[700], alignItems: 'center', justifyContent: 'center' },
  featureBlock:      { flex: 1, alignItems: 'center', gap: Spacing[3], maxWidth: 400 },
  featureIcon:       { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  featureTitle:      { ...Typography.styles.h4, color: '#fff', textAlign: 'center' },
  featureDesc:       { ...Typography.styles.body, color: Colors.primary[100], textAlign: 'center', lineHeight: 22 },

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
  ctaButtons:        { flexDirection: IS_MOBILE ? 'column' : 'row', gap: Spacing[3], marginTop: Spacing[2], width: IS_MOBILE ? '100%' : 'auto' },
  ctaBtnWhite:       { backgroundColor: '#fff', paddingHorizontal: 22, paddingVertical: 13, borderRadius: Radius.button, width: IS_MOBILE ? '100%' : 'auto', alignItems: 'center' },
  ctaBtnWhiteText:   { ...Typography.styles.btnLg, color: Colors.primary[600] },
  ctaBtnOutline:     { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', paddingHorizontal: 22, paddingVertical: 13, borderRadius: Radius.button, width: IS_MOBILE ? '100%' : 'auto', alignItems: 'center' },
  ctaBtnOutlineText: { ...Typography.styles.btnLg, color: '#fff' },

  infoSection:       { paddingHorizontal: Spacing[6], paddingVertical: Spacing[10], backgroundColor: Colors.background.card, borderTopWidth: 1, borderTopColor: Colors.border.default, width: '100%' },
  infoGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[6], maxWidth: 1100, width: '100%', alignSelf: 'center' },
  infoCol:           { flex: 1, minWidth: IS_MOBILE ? '100%' : 220, gap: 8 },
  infoTitle:         { ...Typography.styles.h6, color: Colors.text.primary },
  infoText:          { ...Typography.styles.bodySm, color: Colors.text.secondary, lineHeight: 22 },

  footer:        { flexDirection: IS_MOBILE ? 'column' : 'row', justifyContent: 'space-between', alignItems: IS_MOBILE ? 'flex-start' : 'center', paddingHorizontal: Spacing[6], paddingVertical: Spacing[6], borderTopWidth: 1, borderTopColor: Colors.border.default, gap: Spacing[4], backgroundColor: Colors.background.app },
  footerLeft:    { gap: 4 },
  footerLogo:    { ...Typography.styles.h5, color: Colors.text.primary },
  footerTagline: { ...Typography.styles.body, color: Colors.text.secondary },
  footerCopy:    { ...Typography.styles.caption, color: Colors.text.disabled },
  footerLinks:   { flexDirection: 'row', gap: Spacing[5], flexWrap: 'wrap' },
  footerLink:    { ...Typography.styles.body, color: Colors.text.secondary },
});
