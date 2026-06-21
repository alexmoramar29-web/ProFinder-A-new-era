import { supabase } from '@/lib/supabase';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const router = useRouter();
  
  const [portal, setPortal] = useState<'cliente' | 'profesionista'>('cliente');
  const [identificador, setIdentificador] = useState(''); 
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeEstado, setMensajeEstado] = useState('');
  
  // Nuevo interruptor para cambiar la pantalla al modo de recuperación
  const [modoRecuperar, setModoRecuperar] = useState(false);

  const cambiarDePortal = (tipo: 'cliente' | 'profesionista') => {
    setPortal(tipo);
    setMensajeError('');
    setMensajeEstado('');
    setIdentificador('');
    setPassword('');
    setModoRecuperar(false);
  };

  const manejarLoginSocial = async (proveedor: 'google' | 'github') => {
    setMensajeError('');
    setCargando(true);

    try {
      const urlDeRegreso = Linking.createURL('');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: proveedor,
        options: {
          redirectTo: urlDeRegreso,
          skipBrowserRedirect: true, 
        },
      });

      if (error) throw error;

      if (data?.url) {
        const resultado = await WebBrowser.openAuthSessionAsync(data.url, urlDeRegreso);
        
        if (resultado.type === 'success' && resultado.url) {
          setMensajeEstado('Verificando llaves de seguridad...');
          
          const stringParametros = resultado.url.split('#')[1] || resultado.url.split('?')[1];
          if (!stringParametros) throw new Error('No se recibieron credenciales de la red social.');

          const pares = stringParametros.split('&');
          const tokens: any = {};
          for (const par of pares) {
            const [llave, valor] = par.split('=');
            tokens[llave] = valor;
          }

          if (!tokens.access_token || !tokens.refresh_token) {
             throw new Error('Faltan los tokens de acceso en el regreso.');
          }

          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
          });

          if (sessionError) throw sessionError;

          const usuarioRedSocial = sessionData.user;
          if (!usuarioRedSocial) throw new Error('Error al leer el perfil.');

          const idDelUsuario = usuarioRedSocial.id;
          const correo = usuarioRedSocial.email || '';
          const nombreCompleto = usuarioRedSocial.user_metadata?.full_name || usuarioRedSocial.user_metadata?.name || 'Usuario';
          const nombreUsuarioGenerado = correo.split('@')[0] + Math.floor(Math.random() * 100);

          setMensajeEstado('Preparando tu espacio de trabajo...');

          if (portal === 'cliente') {
            const { data: existeCliente } = await supabase.from('users').select('user_id').eq('user_id', idDelUsuario).maybeSingle();
            
            if (!existeCliente) {
              await supabase.from('users').insert([{
                user_id: idDelUsuario,
                username: nombreUsuarioGenerado,
                full_name: nombreCompleto,
                email: correo,
                password_hash: 'PROTEGIDO_POR_RED_SOCIAL'
              }]);

              await supabase.from('social_logins').insert([{
                user_id: idDelUsuario,
                provider: proveedor,
                provider_id: idDelUsuario
              }]);
            }
            router.replace('/(cliente)');
          } 
          
          else {
            const { data: existeProf } = await supabase.from('professionals').select('prof_id').eq('prof_id', idDelUsuario).maybeSingle();
            
            if (!existeProf) {
              await supabase.from('professionals').insert([{
                prof_id: idDelUsuario,
                username: nombreUsuarioGenerado,
                full_name: nombreCompleto,
                email: correo,
                speciality: 'Por definir', 
                profile_picture: usuarioRedSocial.user_metadata?.avatar_url || null, 
                password_hash: 'PROTEGIDO_POR_RED_SOCIAL'
              }]);

              await supabase.from('social_logins').insert([{
                prof_id: idDelUsuario,
                provider: proveedor,
                provider_id: idDelUsuario
              }]);

              router.replace('/(profesionista)/perfil/editar');
              return; 
            }

            router.replace('/(profesionista)');
          }
        }
      }
    } catch (error: any) {
      setMensajeError(error.message || `No se pudo iniciar sesion con ${proveedor}`);
    } finally {
      setCargando(false);
    }
  };

  const handleLogin = async () => {
    setMensajeError('');
    setMensajeEstado('');
    const entradaLimpia = identificador.trim();

    if (!entradaLimpia || !password) {
      return setMensajeError('Faltan datos: Por favor, escribe tu correo/usuario y contrasena.');
    }

    setCargando(true);

    try {
      let correoFinal = entradaLimpia;
      const esCorreo = entradaLimpia.includes('@');

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

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: correoFinal,
        password: password,
      });

      if (authError) throw new Error('Acceso denegado: Revisa tu contrasena. Si es correcta, es posible que tu cuenta este bloqueada, intenta registrarte de nuevo.');

      const idDelUsuario = authData.user.id;
      const metadatos = authData.user.user_metadata;
      const rolOriginal = metadatos.rol_temporal;

      if (rolOriginal && rolOriginal !== portal) {
        await supabase.auth.signOut();
        throw new Error(`Esta cuenta no esta disponible, haz el intento en el otro portal`);
      }

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
          
          if (profError) throw new Error('No se pudo guardar tus datos.');

          setMensajeEstado('Vinculando documentos de seguridad...');
          const { error: docsError } = await supabase.from('professional_documents').insert([
            { prof_id: idDelUsuario, document_type: 'INE', file_url: metadatos.ine_temporal },
            { prof_id: idDelUsuario, document_type: 'Cédula Profesional', file_url: metadatos.cedula_temporal },
            { prof_id: idDelUsuario, document_type: 'Certificado', file_url: metadatos.certificado_temporal }
          ]);

          if (docsError) throw new Error('Fallo al asociar los enlaces.');
        }
        router.replace('/(profesionista)');
      }

    } catch (error: any) {
      setMensajeError(error.message || 'Ocurrio un error inesperado al entrar.');
    } finally {
      setCargando(false);
    }
  };

  // NUENA FUNCIÓN: Lógica para enviar el correo de recuperación
  const handleRecuperarPassword = async () => {
    setMensajeError('');
    setMensajeEstado('');
    const entradaLimpia = identificador.trim();

    if (!entradaLimpia) {
      return setMensajeError('Escribe tu correo o usuario para enviarte el enlace de recuperación.');
    }

    setCargando(true);
    try {
      let correoFinal = entradaLimpia;
      const esCorreo = entradaLimpia.includes('@');

      if (!esCorreo) {
        const tabla = portal === 'cliente' ? 'users' : 'professionals';
        const { data: usuario } = await supabase.from(tabla).select('email').eq('username', entradaLimpia).maybeSingle();
        if (usuario) correoFinal = usuario.email;
        else throw new Error('No encontramos una cuenta con ese nombre de usuario.');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(correoFinal);
      if (error) throw error;

      setMensajeEstado('Revisa tu bandeja de entrada. Te hemos enviado un enlace para crear una contraseña nueva.');
    } catch (error: any) {
      setMensajeError(error.message || 'No se pudo enviar el correo de recuperación.');
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
        <Text style={styles.subtitle}>
          {modoRecuperar ? 'Recupera el acceso a tu cuenta' : 'Inicia sesion para continuar'}
        </Text>

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
          placeholder="Correo electronico o Usuario" 
          value={identificador} 
          onChangeText={setIdentificador} 
          autoCapitalize="none" 
          editable={!cargando} 
        />
        
        {/* Si NO estamos en modo recuperar, mostramos la caja de contraseña */}
        {!modoRecuperar && (
          <TextInput 
            style={styles.input} 
            placeholder="Contrasena" 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry 
            editable={!cargando} 
          />
        )}

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
            title={cargando ? "Procesando..." : (modoRecuperar ? "Enviar enlace de recuperacion" : "Entrar a mi Cuenta")} 
            onPress={modoRecuperar ? handleRecuperarPassword : handleLogin} 
            disabled={cargando}
            color={portal === 'cliente' ? '#007bff' : '#28a745'}
          />
        </View>

        <TouchableOpacity onPress={() => setModoRecuperar(!modoRecuperar)}>
          <Text style={styles.linkRecuperar}>
            {modoRecuperar ? 'Cancelar y volver a iniciar sesion' : 'Olvide mi contrasena'}
          </Text>
        </TouchableOpacity>

        {/* Si NO estamos en modo recuperar, mostramos los botones de redes sociales y el registro */}
        {!modoRecuperar && (
          <>
            <TouchableOpacity 
              style={styles.googleButton}
              onPress={() => manejarLoginSocial('google')}
              disabled={cargando}
            >
              <Text style={styles.socialButtonText}>Continuar con Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.githubButton}
              onPress={() => manejarLoginSocial('github')}
              disabled={cargando}
            >
              <Text style={styles.socialButtonText}>Continuar con GitHub</Text>
            </TouchableOpacity>

            <Text style={styles.linkRegistro} onPress={() => router.push('/(auth)/sign-up')}>
              No tienes cuenta? Registrate aqui
            </Text>
          </>
        )}
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
  linkRecuperar: { color: '#d9534f', marginTop: 15, textAlign: 'center', fontSize: 14, fontWeight: 'bold' },
  linkRegistro: { color: '#007bff', marginTop: 25, textAlign: 'center', fontSize: 15 },
  errorBox: { backgroundColor: '#ffe6e6', padding: 12, borderRadius: 5, marginBottom: 15, borderWidth: 1, borderColor: '#ff4d4d' },
  errorText: { color: '#d9534f', textAlign: 'center', fontWeight: 'bold', fontSize: 14 },
  infoBox: { backgroundColor: '#eef6ff', padding: 12, borderRadius: 5, marginBottom: 15, borderWidth: 1, borderColor: '#007bff' },
  infoText: { color: '#007bff', textAlign: 'center', fontWeight: 'bold', fontSize: 14 },
  googleButton: { backgroundColor: '#DB4437', padding: 14, borderRadius: 8, marginTop: 25, alignItems: 'center' },
  githubButton: { backgroundColor: '#24292E', padding: 14, borderRadius: 8, marginTop: 10, alignItems: 'center' },
  socialButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
});