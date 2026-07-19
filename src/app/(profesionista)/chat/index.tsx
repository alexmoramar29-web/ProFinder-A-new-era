import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View, TouchableOpacity } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { Colors } from '../../../theme/Colors';
import { Radius, Shadow, Spacing } from '../../../theme/Spacing';
import { Typography } from '../../../theme/Typography';
import NavbarProfesionista from '../../../components/NavbarProfesionista';
import { useTheme } from '@/context/ThemeContext';

export default function BandejaChatScreen() {
  const { isDark, colors } = useTheme();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const router = useRouter();

  const [conversaciones, setConversaciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setUserId(user.id);
          cargarConversaciones(user.id);
        }
      });
    }, [])
  );

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`chat_index_prof_${userId}`)
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

  const cargarConversaciones = async (profId: string) => {
    try {
      // 1. Obtener los mensajes del profesionista ordenados por fecha
      const { data: mensajes, error } = await supabase
        .from('chat_messages')
        .select('message_id, message_text, sent_at, is_read, sender_type, user_id')
        .eq('prof_id', profId)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      if (!mensajes || mensajes.length === 0) {
        setConversaciones([]);
        return;
      }

      // 2. Extraer los user_id únicos para buscar su información
      const userIds = [...new Set(mensajes.map((m: any) => m.user_id))];

      // 3. Buscar los datos de esos clientes
      const { data: clientesData, error: errUsers } = await supabase
        .from('users')
        .select('user_id, full_name, username, email, profile_picture')
        .in('user_id', userIds);

      if (errUsers) console.warn("Error fetching users:", errUsers);

      const clientesMap = new Map();
      if (clientesData) {
        clientesData.forEach(c => clientesMap.set(c.user_id, c));
      }

      // 4. Armar las conversaciones agrupando por user_id
      const convsMap = new Map();
      mensajes.forEach((m: any) => {
        if (!convsMap.has(m.user_id)) {
          const clienteInfo = clientesMap.get(m.user_id);
          const emailPrefix = clienteInfo?.email ? clienteInfo.email.split('@')[0] : null;
          const nombreCli = clienteInfo?.full_name || clienteInfo?.username || emailPrefix || 'Cliente';
          
          convsMap.set(m.user_id, {
            id: m.user_id,
            nombre: nombreCli,
            ultimoMensaje: m.message_text,
            hora: new Date(m.sent_at + (m.sent_at.endsWith('Z') ? '' : 'Z')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            noLeidos: 0, 
            avatar: clienteInfo?.profile_picture || null,
            inicial: nombreCli.charAt(0).toUpperCase(),
            online: false 
          });
        }
        
        if (m.sender_type === 1 && !m.is_read) {
          convsMap.get(m.user_id).noLeidos += 1;
        }
      });

      setConversaciones(Array.from(convsMap.values()));
    } catch (err) {
      console.log('Error cargando chats del profesionista:', err);
    } finally {
      setCargando(false);
    }
  };

  const convFiltradas = conversaciones.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const irAlChat = (id: string, nombre: string, inicial: string, foto: string | null) => {
    router.push({
      pathname: '/(profesionista)/chat/[id]',
      params: { id, nombre, inicial, foto: foto || '' }
    } as any);
  };

  return (
    <View style={styles.root}>
      <NavbarProfesionista />
      <View style={styles.body}>
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>{t('chatMenu') || 'Mensajes'}</Text>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={15} color={colors.text.disabled} />
            <TextInput 
              style={styles.searchInput} 
              placeholder={t('buscarChat') || 'Buscar conversaciones...'}
              placeholderTextColor={colors.text.disabled} 
              value={busqueda} 
              onChangeText={setBusqueda} 
            />
          </View>

          {cargando ? (
            <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary[600]} />
          ) : conversaciones.length === 0 ? (
            <Text style={{ textAlign: 'center', marginTop: 40, color: colors.text.disabled }}>
              No tienes mensajes de clientes.
            </Text>
          ) : (
            <FlatList
              data={convFiltradas}
              keyExtractor={c => c.id}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => (
                <Pressable style={styles.convItem} onPress={() => irAlChat(item.id, item.nombre, item.inicial, item.avatar)}>
                  <TouchableOpacity onPress={() => router.push(`/(profesionista)/cliente/${item.id}` as any)} activeOpacity={0.7} style={styles.convAvatarWrap}>
                    {item.avatar ? (
                        <Image source={{ uri: item.avatar }} style={styles.convAvatar} />
                    ) : (
                        <View style={styles.convAvatar}><Text style={styles.convAvatarTxt}>{item.inicial}</Text></View>
                    )}
                    {item.online && <View style={[styles.onlineDot, { backgroundColor: colors.primary[600] }]} />}
                  </TouchableOpacity>
                  <View style={[styles.convInfo, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, paddingRight: 8 }}>
                      <Text style={styles.convNombre} numberOfLines={1}>{item.nombre}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', flexShrink: 1, maxWidth: '60%' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
                        <Text style={[styles.convUltimo, { textAlign: 'right', marginRight: 0, flexShrink: 1 }]} numberOfLines={1} ellipsizeMode="tail">{item.ultimoMensaje.length > 20 ? item.ultimoMensaje.substring(0, 20) + '...' : item.ultimoMensaje}</Text>
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

const getStyles = (colors: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.neutral[100] },
  body: { flex: 1, alignItems: 'center' },
  sidebar: { width: '100%', maxWidth: 800, flex: 1, backgroundColor: colors.background.card, alignSelf: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border.default },
  sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing[4], paddingVertical: Spacing[4], borderBottomWidth: 1, borderBottomColor: colors.border.default },
  sidebarTitle: { ...Typography.styles.h5, color: colors.text.primary },

  searchWrap:  { flexDirection: 'row', alignItems: 'center', gap: 8, margin: Spacing[3], backgroundColor: colors.neutral[100], borderRadius: Radius.input, paddingHorizontal: Spacing[3], paddingVertical: 8, borderWidth: 1, borderColor: colors.border.default },
  searchInput: { flex: 1, ...Typography.styles.bodySm, color: colors.text.primary, outlineStyle: 'none' } as any,

  convItem:       { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], borderBottomWidth: 1, borderBottomColor: colors.neutral[100] },
  convAvatarWrap: { position: 'relative' },
  convAvatar:     { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary[200], alignItems: 'center', justifyContent: 'center' },
  convAvatarTxt:  { ...Typography.styles.label, color: colors.primary[700], fontSize: 16 },
  onlineDot:      { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.success.main, borderWidth: 2, borderColor: colors.neutral[0] },
  convInfo:       { flex: 1 },
  convInfoTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  convNombre:     { ...Typography.styles.label, color: colors.text.primary, flex: 1, fontSize: 15 },
  convHora:       { ...Typography.styles.caption, color: colors.text.disabled, fontSize: 12 },
  convInfoBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convUltimo:     { ...Typography.styles.bodySm, color: colors.text.secondary, flex: 1, fontSize: 13 },
  badge:          { backgroundColor: colors.primary[600], borderRadius: Radius.full, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeTxt:       { ...Typography.styles.caption, color: colors.neutral[0], fontSize: 11, fontWeight: '700' },
});