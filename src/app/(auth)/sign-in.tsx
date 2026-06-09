import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Aviso', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    setCargando(true);

    try {
      // 1. Iniciar sesión en la bóveda de Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) throw authError;

      // 2. ¿A dónde lo mandamos? Buscamos en la tabla de clientes primero
      const { data: clientes } = await supabase
        .from('users')
        .select('email')
        .eq('email', email);

      if (clientes && clientes.length > 0) {
        router.replace('/(cliente)');
        return;
      }

      // 3. Si no estaba en clientes, buscamos en profesionistas
      const { data: profesionistas } = await supabase
        .from('professionals')
        .select('email')
        .eq('email', email);

      if (profesionistas && profesionistas.length > 0) {
        router.replace('/(profesionista)');
        return;
      }

      // Si por alguna razón no está en ninguna tabla
      Alert.alert('Aviso', 'Sesión iniciada, pero no se encontró tu perfil.');

    } catch (error: any) {
      Alert.alert('Error al iniciar sesión', error.message || 'Credenciales incorrectas.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido de nuevo</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Correo electrónico" 
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!cargando}
      />
      <TextInput 
        style={styles.input} 
        placeholder="Contraseña" 
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!cargando}
      />
      
      <View style={styles.buttonContainer}>
        <Button 
          title={cargando ? "Iniciando..." : "Iniciar Sesión"} 
          onPress={handleLogin} 
          disabled={cargando}
        />
      </View>
      
      <Text 
        style={styles.link} 
        onPress={() => router.push('/(auth)/sign-up')}
      >
        ¿No tienes cuenta? Regístrate aquí
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 15, borderRadius: 5, backgroundColor: '#f9f9f9' },
  buttonContainer: { marginTop: 10 },
  link: { color: '#007bff', marginTop: 25, textAlign: 'center', fontSize: 16 }
});