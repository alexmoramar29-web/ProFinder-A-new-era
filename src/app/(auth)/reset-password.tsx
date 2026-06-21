import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  const handleActualizarContrasena = async () => {
    setMensajeError('');
    setMensajeExito('');

    if (!password || !confirmPassword) {
      return setMensajeError('Por favor, llena ambos campos.');
    }

    if (password.length < 8) {
      return setMensajeError('Contrasena debil: Debe tener minimo 8 caracteres.');
    }

    if (password !== confirmPassword) {
      return setMensajeError('Las contrasenas no coinciden.');
    }

    setCargando(true);

    try {
      // Esta es la instruccion de Supabase para cambiar la contrasena del usuario activo
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setMensajeExito('Contrasena actualizada con exito. Redirigiendo...');
      
      // Cerramos la sesion temporal por seguridad y lo mandamos al Sign-In limpio
      await supabase.auth.signOut();
      setTimeout(() => {
        router.replace('/(auth)/sign-in');
      }, 3000);

    } catch (error: any) {
      setMensajeError(error.message || 'No se pudo actualizar la contrasena.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Nueva Contrasena</Text>
        <Text style={styles.subtitle}>Escribe tu nueva clave de acceso de forma segura</Text>

        <TextInput 
          style={styles.input} 
          placeholder="Nueva contrasena (minimo 8 caracteres)" 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry 
          maxLength={50}
          editable={!cargando} 
        />

        <TextInput 
          style={styles.input} 
          placeholder="Confirmar nueva contrasena" 
          value={confirmPassword} 
          onChangeText={setConfirmPassword} 
          secureTextEntry 
          maxLength={50}
          editable={!cargando} 
        />

        {mensajeError !== '' && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{mensajeError}</Text>
          </View>
        )}

        {mensajeExito !== '' && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{mensajeExito}</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button 
            title={cargando ? "Actualizando..." : "Cambiar Contrasena"} 
            onPress={handleActualizarContrasena} 
            disabled={cargando}
            color="#007bff"
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, backgroundColor: '#fff' },
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 25, marginTop: 5 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 15, borderRadius: 5, backgroundColor: '#f9f9f9', fontSize: 15 },
  buttonContainer: { marginTop: 10, borderRadius: 5, overflow: 'hidden' },
  errorBox: { backgroundColor: '#ffe6e6', padding: 12, borderRadius: 5, marginBottom: 15, borderWidth: 1, borderColor: '#ff4d4d' },
  errorText: { color: '#d9534f', textAlign: 'center', fontWeight: 'bold', fontSize: 14 },
  successBox: { backgroundColor: '#e6ffe6', padding: 10, borderRadius: 5, marginBottom: 15, borderWidth: 1, borderColor: '#28a745' },
  successText: { color: '#28a745', textAlign: 'center', fontWeight: 'bold' }
});