import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
    Alert,
    ActionSheetIOS,
    Modal,
    TouchableOpacity,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { Colors } from '../../../theme/Colors';
import { Radius, Shadow, Spacing } from '../../../theme/Spacing';
import { Typography } from '../../../theme/Typography';

export default function ChatIndividualScreen() {
  const { id, nombre, inicial } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [estaBloqueado, setEstaBloqueado] = useState(false);
  const [yoLoBloquee, setYoLoBloquee] = useState(false);
  const [escribiendo, setEscribiendo] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    navigation.setOptions({ headerTitle: '' });
  }, [nombre]);

  useEffect(() => {
    const initChat = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        setUserId(session.user.id);

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
          .eq('user_id', session.user.id)
          .eq('other_user_id', id)
          .maybeSingle();

        await fetchMensajes(session.user.id, clearance?.cleared_at || null);
      } catch (err) {
        console.log('Error init chat:', err);
      }
    };

    initChat();
  }, []);

  // Suscripción a Realtime
  useEffect(() => {
    if (!userId || !id) return;

    const channel = supabase
      .channel(`chat_client_${userId}_${id}`)
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
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setMensajes(prev => prev.filter(m => m.id !== payload.old.message_id));
            return;
          }
          if (payload.eventType === 'INSERT') {
            if (payload.new.prof_id === id) {
              const nuevoMsj = {
                id: payload.new.message_id,
                texto: payload.new.message_text,
                deMi: payload.new.sender_type === 1,
                hora: new Date(payload.new.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
              setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, id]);

  const fetchMensajes = async (uId: string, clearedAt: string | null) => {
    try {
      let query = supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', uId)
        .eq('prof_id', id);

      if (clearedAt) {
        query = query.gte('sent_at', clearedAt);
      }

      const { data, error } = await query.order('sent_at', { ascending: true });

      if (error) throw error;

      if (data) {
        const formateados = data.map(m => ({
          id: m.message_id,
          texto: m.message_text,
          deMi: m.sender_type === 1,
          hora: new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
    if (!userId || !id) return;
    
    supabase.channel(`chat_client_${userId}_${id}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { user: userId, isTyping: txt.length > 0 }
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      supabase.channel(`chat_client_${userId}_${id}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: { user: userId, isTyping: false }
      });
    }, 2000);
  };

  const enviarMensaje = async () => {
    if (!texto.trim() || !userId || !id || estaBloqueado) return;
    
    const mensajeTexto = texto.trim();
    setTexto(''); // Limpiar optimísticamente
    
    // Quitar "escribiendo" inmediatamente
    supabase.channel(`chat_client_${userId}_${id}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { user: userId, isTyping: false }
    });

    // Optimistic Update
    const tempId = Date.now().toString();
    setMensajes(prev => [...prev, { id: tempId, texto: mensajeTexto, deMi: true, hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          user_id: userId, // Mi ID (Cliente)
          prof_id: id,     // ID del Profesionista
          sender_type: 1,  // 1 = Cliente
          message_text: mensajeTexto
        }]);
      
      if (error) throw error;
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
    if (!userId) return;
    try {
      await supabase.from('user_reports').insert([{ reporter_id: userId, reported_id: id, reason: 'Reportado desde el chat por cliente' }]);
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
    if (!userId) return;
    try {
      if (yoLoBloquee) {
        await supabase.from('user_blocks').delete().eq('blocker_id', userId).eq('blocked_id', id);
        setEstaBloqueado(false);
        setYoLoBloquee(false);
        if (Platform.OS === 'web') window.alert('Desbloqueado. Ya puedes enviarle mensajes de nuevo.');
        else Alert.alert('Desbloqueado', 'Ya puedes enviarle mensajes de nuevo.');
      } else {
        await supabase.from('user_blocks').insert([{ blocker_id: userId, blocked_id: id }]);
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
    if (!userId) return;
    try {
      const { data } = await supabase.from('chat_clearances').select('id').eq('user_id', userId).eq('other_user_id', id).maybeSingle();
      if (data) {
        await supabase.from('chat_clearances').update({ cleared_at: new Date().toISOString() }).eq('id', data.id);
      } else {
        await supabase.from('chat_clearances').insert([{ user_id: userId, other_user_id: id, cleared_at: new Date().toISOString() }]);
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
        <View style={styles.chatHeader}>
          <Pressable onPress={() => router.replace('/(cliente)/chat' as any)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </Pressable>
          
          <View style={styles.chatHeaderAvatarWrap}>
            <View style={styles.chatHeaderAvatar}><Text style={styles.chatHeaderAvatarTxt}>{inicial}</Text></View>
            <View style={styles.onlineDotLg} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.chatHeaderNombre}>{nombre}</Text>
            <Text style={styles.chatHeaderStatus}>● Online</Text>
          </View>
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
                Envía tu primer mensaje a {nombre}
              </Text>
            )}
            
            {mensajes.map(m => (
              <View key={m.id} style={[styles.msgRow, m.deMi && styles.msgRowMio]}>
                {!m.deMi && (
                  <View style={styles.msgAvatar}><Text style={styles.msgAvatarTxt}>{inicial}</Text></View>
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
                        <Ionicons name="trash-outline" size={20} color={Colors.text.disabled} />
                      </Pressable>
                    )}
                    <Text style={styles.msgHora}>{m.hora}</Text>
                    {m.deMi && <Ionicons name="checkmark-done" size={16} color={Colors.primary[400]} />}
                  </View>
                </View>
              </View>
            ))}
            {escribiendo && (
              <View style={[styles.msgRow, { opacity: 0.7 }]}>
                <View style={styles.msgAvatar}><Text style={styles.msgAvatarTxt}>{inicial}</Text></View>
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
            <Ionicons name="add-outline" size={24} color={Colors.text.secondary} />
          </Pressable>

          <View style={styles.inputWrap}>
            <TextInput
              style={styles.msgInput}
              placeholder={estaBloqueado ? "Chat no disponible" : "Escribe un mensaje..."}
              placeholderTextColor={Colors.text.disabled}
              value={texto}
              onChangeText={notificarEscribiendo}
              onSubmitEditing={enviarMensaje}
              blurOnSubmit={false}
              returnKeyType="send"
              editable={!estaBloqueado}
            />
          </View>

          <Pressable style={[styles.sendBtn, (texto.trim() && !estaBloqueado) ? styles.sendBtnActive : null]} onPress={enviarMensaje} disabled={estaBloqueado}>
            <Ionicons name="send" size={18} color={(texto.trim() && !estaBloqueado) ? '#fff' : Colors.text.disabled} />
          </Pressable>
        </View>

        {mostrarMenu && (
          <Pressable style={[StyleSheet.absoluteFill, { zIndex: 99 }]} onPress={() => setMostrarMenu(false)}>
            <View style={styles.dropdownMenu}>
              <TouchableOpacity style={styles.dropdownMenuItem} onPress={() => { setMostrarMenu(false); router.push(`/servicios/${id}` as any); }}>
                <Text style={styles.dropdownMenuText}>Ver Perfil del Profesionista</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownMenuItem} onPress={vaciarChat}>
                <Text style={styles.dropdownMenuText}>Vaciar Chat local</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownMenuItem} onPress={manejarReporte}>
                <Text style={styles.dropdownMenuText}>Reportar Usuario</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dropdownMenuItem, { borderBottomWidth: 0 }]} onPress={manejarBloqueo}>
                <Text style={[styles.dropdownMenuText, { color: Colors.error.main }]}>{yoLoBloquee ? 'Desbloquear Usuario' : 'Bloquear Usuario'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.neutral[50] },
  chatArea:   { flex: 1, flexDirection: 'column', maxWidth: 800, width: '100%', alignSelf: 'center', backgroundColor: Colors.background.card, borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.border.default },
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], borderBottomWidth: 1, borderBottomColor: Colors.border.default, ...Shadow.xs },
  backBtn:    { marginRight: 4, padding: 4 },
  
  chatHeaderAvatarWrap: { position: 'relative' },
  chatHeaderAvatar:     { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary[200], alignItems: 'center', justifyContent: 'center' },
  chatHeaderAvatarTxt:  { ...Typography.styles.label, color: Colors.primary[700], fontSize: 16 },
  onlineDotLg:          { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.success.main, borderWidth: 2, borderColor: '#fff' },
  chatHeaderNombre:     { ...Typography.styles.h5, color: Colors.text.primary, fontSize: 16 },
  chatHeaderStatus:     { ...Typography.styles.caption, color: Colors.success.main, marginTop: 1 },
  chatActionBtn:        { padding: Spacing[2], borderRadius: Radius.full },

  mensajesScroll:  { flex: 1, backgroundColor: Colors.neutral[50] },
  mensajesContent: { padding: Spacing[4], gap: Spacing[4] },

  msgRow:         { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing[2] },
  msgRowMio:      { flexDirection: 'row-reverse' },
  msgAvatar:      { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primary[100], alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  msgAvatarTxt:   { ...Typography.styles.caption, color: Colors.primary[700], fontWeight: '700', fontSize: 11 },
  msgBubble:      { borderRadius: Radius.lg, paddingHorizontal: Spacing[4], paddingVertical: Spacing[3] },
  msgBubbleMio:   { backgroundColor: Colors.primary[600], borderBottomRightRadius: 4 },
  msgBubbleEllos: { backgroundColor: Colors.background.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border.default, ...Shadow.xs },
  msgTxt:         { ...Typography.styles.body, color: Colors.text.primary, lineHeight: 22 },
  msgMeta:        { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  msgHora:        { ...Typography.styles.caption, color: Colors.text.disabled },

  inputBar:    { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing[2], backgroundColor: Colors.background.card, paddingHorizontal: Spacing[3], paddingVertical: Spacing[3], borderTopWidth: 1, borderTopColor: Colors.border.default },
  inputBarBtn: { padding: 8, alignItems: 'center', justifyContent: 'center' },
  inputWrap:   { flex: 1, backgroundColor: Colors.neutral[100], borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border.default, paddingHorizontal: Spacing[3], minHeight: 44, maxHeight: 120 },
  msgInput:    { flex: 1, ...Typography.styles.body, color: Colors.text.primary, paddingVertical: Platform.OS === 'web' ? 10 : 12, outlineStyle: 'none' } as any,
  sendBtn:     { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.neutral[200], alignItems: 'center', justifyContent: 'center' },
  dropdownMenu: { position: 'absolute', top: 60, right: 16, width: 220, backgroundColor: 'white', borderRadius: 8, overflow: 'hidden', ...Shadow.md, zIndex: 100 },
  dropdownMenuItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.border.default, alignItems: 'flex-start' },
  dropdownMenuText: { ...Typography.styles.body2, color: Colors.text.primary }
});
