// ============================================================
// ProFinder — Messages
// Fiel al mockup: lista de conversaciones + chat activo
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
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

// ── Datos de ejemplo por conversación ───────────────────────
// Cuando tu compañero tenga las tablas listas, esto se reemplaza con queries a Supabase
const CONVERSACIONES = [
  { id: '1', nombre: 'Ana Sofia Moreno Gaytan', ultimoMensaje: "Perfect, I'll see you tomorrow then!", hora: 'now',       noLeidos: 2, online: true,  inicial: 'AS' },
  { id: '2', nombre: 'John Doe',                ultimoMensaje: 'Did you receive the proposal?',        hora: '2H AGO',    noLeidos: 0, online: false, inicial: 'JD' },
  { id: '3', nombre: 'Emily Smith',             ultimoMensaje: 'The meeting was very productive.',     hora: 'YESTERDAY', noLeidos: 0, online: false, inicial: 'ES' },
];

// Cada conversación tiene su propio historial de mensajes
const MENSAJES_POR_CONV: Record<string, { id: string; texto: string; mio: boolean; hora: string }[]> = {
  '1': [
    { id: '1', texto: "Glad to hear that, Ana! I tried to include all the requirements we discussed during the discovery call.", mio: true,  hora: '10:41 AM' },
    { id: '2', texto: "I especially like the new timeline. It's much more realistic for our current team capacity.",             mio: false, hora: '10:46 AM' },
    { id: '3', texto: "Perfect, I'll see you tomorrow then!",                                                                   mio: true,  hora: '10:59 AM' },
  ],
  '2': [
    { id: '1', texto: 'Hi! I wanted to follow up on the project proposal I sent last week.', mio: true,  hora: '09:00 AM' },
    { id: '2', texto: 'Did you receive the proposal?',                                        mio: false, hora: '2H AGO'   },
  ],
  '3': [
    { id: '1', texto: 'Thanks for joining the call today!',          mio: true,  hora: 'Yesterday' },
    { id: '2', texto: 'The meeting was very productive.',            mio: false, hora: 'Yesterday' },
    { id: '3', texto: 'Agreed! Let\'s schedule a follow-up soon.',  mio: true,  hora: 'Yesterday' },
  ],
};

