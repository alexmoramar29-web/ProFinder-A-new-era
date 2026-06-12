import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function SignInScreen() {
  const router = useRouter();
  
  const [portal, setPortal] = useState<'cliente' | 'profesionista'>('cliente');
  const [identificador, setIdentificador] = useState(''); 
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');

  const cambiarDePortal = (tipo: 'cliente' | 'profesionista') => {
    setPortal(tipo);
    setMensajeError('');
    setIdentificador('');
    setPassword('');
  };

  const handleLogin = async () => {
    setMensajeError('');
    const entradaLimpia = identificador.trim();

    if (!entradaLimpia || !password) {
      return setMensajeError('Faltan datos: Por favor, escribe tu correo/usuario y contraseña.');
    }

    setCargando(true);

    try {
      let correoFinal = entradaLimpia;

      // Revisa si tiene '@' 
      const esCorreo = entradaLimpia.includes('@');

      if (!esCorreo) {
        // Si no tiene @, es un usuario
        if (portal === 'cliente') {
          const { data: usuarioEncontrado } = await supabase
            .from('users')
            .select('email')
            .eq('username', entradaLimpia)
            .maybeSingle();

          if (usuarioEncontrado) {
            correoFinal = usuarioEncontrado.email; 
          } else {
            throw new Error('Usuario no encontrado: No existe un Cliente con ese nombre de usuario.');
          }
        } else {
          const { data: profEncontrado } = await supabase
            .from('professionals')
            .select('email')
            .eq('username', entradaLimpia)
            .maybeSingle();

          if (profEncontrado) {
            correoFinal = profEncontrado.email; 
          } else {
            throw new Error('Usuario no encontrado: No existe un Profesionista con ese nombre de usuario.');
          }
        }
      }

      //  correo seguro, le pedimos permiso a la bóveda
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: correoFinal,
        password: password,
      });

      if (authError) {
        throw new Error('Acceso denegado: La contraseña es incorrecta.');
      }

     
      if (portal === 'cliente') {
        router.replace('/(cliente)');
      } else {
        router.replace('/(profesionista)');
      }

    } catch (error: any) {
      setMensajeError(error.message || 'Ocurrió un error inesperado al entrar.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        
        <Text style={styles.title}>
          {portal === 'cliente' ? 'Portal Clientes' : 'Portal Profesionistas'}
        </Text>
        <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, portal === 'cliente' && styles.tabClienteActive]} 
            onPress={() => cambiarDePortal('cliente')}
            disabled={cargando}
          >
            <Text style={portal === 'cliente' ? styles.textActive : styles.textInactive}>Soy Cliente</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabButton, portal === 'profesionista' && styles.tabProfActive]} 
            onPress={() => cambiarDePortal('profesionista')}
            disabled={cargando}
          >
            <Text style={portal === 'profesionista' ? styles.textActive : styles.textInactive}>Soy Profesionista</Text>
          </TouchableOpacity>
        </View>

        {/* texto de ayuda */}
        <TextInput 
          style={styles.input} 
          placeholder="Correo electrónico o Usuario" 
          value={identificador} 
          onChangeText={setIdentificador} 
          autoCapitalize="none" 
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

        {mensajeError !== '' && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{mensajeError}</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button 
            title={cargando ? "Verificando..." : "Entrar a mi Cuenta"} 
            onPress={handleLogin} 
            disabled={cargando}
            color={portal === 'cliente' ? '#007bff' : '#28a745'}
          />
        </View>

        <Text style={styles.link} onPress={() => router.push('/(auth)/sign-up')}>
          ¿No tienes cuenta? Regístrate aquí
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, backgroundColor: '#fff' },
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 25, marginTop: 5 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 15, borderRadius: 5, backgroundColor: '#f9f9f9', fontSize: 15 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 8, padding: 4, marginBottom: 25 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  tabClienteActive: { backgroundColor: '#007bff' },
  tabProfActive: { backgroundColor: '#28a745' },
  textActive: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  textInactive: { color: '#666', fontSize: 14 },
  buttonContainer: { marginTop: 10, borderRadius: 5, overflow: 'hidden' },
  link: { color: '#007bff', marginTop: 25, textAlign: 'center', fontSize: 15 },
  errorBox: { backgroundColor: '#ffe6e6', padding: 12, borderRadius: 5, marginBottom: 15, borderWidth: 1, borderColor: '#ff4d4d' },
  errorText: { color: '#d9534f', textAlign: 'center', fontWeight: 'bold', fontSize: 14 }
});