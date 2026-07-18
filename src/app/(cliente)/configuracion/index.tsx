import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { supabase } from '../../../lib/supabase';
import NavbarCliente from '../../../components/NavbarCliente';

export default function ConfiguracionScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [modoOscuro, setModoOscuro] = useState(false);
  const [notificaciones, setNotificaciones] = useState(true);

  const cargarFotoPerfil = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('clientes').select('avatar_url').eq('id', user.id).single();
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    }
  };

  useFocusEffect(useCallback(() => { cargarFotoPerfil(); }, []));

  const fotoNavbar = avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

  const menuItems = [
    { title: 'Inicio', route: '/(cliente)' },
    { title: 'Chat', route: '/(cliente)/chat' },
    { title: 'Mi Perfil', route: '/(cliente)/perfil' },
    { title: 'Configuración', route: '/(cliente)/configuracion' },
    { title: 'Ayuda', route: '/(cliente)/ayuda' },
  ];

  return (
    <View style={styles.container}>
      <NavbarCliente />

      {/* CONTENIDO */}
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.cabecera}>
          <Text style={styles.tituloSeccion}>{t('configuracionTitulo')}</Text>
          <Text style={styles.subtituloSeccion}>{t('configuracionSubtitulo')}</Text>
        </View>

        <Text style={styles.tituloBloque}>{t('preferenciasPantalla')}</Text>
        <View style={styles.bloqueAjustes}>
          <View style={[styles.filaAjuste, styles.lineaDivisora]}>
            <Text style={styles.textoFila}>{t('modoOscuro')}</Text>
            <Switch value={modoOscuro} onValueChange={setModoOscuro} trackColor={{ false: '#E5E5EA', true: '#5c4b8a' }} thumbColor={'#FFFFFF'} />
          </View>
          <TouchableOpacity style={styles.filaAjuste} onPress={async () => { const lang = i18n.language === 'en' ? 'es' : 'en'; await AsyncStorage.setItem('user-language', lang); i18n.changeLanguage(lang); }}>
            <Text style={styles.textoFila}>{t('idiomaAplicacion')}</Text>
            <Text style={styles.textoSecundario}>{i18n.language === 'en' ? 'English ❯' : 'Español ❯'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.tituloBloque}>{t('seguridadAlertas')}</Text>
        <View style={styles.bloqueAjustes}>
          <TouchableOpacity style={[styles.filaAjuste, styles.lineaDivisora]} onPress={() => router.push('/(cliente)/configuracion/cambiar-contrasena' as any)}>
            <Text style={styles.textoFila}>{t('cambiarContrasenaBtn')}</Text>
            <Text style={styles.flecha}>❯</Text>
          </TouchableOpacity>
          <View style={styles.filaAjuste}>
            <Text style={styles.textoFila}>{t('notificacionesPush')}</Text>
            <Switch value={notificaciones} onValueChange={setNotificaciones} trackColor={{ false: '#E5E5EA', true: '#5c4b8a' }} />
          </View>
        </View>

        <Text style={styles.tituloBloque}>{t('acercaDe')}</Text>
        <View style={styles.bloqueAjustes}>
          <TouchableOpacity style={[styles.filaAjuste, styles.lineaDivisora]} onPress={() => router.push('/(cliente)/configuracion/privacidad' as any)}>
            <Text style={styles.textoFila}>{t('terminosPrivacidad')}</Text>
            <Text style={styles.flecha}>❯</Text>
          </TouchableOpacity>
          <View style={styles.filaAjuste}>
            <Text style={styles.textoFila}>{t('versionApp')}</Text>
            <Text style={styles.textoSecundario}>1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFC' },
  navbar: { height: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, backgroundColor: '#5c4b8a' },
  navbarTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', textAlign: 'left' },
  rightHeaderContainer: { flexDirection: 'row', alignItems: 'center' },
  profileCircle: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: '#fff' },
  modalContainer: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
  sideMenu: { width: 220, backgroundColor: '#fff', padding: 20, paddingTop: 60, elevation: 10 },
  menuItem: { paddingVertical: 10 },
  menuText: { fontSize: 16, color: '#333' },
  scroll: { padding: 20 },
  cabecera: { marginBottom: 25 },
  tituloSeccion: { fontSize: 28, fontWeight: '800', color: '#1C1C1E' },
  subtituloSeccion: { fontSize: 15, color: '#8E8E93', marginTop: 5 },
  tituloBloque: { fontSize: 14, fontWeight: '600', color: '#8E8E93', marginTop: 20, marginBottom: 10, paddingHorizontal: 10, textTransform: 'uppercase' },
  bloqueAjustes: { backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden' },
  filaAjuste: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, backgroundColor: '#FFFFFF' },
  lineaDivisora: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#C6C6C8' },
  textoFila: { fontSize: 17, color: '#1C1C1E', fontWeight: '400' },
  textoSecundario: { fontSize: 17, color: '#8E8E93' },
  flecha: { fontSize: 18, color: '#C6C6C8' },
});