export default function MensajesScreen() {
  const router = useRouter();

  // Nombre real del usuario desde Supabase
  const [nombreUsuario, setNombreUsuario] = useState('Mi cuenta');
  const [inicialUsuario, setInicialUsuario] = useState('U');

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
  }, []);

  const [convActiva, setConvActiva]   = useState(CONVERSACIONES[0]);
  const [mensajesPorConv, setMensajesPorConv] = useState(MENSAJES_POR_CONV);
  const [texto, setTexto]             = useState('');
  const [busqueda, setBusqueda]       = useState('');
  const [mostrarChat, setMostrarChat] = useState(!IS_MOBILE);
  const scrollRef = useRef<ScrollView>(null);

  // Mensajes de la conversación activa
  const mensajes = mensajesPorConv[convActiva.id] || [];

  const convFiltradas = CONVERSACIONES.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const enviarMensaje = () => {
    if (!texto.trim()) return;
    const nuevo = {
      id: Date.now().toString(),
      texto: texto.trim(),
      mio: true,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    // Agrega el mensaje solo a la conversación activa
    setMensajesPorConv(prev => ({
      ...prev,
      [convActiva.id]: [...(prev[convActiva.id] || []), nuevo],
    }));
    setTexto('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const abrirConv = (conv: typeof CONVERSACIONES[0]) => {
    setConvActiva(conv);
    if (IS_MOBILE) setMostrarChat(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 50);
  };

  return (
    <View style={styles.root}>

      {/* ── NAVBAR ── */}
      <View style={styles.navbar}>
        <Pressable style={styles.navBrand} onPress={() => router.replace('/(cliente)')}>
          <Image source={require('../../../assets/images/logo.png')} style={styles.navLogo} resizeMode="contain" />
          <Text style={styles.navLogoText}>ProFinder</Text>
        </Pressable>

        {!IS_MOBILE && (
          <View style={styles.navLinks}>
            {['Find Professionals', 'How it works', 'Messages', 'Appointments'].map(l => (
              <Pressable key={l} onPress={() => {
                if (l === 'Find Professionals') router.replace('/(cliente)' as any);
              }}>
                <Text style={[styles.navLink, l === 'Messages' && styles.navLinkActive]}>{l}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.navRight}>
          <Pressable><Ionicons name="notifications-outline" size={20} color="#fff" /></Pressable>
          {/* Avatar con inicial real del usuario */}
          <View style={styles.navAvatar}>
            <Text style={styles.navAvatarTxt}>{inicialUsuario}</Text>
          </View>
          {!IS_MOBILE && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.navUserName}>{nombreUsuario}</Text>
              <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.7)" />
            </View>
          )}
        </View>
      </View>

      {/* ── CUERPO ── */}
      <View style={styles.body}>

        {/* ══ SIDEBAR ══ */}
        {(!IS_MOBILE || !mostrarChat) && (
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Messages</Text>
              <Pressable><Ionicons name="create-outline" size={20} color={Colors.primary[600]} /></Pressable>
            </View>

            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={15} color={Colors.text.disabled} />
              <TextInput style={styles.searchInput} placeholder="Search conversations" placeholderTextColor={Colors.text.disabled} value={busqueda} onChangeText={setBusqueda} />
            </View>

            <FlatList
              data={convFiltradas}
              keyExtractor={c => c.id}
              renderItem={({ item }) => (
                <Pressable style={[styles.convItem, convActiva.id === item.id && styles.convItemActive]} onPress={() => abrirConv(item)}>
                  <View style={styles.convAvatarWrap}>
                    <View style={styles.convAvatar}><Text style={styles.convAvatarTxt}>{item.inicial}</Text></View>
                    {item.online && <View style={styles.onlineDot} />}
                  </View>
                  <View style={styles.convInfo}>
                    <View style={styles.convInfoTop}>
                      <Text style={styles.convNombre} numberOfLines={1}>{item.nombre}</Text>
                      <Text style={styles.convHora}>{item.hora}</Text>
                    </View>
                    <View style={styles.convInfoBottom}>
                      <Text style={styles.convUltimo} numberOfLines={1}>
                        {(mensajesPorConv[item.id] || []).slice(-1)[0]?.texto || item.ultimoMensaje}
                      </Text>
                      {item.noLeidos > 0 && (
                        <View style={styles.badge}><Text style={styles.badgeTxt}>{item.noLeidos}</Text></View>
                      )}
                    </View>
                  </View>
                </Pressable>
              )}
            />
          </View>
        )}

        {/* ══ CHAT ACTIVO ══ */}
        {(!IS_MOBILE || mostrarChat) && (
          <KeyboardAvoidingView style={styles.chatArea} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={56}>

            {/* Cabecera */}
            <View style={styles.chatHeader}>
              {IS_MOBILE && (
                <Pressable onPress={() => setMostrarChat(false)} style={{ marginRight: 8 }}>
                  <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
                </Pressable>
              )}
              <View style={styles.chatHeaderAvatarWrap}>
                <View style={styles.chatHeaderAvatar}><Text style={styles.chatHeaderAvatarTxt}>{convActiva.inicial}</Text></View>
                {convActiva.online && <View style={styles.onlineDotLg} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.chatHeaderNombre}>{convActiva.nombre}</Text>
                <Text style={[styles.chatHeaderStatus, { color: convActiva.online ? Colors.success.main : Colors.text.disabled }]}>
                  {convActiva.online ? '● Online' : '○ Offline'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <Pressable style={styles.chatActionBtn}><Ionicons name="call-outline" size={18} color={Colors.text.secondary} /></Pressable>
                <Pressable style={styles.chatActionBtn}><Ionicons name="videocam-outline" size={18} color={Colors.text.secondary} /></Pressable>
                <Pressable style={styles.chatActionBtn}><Ionicons name="ellipsis-horizontal-outline" size={18} color={Colors.text.secondary} /></Pressable>
              </View>
            </View>

            {/* Mensajes */}
            <ScrollView ref={scrollRef} style={styles.mensajesScroll} contentContainerStyle={styles.mensajesContent} showsVerticalScrollIndicator={false} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
              {mensajes.map(m => (
                <View key={m.id} style={[styles.msgRow, m.mio && styles.msgRowMio]}>
                  {!m.mio && (
                    <View style={styles.msgAvatar}><Text style={styles.msgAvatarTxt}>{convActiva.inicial}</Text></View>
                  )}
                  <View style={{ maxWidth: '72%' }}>
                    <View style={[styles.msgBubble, m.mio ? styles.msgBubbleMio : styles.msgBubbleEllos]}>
                      <Text style={[styles.msgTxt, m.mio && { color: '#fff' }]}>{m.texto}</Text>
                    </View>
                    <View style={[styles.msgMeta, m.mio && { justifyContent: 'flex-end' }]}>
                      <Text style={styles.msgHora}>{m.hora}</Text>
                      {m.mio && <Ionicons name="checkmark-done" size={13} color={Colors.primary[400]} />}
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* ── Input bar ── */}
            <View style={styles.inputBar}>
              <Pressable style={styles.inputBarBtn}>
                <Ionicons name="add-outline" size={22} color={Colors.text.secondary} />
              </Pressable>
              <Pressable style={styles.inputBarBtn}>
                <Ionicons name="mail-outline" size={20} color={Colors.text.secondary} />
              </Pressable>

              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.msgInput}
                  placeholder="Write a message..."
                  placeholderTextColor={Colors.text.disabled}
                  value={texto}
                  onChangeText={setTexto}
                  multiline
                  onSubmitEditing={Platform.OS !== 'web' ? enviarMensaje : undefined}
                />
              </View>

              <Pressable style={styles.inputBarBtn}>
                <Ionicons name="happy-outline" size={20} color={Colors.text.secondary} />
              </Pressable>
              <Pressable style={[styles.sendBtn, texto.trim() ? styles.sendBtnActive : null]} onPress={enviarMensaje}>
                <Ionicons name="send" size={16} color={texto.trim() ? '#fff' : Colors.text.disabled} />
              </Pressable>
            </View>

          </KeyboardAvoidingView>
        )}
      </View>
    </View>
  );
}

const SIDEBAR_W = 220;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.neutral[100] },

  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.primary[600], paddingHorizontal: Spacing[5], paddingVertical: Spacing[3], height: 56 },
  navBrand:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navLogo:     { width: 32, height: 32 },
  navLogoText: { ...Typography.styles.h5, color: '#fff' },
  navLinks:    { flexDirection: 'row', gap: Spacing[5] },
  navLink:     { ...Typography.styles.body, color: 'rgba(255,255,255,0.75)' },
  navLinkActive: { color: '#fff', fontWeight: '700' },
  navRight:    { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  navAvatar:   { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary[400], alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)' },
  navAvatarTxt:{ ...Typography.styles.label, color: '#fff', fontSize: 13 },
  navUserName: { ...Typography.styles.body, color: '#fff', fontWeight: '600' },

  body: { flex: 1, flexDirection: 'row' },

  sidebar: { width: IS_MOBILE ? '100%' : SIDEBAR_W, backgroundColor: Colors.background.card, borderRightWidth: 1, borderRightColor: Colors.border.default },
  sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing[4], paddingVertical: Spacing[4], borderBottomWidth: 1, borderBottomColor: Colors.border.default },
  sidebarTitle: { ...Typography.styles.h5, color: Colors.text.primary },

  searchWrap:  { flexDirection: 'row', alignItems: 'center', gap: 8, margin: Spacing[3], backgroundColor: Colors.neutral[100], borderRadius: Radius.input, paddingHorizontal: Spacing[3], paddingVertical: 8, borderWidth: 1, borderColor: Colors.border.default },
  searchInput: { flex: 1, ...Typography.styles.bodySm, color: Colors.text.primary },

  convItem:       { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], borderBottomWidth: 1, borderBottomColor: Colors.neutral[100] },
  convItemActive: { backgroundColor: Colors.primary[50] },
  convAvatarWrap: { position: 'relative' },
  convAvatar:     { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primary[200], alignItems: 'center', justifyContent: 'center' },
  convAvatarTxt:  { ...Typography.styles.label, color: Colors.primary[700], fontSize: 13 },
  onlineDot:      { position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.success.main, borderWidth: 1.5, borderColor: '#fff' },
  convInfo:       { flex: 1 },
  convInfoTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  convNombre:     { ...Typography.styles.label, color: Colors.text.primary, flex: 1, fontSize: 13 },
  convHora:       { ...Typography.styles.caption, color: Colors.text.disabled, fontSize: 10 },
  convInfoBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convUltimo:     { ...Typography.styles.bodySm, color: Colors.text.secondary, flex: 1, fontSize: 12 },
  badge:          { backgroundColor: Colors.primary[600], borderRadius: Radius.full, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeTxt:       { ...Typography.styles.caption, color: '#fff', fontSize: 10, fontWeight: '700' },

  chatArea:   { flex: 1, flexDirection: 'column', backgroundColor: Colors.neutral[50] },
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], backgroundColor: Colors.background.card, paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], borderBottomWidth: 1, borderBottomColor: Colors.border.default, ...Shadow.xs },

  chatHeaderAvatarWrap: { position: 'relative' },
  chatHeaderAvatar:     { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary[200], alignItems: 'center', justifyContent: 'center' },
  chatHeaderAvatarTxt:  { ...Typography.styles.label, color: Colors.primary[700] },
  onlineDotLg:          { position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: 6, backgroundColor: Colors.success.main, borderWidth: 2, borderColor: '#fff' },
  chatHeaderNombre:     { ...Typography.styles.h5, color: Colors.text.primary, fontSize: 15 },
  chatHeaderStatus:     { ...Typography.styles.caption, marginTop: 1 },
  chatActionBtn:        { padding: Spacing[2], borderRadius: Radius.full },

  mensajesScroll:  { flex: 1 },
  mensajesContent: { padding: Spacing[4], gap: Spacing[4] },

  msgRow:         { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing[2] },
  msgRowMio:      { flexDirection: 'row-reverse' },
  msgAvatar:      { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary[100], alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  msgAvatarTxt:   { ...Typography.styles.caption, color: Colors.primary[700], fontWeight: '700', fontSize: 10 },
  msgBubble:      { borderRadius: Radius.lg, paddingHorizontal: Spacing[4], paddingVertical: Spacing[3] },
  msgBubbleMio:   { backgroundColor: Colors.primary[600], borderBottomRightRadius: 4 },
  msgBubbleEllos: { backgroundColor: Colors.background.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border.default },
  msgTxt:         { ...Typography.styles.body, color: Colors.text.primary, lineHeight: 22 },
  msgMeta:        { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  msgHora:        { ...Typography.styles.caption, color: Colors.text.disabled },

  inputBar:    { flexDirection: 'row', alignItems: 'center', gap: Spacing[1], backgroundColor: Colors.background.card, paddingHorizontal: Spacing[3], paddingVertical: Spacing[2], borderTopWidth: 1, borderTopColor: Colors.border.default, minHeight: 52 },
  inputBarBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  inputWrap:   { flex: 1, minHeight: 36, maxHeight: 100, backgroundColor: Colors.neutral[100], borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border.default, justifyContent: 'center', paddingHorizontal: Spacing[3] },
  msgInput:    { ...Typography.styles.body, color: Colors.text.primary, paddingVertical: Platform.OS === 'web' ? 8 : 6 },
  sendBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.neutral[200], alignItems: 'center', justifyContent: 'center' },
  sendBtnActive: { backgroundColor: Colors.primary[600], ...Shadow.brand },
});
