import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ChatIndividualScreen() {
  const { t } = useTranslation();
  const { id, nombre } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    navigation.setOptions({ headerTitle: '' });
  }, [nombre]);

  const MENSAJES_PRUEBA = [
    { id: '1', texto: 'Hola, disculpa las molestias.', deMi: false, hora: '10:15 AM' },
    { id: '2', texto: '¿Crees que puedas llegar 15 minutos antes?', deMi: false, hora: '10:16 AM' },
    { id: '3', texto: 'Hola ' + (nombre || 'Cliente') + ', claro que sí, ahí estaré un poco antes. ¡No hay problema!', deMi: true, hora: '10:20 AM' }
  ];

  return (
    <KeyboardAvoidingView 
      style={styles.contenedorFondo} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.cabeceraChat}>
        <TouchableOpacity onPress={() => router.replace('/(profesionista)/chat')} style={styles.botonAtrasInline}>
          <Text style={styles.flechaAtras}>❮</Text>
          <Text style={styles.textoAtrasInline}>{t('atras')}</Text>
        </TouchableOpacity>
        <Text style={styles.nombreCabecera}>{nombre || t('chatConCliente')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollMensajes}>
        <Text style={styles.separadorFecha}>{t('hoy')}</Text>
        
        {MENSAJES_PRUEBA.map((msg) => (
          <View key={msg.id} style={[styles.burbujaFila, msg.deMi ? styles.filaMia : styles.filaAjena]}>
            <View style={[styles.burbujaMensaje, msg.deMi ? styles.burbujaMia : styles.burbujaAjena]}>
              <Text style={[styles.textoMensaje, msg.deMi ? styles.textoMio : styles.textoAjeno]}>
                {msg.texto}
              </Text>
              <Text style={[styles.horaMensaje, msg.deMi ? styles.horaMia : styles.horaAjena]}>
                {msg.hora}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.zonaInput}>
        <TextInput 
          style={styles.inputMensaje}
          placeholder={t('escribeMensaje')}
          placeholderTextColor="#8E8E93"
          value={mensaje}
          onChangeText={setMensaje}
          multiline
        />
        <TouchableOpacity style={styles.botonEnviar}>
          <Text style={styles.textoEnviar}>{t('enviar')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedorFondo: { flex: 1, backgroundColor: '#FAFAFC' },
  cabeceraChat: { backgroundColor: '#FFFFFF', padding: 15, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  botonAtrasInline: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  flechaAtras: { fontSize: 20, color: '#5c4b8a', fontWeight: 'bold', marginRight: 5 },
  textoAtrasInline: { fontSize: 16, color: '#5c4b8a', fontWeight: 'bold' },
  nombreCabecera: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  
  scrollMensajes: { padding: 15, paddingBottom: 20 },
  separadorFecha: { textAlign: 'center', fontSize: 12, color: '#8E8E93', marginVertical: 15, fontWeight: 'bold' },
  
  burbujaFila: { flexDirection: 'row', marginBottom: 15 },
  filaMia: { justifyContent: 'flex-end' },
  filaAjena: { justifyContent: 'flex-start' },
  
  burbujaMensaje: { maxWidth: '80%', padding: 12, borderRadius: 16, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  burbujaMia: { backgroundColor: '#5c4b8a', borderBottomRightRadius: 4 },
  burbujaAjena: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#F2F2F7' },
  
  textoMensaje: { fontSize: 15, lineHeight: 20 },
  textoMio: { color: '#FFFFFF' },
  textoAjeno: { color: '#1C1C1E' },
  
  horaMensaje: { fontSize: 10, marginTop: 5, alignSelf: 'flex-end' },
  horaMia: { color: 'rgba(255,255,255,0.7)' },
  horaAjena: { color: '#8E8E93' },
  
  zonaInput: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E5EA' },
  inputMensaje: { flex: 1, backgroundColor: '#F2F2F7', borderRadius: 20, paddingHorizontal: 15, paddingTop: 10, paddingBottom: 10, minHeight: 40, maxHeight: 100, fontSize: 15, color: '#1C1C1E' },
  botonEnviar: { marginLeft: 10, padding: 10, backgroundColor: '#5c4b8a', borderRadius: 20 },
  textoEnviar: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }
});