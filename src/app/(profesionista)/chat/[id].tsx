import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    ActionSheetIOS,
    Alert,
    Modal,
    TouchableOpacity,
    Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';
import { Colors } from '../../../theme/Colors';
import { useTheme } from '@/context/ThemeContext';
import { Radius, Shadow, Spacing } from '../../../theme/Spacing';
import { Typography } from '../../../theme/Typography';
import { useTranslation } from 'react-i18next';

export default function ChatIndividualProfesionistaScreen() {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { id: idParam, nombre, inicial, foto } = useLocalSearchParams();
  const id = Array.isArray(idParam) ? idParam[0] : idParam as string;
  const router = useRouter();
    const navigation = useNavigation();

  const isFocused = useIsFocused();
  const isFocusedRef = useRef(isFocused);
  useEffect(() => {
    isFocusedRef.current = isFocused;
  }, [isFocused]);
  
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(true);
  const [miId, setMiId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [estaBloqueado, setEstaBloqueado] = useState(false);
  const [yoLoBloquee, setYoLoBloquee] = useState(false);
  const [escribiendo, setEscribiendo] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const scrollRef = useRef<ScrollView>(null);

  // Marcar como leídos constantemente cuando la pantalla está en foco
  useFocusEffect(
    useCallback(() => {
      const marcarLeidos = async () => {
        if (!miId || !id) return;
        await supabase
          .from('chat_messages')
          .update({ is_read: true })
          .eq('prof_id', miId)
          .eq('user_id', id)
          .eq('sender_type', 1)
          .eq('is_read', false);
      };
      marcarLeidos();
    }, [miId, id])
  );

  useEffect(() => {
    navigation.setOptions({ headerTitle: '' });
  }, [nombre]);

  useEffect(() => {
    const initChat = async () => {
      setMensajes([]);
      setCargando(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        setMiId(session.user.id);

        // 1. Verificar bloqueos
        const { data: blocks } = await supabase
          .from('user_blocks')
          .select('blocker_id, blocked_id')
          .or(`and(blocker_id.eq.${session.user.id},blocked_id.eq.${id}),and(blocker_id.eq.${id},blocked_id.eq.${session.user.id})`);
        
        if (blocks && blocks.length > 0) {
          setEstaBloqueado(true);
          setYoLoBloquee(blocks.some(b => b.blocker_id === session.user.id));
        }

        // 2. Verificar clearance
        const { data: clearance } = await supabase
          .from('chat_clearances')
          .select('cleared_at')
          .eq('user_id', id)
          .eq('prof_id', session.user.id)
          .maybeSingle();

        await fetchMensajes(session.user.id, clearance?.cleared_at || null);
      } catch (err) {
        console.log('Error init chat:', err);
      }
    };

    initChat();
  }, [id]);

  // Suscripción a Realtime y Presencia
  useEffect(() => {
    if (!miId || !id) return;

    // Room ID is always the client's ID followed by the prof's ID, to match client side `chat_room_${userId}_${id}`. Wait, in prof side, `id` is the client ID, `miId` is the prof ID. So `chat_room_${id}_${miId}`!
    const roomId = `chat_room_${id}_${miId}`;
    const channel = supabase
      .channel(roomId, {
        config: { presence: { key: miId } }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setIsOnline(Object.keys(state).includes(id));
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        if (key === id) setIsOnline(true);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key === id) setIsOnline(false);
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.user === id) {
          setEscribiendo(payload.payload.isTyping);
        }
      })
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public',
          table: 'chat_messages',
          filter: `prof_id=eq.${miId}`
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setMensajes(prev => prev.filter(m => m.id !== payload.old.message_id));
            return;
          }
          if (payload.eventType === 'INSERT') {
            if (payload.new.user_id === id) {
              const nuevoMsj = {
                id: payload.new.message_id,
                texto: payload.new.message_text,
                deMi: payload.new.sender_type === 2,
                hora: new Date(payload.new.sent_at + (payload.new.sent_at.endsWith('Z') ? '' : 'Z')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              };
              setMensajes(prev => {
                if (prev.find(m => m.id === nuevoMsj.id)) return prev;
                if (nuevoMsj.deMi) {
                  const idx = prev.findIndex(m => m.deMi && m.texto === nuevoMsj.texto && !String(m.id).includes('-'));
                  if (idx !== -1) {
                    const nuevos = [...prev];
                    nuevos[idx] = nuevoMsj;
                    return nuevos;
                  }
                }
                return [...prev, nuevoMsj];
              });

              // Marcar como leído si no es mío
              if (!nuevoMsj.deMi && miId && isFocusedRef.current) {
                supabase.from('chat_messages').update({ is_read: true })
                  .eq('message_id', nuevoMsj.id).then();
              }

              setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
            }
          }
        }
      );

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ online_at: new Date().toISOString() });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [miId, id]);

  const fetchMensajes = async (mId: string, clearedAt: string | null) => {
    try {
      let query = supabase
        .from('chat_messages')
        .select('*')
        .eq('prof_id', mId)
        .eq('user_id', id);

      if (clearedAt) {
        query = query.gte('sent_at', clearedAt);
      }

      const { data, error } = await query.order('sent_at', { ascending: true });

      if (error) throw error;

      if (data) {
        const formateados = data.map(m => ({
          id: m.message_id,
          texto: m.message_text,
          deMi: m.sender_type === 2, // 2 = Profesionista
          hora: new Date(m.sent_at + (m.sent_at.endsWith('Z') ? '' : 'Z')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setMensajes(formateados);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 200);
      }
    } catch (err) {
      console.log('Error cargando historial:', err);
    } finally {
      setCargando(false);
    }
  };

  const notificarEscribiendo = (txt: string) => {
    setTexto(txt);
    if (!miId || !id) return;
    
    const roomId = `chat_room_${id}_${miId}`;
    supabase.channel(roomId).send({
      type: 'broadcast',
      event: 'typing',
      payload: { user: miId, isTyping: txt.length > 0 }
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      supabase.channel(roomId).send({
        type: 'broadcast',
        event: 'typing',
        payload: { user: miId, isTyping: false }
      });
    }, 2000);
  };

  const enviarMensaje = async () => {
    if (!texto.trim() || !miId || !id || estaBloqueado) return;
    
    const mensajeTexto = texto.trim();
    setTexto(''); // Limpiar optimísticamente
    
    const roomId = `chat_room_${id}_${miId}`;
    supabase.channel(roomId).send({
      type: 'broadcast',
      event: 'typing',
      payload: { user: miId, isTyping: false }
    });

    // Optimistic Update
    const tempId = Date.now().toString();
    setMensajes(prev => [...prev, { id: tempId, texto: mensajeTexto, deMi: true, hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          user_id: id,     // ID del cliente
          prof_id: miId,   // Mi ID (Profesionista)
          sender_type: 2,  // 2 = Profesionista
          message_text: mensajeTexto
        }]);
      
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      const { error: notifError } = await supabase.from('notifications').insert([{
        user_id: id,
        type: 'chat_new',
        content: t('nuevoMensajeDe', { defaultValue: 'Tienes un nuevo mensaje de {{name}}', name: user?.user_metadata?.full_name || user?.user_metadata?.name || 'el profesionista' }),
        related_id: miId
      }]);
      
      if (notifError) {
        console.error('Error insertando notificacion de chat:', notifError);
      }

      } catch (err) {
        console.log('Error enviando mensaje:', err);
        // Revertir optimista si falla
        setMensajes(prev => prev.filter(m => m.id !== tempId));
      }
    };

  const manejarReporte = () => {
    setMostrarMenu(false);
    if (Platform.OS === 'web') {
      if (window.confirm('¿Estás seguro de que deseas reportar a este usuario? Nuestro equipo revisará la conversación.')) {
        ejecutarReporte();
      }
    } else {
      Alert.alert(
        '¿Reportar Usuario?',
        '¿Estás seguro de que deseas reportar a este usuario? Nuestro equipo revisará la conversación.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Reportar', style: 'destructive', onPress: ejecutarReporte }
        ]
      );
    }
  };

  const ejecutarReporte = async () => {
    if (!miId) return;
    try {
      await supabase.from('user_reports').insert([{ reporter_id: miId, reported_id: id, reason: 'Reportado desde el chat por profesionista' }]);
      if (Platform.OS === 'web') window.alert('Reporte Enviado. El equipo revisará la conversación. El usuario ha sido reportado.');
      else Alert.alert('Reporte Enviado', 'El equipo revisará la conversación. El usuario ha sido reportado.');
    } catch (err) { 
      if (Platform.OS === 'web') window.alert('Error: No se pudo reportar al usuario.');
      else Alert.alert('Error', 'No se pudo reportar al usuario.');
    }
  };

  const manejarBloqueo = () => {
    setMostrarMenu(false);
    const titulo = yoLoBloquee ? '¿Desbloquear Usuario?' : '¿Bloquear Usuario?';
    const mensaje = yoLoBloquee 
      ? 'Podrás volver a recibir y enviar mensajes a este usuario.'
      : 'Ya no podrás enviar ni recibir mensajes de este usuario.';
      
    if (Platform.OS === 'web') {
      if (window.confirm(`${titulo}\n\n${mensaje}`)) {
        ejecutarBloqueo();
      }
    } else {
      Alert.alert(
        titulo,
        mensaje,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: yoLoBloquee ? 'Desbloquear' : 'Bloquear', style: yoLoBloquee ? 'default' : 'destructive', onPress: ejecutarBloqueo }
        ]
      );
    }
  };

  const ejecutarBloqueo = async () => {
    if (!miId) return;
    try {
      if (yoLoBloquee) {
        await supabase.from('user_blocks').delete().eq('blocker_id', miId).eq('blocked_id', id);
        setEstaBloqueado(false);
        setYoLoBloquee(false);
        if (Platform.OS === 'web') window.alert('Desbloqueado. Ya puedes enviarle mensajes de nuevo.');
        else Alert.alert('Desbloqueado', 'Ya puedes enviarle mensajes de nuevo.');
      } else {
        await supabase.from('user_blocks').insert([{ blocker_id: miId, blocked_id: id }]);
        setEstaBloqueado(true);
        setYoLoBloquee(true);
        if (Platform.OS === 'web') window.alert('Bloqueado. Has bloqueado a este usuario.');
        else Alert.alert('Bloqueado', 'Has bloqueado a este usuario.');
      }
    } catch (err) { 
      if (Platform.OS === 'web') window.alert('Error: No se pudo actualizar el bloqueo.');
      else Alert.alert('Error', 'No se pudo actualizar el bloqueo.');
    }
  };

  const vaciarChat = () => {
    setMostrarMenu(false);
    const mensaje = '¿Estás seguro de que deseas vaciar este chat? Se borrará el historial de tu pantalla, pero el otro usuario aún podrá verlo.';
    
    if (Platform.OS === 'web') {
      if (window.confirm(`¿Vaciar Chat?\n\n${mensaje}`)) {
        ejecutarVaciado();
      }
    } else {
      Alert.alert(
        '¿Vaciar Chat?',
        mensaje,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Vaciar', style: 'destructive', onPress: ejecutarVaciado }
        ]
      );
    }
  };

  const ejecutarVaciado = async () => {
    if (!miId) return;
    try {
      const { data } = await supabase.from('chat_clearances').select('id').eq('user_id', miId).eq('other_user_id', id).maybeSingle();
      if (data) {
        await supabase.from('chat_clearances').update({ cleared_at: new Date().toISOString() }).eq('id', data.id);
      } else {
        await supabase.from('chat_clearances').insert([{ user_id: miId, other_user_id: id, cleared_at: new Date().toISOString() }]);
      }
      setMensajes([]);
      if (Platform.OS === 'web') window.alert('Chat Vaciado. El historial se ha borrado de tu pantalla.');
      else Alert.alert('Chat Vaciado', 'El historial se ha borrado de tu pantalla.');
    } catch (err) { 
      if (Platform.OS === 'web') window.alert('Error: No se pudo vaciar el chat.');
      else Alert.alert('Error', 'No se pudo vaciar el chat.');
    }
  };

  const confirmarBorrado = (msgId: string) => {
    // No permitir borrar si aún es optimista (milisegundos exactos sin guiones)
    if (String(msgId).length === 13 && !String(msgId).includes('-')) return;

    if (Platform.OS === 'web') {
      if (window.confirm('¿Deseas eliminar este mensaje para todos?')) {
        borrarMensaje(msgId);
      }
    } else {
      Alert.alert('Borrar Mensaje', '¿Deseas eliminar este mensaje para todos?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Borrar', style: 'destructive', onPress: () => borrarMensaje(msgId) }
      ]);
    }
  };

  const borrarMensaje = async (msgId: string) => {
    try {
      const { error } = await supabase.from('chat_messages').delete().eq('message_id', msgId);
      if (error) throw error;
      setMensajes(prev => prev.filter(m => m.id !== msgId));
    } catch (err) { Alert.alert('Error', 'No se pudo borrar el mensaje.'); }
  };

  const mostrarOpcionesChat = () => {
    setMostrarMenu(true);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.root} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.chatArea}>
        {/* Cabecera */}
        <View style={[styles.chatHeader, { paddingTop: Math.max(insets.top, Spacing[3]) }]}>
          <Pressable onPress={() => router.replace('/(profesionista)/chat' as any)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}
            onPress={() => router.push(`/(profesionista)/cliente/${id}` as any)}
            activeOpacity={0.7}
          >
            <View style={styles.chatHeaderAvatarWrap}>
              {foto ? (
                <Image source={{ uri: foto as string }} style={styles.chatHeaderAvatarImg} />
              ) : (
                <View style={styles.chatHeaderAvatar}><Text style={styles.chatHeaderAvatarTxt}>{inicial}</Text></View>
              )}
              {isOnline && <View style={[styles.onlineDotLg, { backgroundColor: Colors.primary[600] }]} />}
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.chatHeaderNombre}>{nombre}</Text>
              </View>
              {isOnline && <Text style={[styles.chatHeaderStatus, { color: Colors.primary[600] }]}>● Online</Text>}
            </View>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <Pressable style={styles.chatActionBtn} onPress={mostrarOpcionesChat}>
              <Ionicons name="ellipsis-horizontal-outline" size={20} color={Colors.text.secondary} />
            </Pressable>
          </View>
        </View>

        {/* Mensajes */}
        {cargando ? (
           <View style={{ flex: 1, justifyContent: 'center' }}>
             <ActivityIndicator size="large" color={Colors.primary[600]} />
           </View>
        ) : (
          <ScrollView 
            ref={scrollRef} 
            style={styles.mensajesScroll} 
            contentContainerStyle={styles.mensajesContent} 
            showsVerticalScrollIndicator={false}
          >
            {mensajes.length === 0 && (
              <Text style={{ textAlign: 'center', color: Colors.text.disabled, marginVertical: 20 }}>
                Aún no hay mensajes con este cliente.
              </Text>
            )}
            
            {mensajes.map(m => (
              <View key={m.id} style={[styles.msgRow, m.deMi && styles.msgRowMio]}>
                {!m.deMi && (
                  <View style={styles.msgAvatar}><Text style={styles.msgAvatarTxt}>{inicial || 'C'}</Text></View>
                )}
                <View style={{ maxWidth: '75%' }}>
                  <View style={[styles.msgBubble, m.deMi ? styles.msgBubbleMio : styles.msgBubbleEllos]}>
                    <Text style={[styles.msgTxt, m.deMi && { color: '#fff' }]}>{m.texto}</Text>
                  </View>
                  <View style={[styles.msgMeta, m.deMi && { justifyContent: 'flex-end' }]}>
                    {m.deMi && (
                      <Pressable 
                        onPress={() => confirmarBorrado(m.id)} 
                        style={{ marginRight: 8, padding: 4 }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="trash-outline" size={20} color={colors.text.disabled} />
                      </Pressable>
                    )}
                    <Text style={styles.msgHora}>{m.hora}</Text>
                    {m.deMi && <Ionicons name="checkmark-done" size={16} color={colors.primary[400]} />}
                  </View>
                </View>
              </View>
            ))}
            {escribiendo && (
              <View style={[styles.msgRow, { opacity: 0.7 }]}>
                <View style={styles.msgAvatar}><Text style={styles.msgAvatarTxt}>{inicial || 'C'}</Text></View>
                <View style={[styles.msgBubble, styles.msgBubbleEllos, { paddingHorizontal: 12, paddingVertical: 8 }]}>
                  <Text style={[styles.msgTxt, { fontStyle: 'italic', fontSize: 12 }]}>escribiendo...</Text>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <Pressable style={styles.inputBarBtn}>
            <Ionicons name="add-outline" size={24} color={colors.text.secondary} />
          </Pressable>

          <View style={styles.inputWrap}>
            <TextInput
              maxLength={300}
              style={styles.msgInput}
              placeholder={estaBloqueado ? "Chat no disponible" : "Escribe un mensaje..."}
              placeholderTextColor={colors.text.disabled}
              value={texto}
              onChangeText={notificarEscribiendo}
              onSubmitEditing={enviarMensaje}
              blurOnSubmit={false}
              returnKeyType="send"
              editable={!estaBloqueado}
            />
          </View>

          <Pressable style={[styles.sendBtn, (texto.trim() && !estaBloqueado) ? styles.sendBtn : null]} onPress={enviarMensaje} disabled={estaBloqueado}>
            <Ionicons name="send" size={18} color={(texto.trim() && !estaBloqueado) ? '#fff' : colors.text.disabled} />
          </Pressable>
        </View>

        {mostrarMenu && (
          <Pressable style={[StyleSheet.absoluteFill, { zIndex: 99 }]} onPress={() => setMostrarMenu(false)}>
            <View style={styles.dropdownMenu}>
              <TouchableOpacity style={styles.dropdownMenuItem} onPress={() => { setMostrarMenu(false); router.push(`/(cliente)/perfil/${id}` as any); }}>
                <Text style={styles.dropdownMenuText}>Ver Perfil del Cliente</Text>
              </TouchableOpacity>
                            <TouchableOpacity style={styles.dropdownMenuItem} onPress={vaciarChat}>
                <Text style={styles.dropdownMenuText}>Vaciar Chat local</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownMenuItem} onPress={manejarReporte}>
                <Text style={styles.dropdownMenuText}>Reportar Cliente</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dropdownMenuItem, { borderBottomWidth: 0 }]} onPress={manejarBloqueo}>
                <Text style={[styles.dropdownMenuText, { color: colors.error.main }]}>{yoLoBloquee ? 'Desbloquear Cliente' : 'Bloquear Cliente'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.neutral[50] },
  chatArea:   { flex: 1, flexDirection: 'column', maxWidth: 800, width: '100%', alignSelf: 'center', backgroundColor: colors.background.card, borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border.default },
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], borderBottomWidth: 1, borderBottomColor: colors.border.default, ...Shadow.xs },
  backBtn:    { marginRight: 4, padding: 4 },
  
  chatHeaderAvatarWrap: { position: 'relative', marginRight: 12 },
  chatHeaderAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary[100], justifyContent: 'center', alignItems: 'center' },
  chatHeaderAvatarImg: { width: 44, height: 44, borderRadius: 22 },
  chatHeaderAvatarTxt: { ...Typography.styles.h5, color: colors.primary[700] },
  onlineDotLg:          { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.success.main, borderWidth: 2, borderColor: '#fff' },
  chatHeaderNombre:     { ...Typography.styles.h5, color: colors.text.primary, fontSize: 16 },
  chatHeaderStatus:     { ...Typography.styles.caption, color: colors.text.secondary, marginTop: 1 },
  chatActionBtn:        { padding: Spacing[2], borderRadius: Radius.full },

  mensajesScroll:  { flex: 1, backgroundColor: colors.neutral[50] },
  mensajesContent: { padding: Spacing[4], gap: Spacing[4] },

  msgRow:         { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing[2], width: '100%' },
  msgRowMio:      { flexDirection: 'row-reverse' },
  msgAvatar:      { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primary[100], alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  msgAvatarTxt:   { ...Typography.styles.caption, color: colors.primary[700], fontWeight: '700', fontSize: 11 },
  msgBubble:      { borderRadius: Radius.lg, paddingHorizontal: Spacing[4], paddingVertical: Spacing[3] },
  msgBubbleMio:   { backgroundColor: colors.primary[600], borderBottomRightRadius: 4 },
  msgBubbleEllos: { backgroundColor: colors.background.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border.default, ...Shadow.xs },
  msgTxt:         { ...Typography.styles.body, color: colors.text.primary, lineHeight: 22 },
  msgMeta:        { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  msgHora:        { ...Typography.styles.caption, color: colors.text.disabled },

  inputBar:    { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing[2], backgroundColor: colors.background.card, paddingHorizontal: Spacing[3], paddingVertical: Spacing[3], borderTopWidth: 1, borderTopColor: colors.border.default },
  inputBarBtn: { padding: 8, alignItems: 'center', justifyContent: 'center' },
  inputWrap:   { flex: 1, backgroundColor: colors.neutral[100], borderRadius: Radius.lg, borderWidth: 1, borderColor: colors.border.default, paddingHorizontal: Spacing[3], minHeight: 44, maxHeight: 120 },
  msgInput:    { flex: 1, ...Typography.styles.body, color: colors.text.primary, paddingVertical: Platform.OS === 'web' ? 10 : 12, outlineStyle: 'none' } as any,
  sendBtn:     { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.neutral[200], alignItems: 'center', justifyContent: 'center' },
  dropdownMenu: { position: 'absolute', top: 60, right: 16, width: 220, backgroundColor: colors.neutral[0], borderRadius: 8, overflow: 'hidden', ...Shadow.md, zIndex: 100 },
  dropdownMenuItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border.default, alignItems: 'flex-start' },
  dropdownMenuText: { ...Typography.styles.body, color: colors.text.primary }
});