import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  signInWithApple,
  signInWithGithub,
  signInWithGoogle,
} from '../../lib/authService';
import { supabase } from '../../lib/supabase';

export default function SignInScreen() {
  const router = useRouter();
  
  const [portal, setPortal] = useState<'cliente' | 'profesionista'>('cliente');
  const [identificador, setIdentificador] = useState(''); 
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeEstado, setMensajeEstado] = useState('');

  const cambiarDePortal = (tipo: 'cliente' | 'profesionista') => {
    setPortal(tipo);
    setMensajeError('');
    setMensajeEstado('');
    setIdentificador('');
    setPassword('');
  };

  const handleLogin = async () => {
    setMensajeError('');
    setMensajeEstado('');
    const entradaLimpia = identificador.trim();

    if (!entradaLimpia || !password) {
      return setMensajeError('Faltan datos: Por favor, escribe tu correo/usuario y contraseña.');
    }

    setCargando(true);

    try {
      let correoFinal = entradaLimpia;
      const esCorreo = entradaLimpia.includes('@');

      // revisamos de que lado esta intentando entrar con su usuario
      if (!esCorreo) {
        if (portal === 'cliente') {
          const { data: usuarioEncontrado } = await supabase.from('users').select('email').eq('username', entradaLimpia).maybeSingle();
          if (usuarioEncontrado) correoFinal = usuarioEncontrado.email; 
          else throw new Error('No existe un cliente con ese nombre de usuario.');
        } else {
          const { data: profEncontrado } = await supabase.from('professionals').select('email').eq('username', entradaLimpia).maybeSingle();
          if (profEncontrado) correoFinal = profEncontrado.email; 
          else throw new Error('No existe un profesionista con ese nombre de usuario.');
        }
      }

      // supabase valida la contraseña
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: correoFinal,
        password: password,
      });

      if (authError) throw new Error('Acceso denegado: Revisa tu contraseña o verifica si ya activaste tu correo.');

      const idDelUsuario = authData.user.id;
      const metadatos = authData.user.user_metadata;

      // EL CADENERO: validacion estricta de roles
      // sacamos el rol original con el que se registro esta cuenta
      const rolOriginal = metadatos.rol_temporal;

      // si el rol de su cuenta no coincide con el portal que selecciono en pantalla, lo bloqueamos
      if (rolOriginal && rolOriginal !== portal) {
        // cerramos la sesion que se acaba de abrir por error
        await supabase.auth.signOut();
        throw new Error(`Esta cuenta no esta disponible, haz el intento en el otro portal`);
      }

      // si pasa el cadenero, hacemos el proceso normal de guardar sus datos
      if (portal === 'cliente') {
        const { data: existeCliente } = await supabase.from('users').select('user_id').eq('user_id', idDelUsuario).maybeSingle();
        
        if (!existeCliente && metadatos.rol_temporal === 'cliente') {
          setMensajeEstado('Configurando tu nuevo perfil de cliente...');
          const { error: dbError } = await supabase.from('users').insert([{
            user_id: idDelUsuario,
            username: metadatos.username_temporal,
            full_name: metadatos.fullname_temporal,
            email: correoFinal,
            phone: metadatos.phone_temporal,
            password_hash: 'PROTEGIDO_POR_AUTH'
          }]);
          if (dbError) throw new Error('No se pudo crear el perfil en la base de datos.');
        }
        router.replace('/(cliente)');
      } 
      
      else {
        const { data: existeProf } = await supabase.from('professionals').select('prof_id').eq('prof_id', idDelUsuario).maybeSingle();
        
        if (!existeProf && metadatos.rol_temporal === 'profesionista') {
          setMensajeEstado('Configurando tu nuevo perfil profesional...');
          
          const { error: profError } = await supabase.from('professionals').insert([{
            prof_id: idDelUsuario,
            username: metadatos.username_temporal,
            full_name: metadatos.fullname_temporal,
            email: correoFinal,
            phone: metadatos.phone_temporal,
            speciality: metadatos.speciality_temporal,
            password_hash: 'PROTEGIDO_POR_AUTH'
          }]);
          
          if (profError) throw new Error('No se pudo guardar tus datos de profesionista.');

          setMensajeEstado('Vinculando documentos de seguridad...');
          
          const { error: docsError } = await supabase.from('professional_documents').insert([
            { prof_id: idDelUsuario, document_type: 'INE', file_url: metadatos.ine_temporal },
            { prof_id: idDelUsuario, document_type: 'Cédula Profesional', file_url: metadatos.cedula_temporal },
            { prof_id: idDelUsuario, document_type: 'Certificado', file_url: metadatos.certificado_temporal }
          ]);

          if (docsError) throw new Error('Fallo al asociar los enlaces de tus documentos.');
        }
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

        {mensajeEstado !== '' && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{mensajeEstado}</Text>
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

  <TouchableOpacity 
  style={styles.googleButton}
  onPress={() => signInWithGoogle()}
  disabled={cargando}
>
  <Text style={styles.socialButtonText}>
    Continuar con Google
  </Text>
</TouchableOpacity>

<TouchableOpacity
  style={styles.githubButton}
  onPress={() => signInWithGithub()}
  disabled={cargando}
>
  <Text style={styles.socialButtonText}>
    Continuar con GitHub
  </Text>
</TouchableOpacity>

<TouchableOpacity
  style={styles.appleButton}
  onPress={() => signInWithApple()}
  disabled={cargando}
>
  <Text style={styles.socialButtonText}>
    Continuar con Apple
  </Text>
</TouchableOpacity>

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
  errorText: { color: '#d9534f', textAlign: 'center', fontWeight: 'bold', fontSize: 14 },
  infoBox: { backgroundColor: '#eef6ff', padding: 12, borderRadius: 5, marginBottom: 15, borderWidth: 1, borderColor: '#007bff' },
  infoText: { color: '#007bff', textAlign: 'center', fontWeight: 'bold', fontSize: 14 },

  googleButton: {
  backgroundColor: '#DB4437',
  padding: 14,
  borderRadius: 8,
  marginTop: 15,
  alignItems: 'center',
},

githubButton: {
  backgroundColor: '#24292E',
  padding: 14,
  borderRadius: 8,
  marginTop: 10,
  alignItems: 'center',
},

appleButton: {
  backgroundColor: '#000000',
  padding: 14,
  borderRadius: 8,
  marginTop: 10,
  alignItems: 'center',
},

socialButtonText: {
  color: '#FFFFFF',
  fontSize: 15,
  fontWeight: 'bold',
},
});