import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const CHATS_PRUEBA = [
  { id: '1', nombre: 'Juan Pérez', ultimoMensaje: 'Hola, ¿a qué hora llegarías mañana?', hora: '10:30 AM', noLeidos: 2, avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' },
  { id: '2', nombre: 'María García', ultimoMensaje: '¡Excelente trabajo! Muchas gracias.', hora: 'Ayer', noLeidos: 0, avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' },
  { id: '3', nombre: 'Carlos López', ultimoMensaje: 'Te mandé la ubicación por aquí.', hora: 'Lunes', noLeidos: 0, avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }
];

export default function BandejaChatScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const irAlChat = (id: string, nombre: string) => {
    router.push({ pathname: '/(profesionista)/chat/[id]', params: { id, nombre } } as any);
  };

  return (
    <View style={styles.contenedorFondo}>
      <View style={styles.barraBusqueda}>
        <TextInput 
          style={styles.inputBusqueda} 
          placeholder={t('buscarChat')}
          placeholderTextColor="#8E8E93"
        />
      </View>

      <FlatList
        data={CHATS_PRUEBA}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.chatFila} onPress={() => irAlChat(item.id, item.nombre)}>
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <View style={styles.chatInfo}>
              <View style={styles.chatFilaSuperior}>
                <Text style={styles.chatNombre}>{item.nombre}</Text>
                <Text style={[styles.chatHora, item.noLeidos > 0 && styles.textoHoraNoLeido]}>
                  {item.hora === 'Ayer' ? t('ayer') : item.hora}
                </Text>
              </View>
              <View style={styles.chatFilaInferior}>
                <Text style={styles.chatMensaje} numberOfLines={1}>
                  {item.ultimoMensaje}
                </Text>
                {item.noLeidos > 0 && (
                  <View style={styles.burbujaNoLeido}>
                    <Text style={styles.textoNoLeido}>{item.noLeidos}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedorFondo: { flex: 1, backgroundColor: '#FAFAFC' },
  barraBusqueda: { padding: 15, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  inputBusqueda: { backgroundColor: '#F2F2F7', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10, fontSize: 16, color: '#1C1C1E' },
  chatFila: { flexDirection: 'row', padding: 15, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F2F2F7', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15, backgroundColor: '#E5E5EA' },
  chatInfo: { flex: 1, justifyContent: 'center' },
  chatFilaSuperior: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  chatNombre: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E' },
  chatHora: { fontSize: 12, color: '#8E8E93' },
  textoHoraNoLeido: { color: '#5c4b8a', fontWeight: 'bold' },
  chatFilaInferior: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatMensaje: { fontSize: 14, color: '#8E8E93', flex: 1, paddingRight: 10 },
  burbujaNoLeido: { backgroundColor: '#5c4b8a', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, minWidth: 24, alignItems: 'center' },
  textoNoLeido: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }
});