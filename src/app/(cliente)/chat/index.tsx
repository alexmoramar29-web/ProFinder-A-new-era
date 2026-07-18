import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { Colors } from '../../../theme/Colors';
import { Radius, Shadow, Spacing } from '../../../theme/Spacing';
import { Typography } from '../../../theme/Typography';
import NavbarCliente from '../../../components/NavbarCliente';
import { useTranslation } from 'react-i18next';

export default function ChatIndexScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const [nombreUsuario, setNombreUsuario] = useState('Mi cuenta');
  const [inicialUsuario, setInicialUsuario] = useState('U');
  
  const [conversaciones, setConversaciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        const nombre = user.user_metadata?.fullname_temporal
          || user.user_metadata?.full_name
          || user.email?.split('@')[0]
          || 'Mi cuenta';
        setNombreUsuario(nombre);
        setInicialUsuario(nombre.charAt(0).toUpperCase());
        setUserId(user.id);
        
        cargarConversaciones(user.id);
      });
    }, [])
  );

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`chat_index_client_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages' },
        () => {
          cargarConversaciones(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const cargarConversaciones = async (userId: string) => {
    try {
      const { data: mensajes, error } = await supabase
        .from('chat_messages')
        .select(`
          message_id, message_text, sent_at, is_read, sender_type, prof_id,
          professionals(full_name, profile_picture, username, verification_status)
        `)
        .eq('user_id', userId)
        .order('sent_at', { ascending: false });

      if (error) throw error;

      if (!mensajes) {
        setConversaciones([]);
        return;
      }

      const convsMap = new Map();
      mensajes.forEach(m => {
        if (!convsMap.has(m.prof_id)) {
          const prof = Array.isArray(m.professionals) ? m.professionals[0] : m.professionals;
          const nombreProf = prof?.full_name || prof?.username || 'Profesional';
          const estado = (prof?.verification_status || '').toLowerCase();
          const esAprobado = estado === 'verificado' || estado === 'aprobado' || estado === 'perfil aprobado';

          convsMap.set(m.prof_id, {
            id: m.prof_id,
            nombre: nombreProf,
            ultimoMensaje: m.message_text,
            hora: new Date(m.sent_at + (m.sent_at.endsWith('Z') ? '' : 'Z')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            noLeidos: 0, 
            avatar: prof?.profile_picture || null,
            inicial: nombreProf.charAt(0).toUpperCase(),
            online: false,
            verificado: esAprobado
          });
        }
        
        if (m.sender_type === 2 && !m.is_read) {
          convsMap.get(m.prof_id).noLeidos += 1;
        }
      });

      setConversaciones(Array.from(convsMap.values()));
    } catch (err) {
      console.log('Error cargando chats:', err);
    } finally {
      setCargando(false);
    }
  };

  const convFiltradas = conversaciones.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const irAlChat = (id: string, nombre: string, inicial: string, verificado: boolean, foto: string | null) => {
    router.push({
      pathname: '/(cliente)/chat/[id]',
      params: { id, nombre, inicial, verificado: String(verificado), foto: foto || '' }
    } as any);
  };

  return (
    <View style={styles.root}>
      <NavbarCliente />

      <View style={styles.body}>
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>{t('Messages')}</Text>
            <Pressable><Ionicons name="create-outline" size={20} color={Colors.primary[600]} /></Pressable>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={15} color={Colors.text.disabled} />
            <TextInput 
              style={styles.searchInput} 
              placeholder={t('Search conversations')} 
              placeholderTextColor={Colors.text.disabled} 
              value={busqueda} 
              onChangeText={setBusqueda} 
            />
          </View>

          {cargando ? (
            <ActivityIndicator style={{ marginTop: 40 }} size="large" color={Colors.primary[600]} />
          ) : conversaciones.length === 0 ? (
            <Text style={{ textAlign: 'center', marginTop: 40, color: Colors.text.disabled }}>{t('No tienes conversaciones aún.')}</Text>
          ) : (
            <FlatList
              data={convFiltradas}
              keyExtractor={c => c.id}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => (
                <Pressable style={styles.convItem} onPress={() => irAlChat(item.id, item.nombre, item.inicial, item.verificado, item.avatar)}>
                  <View style={styles.convAvatarWrap}>
                    {item.avatar ? (
                        <Image source={{ uri: item.avatar }} style={styles.convAvatar} />
                    ) : (
                        <View style={styles.convAvatar}><Text style={styles.convAvatarTxt}>{item.inicial}</Text></View>
                    )}
                    {item.online && <View style={styles.onlineDot} />}
                  </View>
                  <View style={[styles.convInfo, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, paddingRight: 8 }}>
                      {item.verificado && <Ionicons name="checkmark-circle" size={12} color={Colors.primary[700]} />}
                      <Text style={styles.convNombre} numberOfLines={1}>{item.nombre}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', flexShrink: 1, maxWidth: '60%' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.convUltimo, { textAlign: 'right', marginRight: 0 }]} numberOfLines={1}>
                          {item.ultimoMensaje}
                        </Text>
                        {item.noLeidos > 0 && (
                          <View style={styles.badge}><Text style={styles.badgeTxt}>{item.noLeidos}</Text></View>
                        )}
                      </View>
                      <Text style={[styles.convHora, { marginTop: 4 }]}>{item.hora}</Text>
                    </View>
                  </View>
                </Pressable>
              )}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.neutral[100] },
  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.primary[600], paddingHorizontal: Spacing[5], paddingVertical: Spacing[3], height: 56 },
  navBrand:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navLogo:     { width: 32, height: 32 },
  navLogoText: { ...Typography.styles.h5, color: '#fff' },
  navLinks:    { flexDirection: 'row', gap: Spacing[5], display: 'flex' },
  navLink:     { ...Typography.styles.body, color: 'rgba(255,255,255,0.75)' },
  navLinkActive: { ...Typography.styles.body, color: '#fff', fontWeight: '700' },
  navRight:    { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  navAvatar:   { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary[400], alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)' },
  navAvatarTxt:{ ...Typography.styles.label, color: '#fff', fontSize: 13 },
  navUserName: { ...Typography.styles.body, color: '#fff', fontWeight: '600' },

  body: { flex: 1, alignItems: 'center' },
  sidebar: { width: '100%', maxWidth: 800, flex: 1, backgroundColor: Colors.background.card, alignSelf: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.border.default },
  sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing[4], paddingVertical: Spacing[4], borderBottomWidth: 1, borderBottomColor: Colors.border.default },
  sidebarTitle: { ...Typography.styles.h5, color: Colors.text.primary },

  searchWrap:  { flexDirection: 'row', alignItems: 'center', gap: 8, margin: Spacing[3], backgroundColor: Colors.neutral[100], borderRadius: Radius.input, paddingHorizontal: Spacing[3], paddingVertical: 8, borderWidth: 1, borderColor: Colors.border.default },
  searchInput: { flex: 1, ...Typography.styles.bodySm, color: Colors.text.primary, outlineStyle: 'none' } as any,

  convItem:       { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], borderBottomWidth: 1, borderBottomColor: Colors.neutral[100] },
  convAvatarWrap: { position: 'relative' },
  convAvatar:     { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.primary[200], alignItems: 'center', justifyContent: 'center' },
  convAvatarTxt:  { ...Typography.styles.label, color: Colors.primary[700], fontSize: 16 },
  onlineDot:      { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.success.main, borderWidth: 2, borderColor: '#fff' },
  convInfo:       { flex: 1 },
  convInfoTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  convNombre:     { ...Typography.styles.label, color: Colors.text.primary, flex: 1, fontSize: 15 },
  convHora:       { ...Typography.styles.caption, color: Colors.text.disabled, fontSize: 12 },
  convInfoBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convUltimo:     { ...Typography.styles.bodySm, color: Colors.text.secondary, flex: 1, fontSize: 13 },
  badge:          { backgroundColor: Colors.primary[600], borderRadius: Radius.full, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeTxt:       { ...Typography.styles.caption, color: '#fff', fontSize: 11, fontWeight: '700' },
});
