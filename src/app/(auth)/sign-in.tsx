import { supabase } from '@/lib/supabase';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next'; // Herramienta de traducción
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const router = useRouter();
  
  // Encendemos el traductor
  const { t, i18n } = useTranslation();
  
  const [portal, setPortal] = useState<'cliente' | 'profesionista'>('cliente');
  const [identificador, setIdentificador] = useState(''); 
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState<'info' | 'error' | 'exito' | ''>('');
  
  const [modoRecuperar, setModoRecuperar] = useState(false);

  // Función para alternar el idioma
  const cambiarIdioma = () => {
    const idiomaActual = i18n.language;
    i18n.changeLanguage(idiomaActual === 'es' ? 'en' : 'es');
  };

  const cambiarDePortal = (tipo: 'cliente' | 'profesionista') => {
    setPortal(tipo);
    setMensaje('');
    setTipoMensaje('');
    setIdentificador('');
    setPassword('');
  };

  const manejarLoginSocial = async (proveedor: 'google' | 'github') => {
    setMensaje('');
    setCargando(true);
    setMensaje('Conectando con ' + proveedor + '...');
    setTipoMensaje('info');

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
          setMensaje('Verificando llaves de seguridad...');
          
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

          setMensaje('Preparando tu espacio de trabajo...');

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
      setMensaje('Error: ' + (error.message || `No se pudo iniciar sesión con ${proveedor}`));
      setTipoMensaje('error');
    } finally {
      setCargando(false);
    }
  };

  const handleLogin = async () => {
    setMensaje('');
    const entradaLimpia = identificador.trim();

    if (!entradaLimpia || !password) {
      setMensaje('Faltan datos: Escribe tu correo/usuario y contraseña.');
      setTipoMensaje('error');
      return;
    }

    setCargando(true);
    setMensaje('Iniciando sesión...');
    setTipoMensaje('info');

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

      if (authError) throw new Error('Acceso denegado. Revisa tu contraseña o intenta recuperar tu cuenta.');

      const idDelUsuario = authData.user.id;
      const metadatos = authData.user.user_metadata;
      const rolOriginal = metadatos.rol_temporal;

      if (rolOriginal && rolOriginal !== portal) {
        await supabase.auth.signOut();
        throw new Error(`Esta cuenta no está disponible, haz el intento en el otro portal.`);
      }

      if (portal === 'cliente') {
        const { data: existeCliente } = await supabase.from('users').select('user_id').eq('user_id', idDelUsuario).maybeSingle();
        
        if (!existeCliente && metadatos.rol_temporal === 'cliente') {
          setMensaje('Configurando tu nuevo perfil de cliente...');
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
          setMensaje('Configurando tu nuevo perfil profesional...');
          
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

          setMensaje('Vinculando documentos de seguridad...');
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
      setMensaje(error.message || 'Ocurrió un error inesperado al entrar.');
      setTipoMensaje('error');
    } finally {
      setCargando(false);
    }
  };

  const handleRecuperarPassword = async () => {
    setMensaje('');
    const entradaLimpia = identificador.trim();

    if (!entradaLimpia) {
      setMensaje('Escribe tu correo o usuario para enviarte el código.');
      setTipoMensaje('error');
      return;
    }

    setCargando(true);
    setMensaje('Enviando código de recuperación...');
    setTipoMensaje('info');
    
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

      setMensaje('¡Listo! Revisa tu correo, te hemos enviado un código.');
      setTipoMensaje('exito');
      
      setTimeout(() => {
        router.push({
          pathname: '/(auth)/reset-password',
          params: { correoParam: correoFinal } 
        });
      }, 2000);
      
    } catch (error: any) {
      setMensaje('Error: ' + (error.message || 'No se pudo enviar el correo de recuperación.'));
      setTipoMensaje('error');
    } finally {
      setCargando(false);
    }
  };

  const obtenerColorMensaje = () => {
    if (tipoMensaje === 'error') return '#D32F2F'; 
    if (tipoMensaje === 'exito') return '#388E3C'; 
    return '#8E8E93'; 
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.fondo}>
      <View style={styles.container}>
        
        {/* BOTÓN LIMPIO PARA CAMBIAR IDIOMA */}
        <TouchableOpacity style={styles.botonIdioma} onPress={cambiarIdioma}>
          <Text style={styles.textoIdioma}>
            {i18n.language === 'es' ? 'EN' : 'ES'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          {portal === 'cliente' ? t('portalClientes') : t('portalProfesionistas')}
        </Text>
        <Text style={styles.subtitle}>
          {modoRecuperar ? t('recuperaAcceso') : t('iniciaSesion')}
        </Text>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, portal === 'cliente' && styles.tabClienteActive]} 
            onPress={() => cambiarDePortal('cliente')}
            disabled={cargando}
          >
            <Text style={portal === 'cliente' ? styles.textActive : styles.textInactive}>{t('soyCliente')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabButton, portal === 'profesionista' && styles.tabProfActive]} 
            onPress={() => cambiarDePortal('profesionista')}
            disabled={cargando}
          >
            <Text style={portal === 'profesionista' ? styles.textActive : styles.textInactive}>{t('soyProfesionista')}</Text>
          </TouchableOpacity>
        </View>

        <TextInput 
          style={styles.input} 
          placeholder={t('placeholderCorreo')} 
          value={identificador} 
          onChangeText={setIdentificador} 
          autoCapitalize="none" 
          editable={!cargando} 
        />
        
        {!modoRecuperar && (
          <TextInput 
            style={styles.input} 
            placeholder={t('placeholderContrasena')} 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry 
            editable={!cargando} 
          />
        )}

        <TouchableOpacity 
          style={[styles.botonPrincipal, { backgroundColor: portal === 'cliente' ? '#007bff' : '#28a745' }]} 
          onPress={modoRecuperar ? handleRecuperarPassword : handleLogin} 
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.textoBoton}>
              {modoRecuperar ? t('btnEnviarCodigo') : t('btnEntrar')}
            </Text>
          )}
        </TouchableOpacity>

        {mensaje !== '' && (
          <Text style={[styles.textoMensaje, { color: obtenerColorMensaje() }]}>
            {mensaje}
          </Text>
        )}

        <TouchableOpacity onPress={() => {
          setModoRecuperar(!modoRecuperar);
          setMensaje('');
        }}>
          <Text style={styles.linkRecuperar}>
            {modoRecuperar ? t('btnCancelarRecuperar') : t('btnOlvideContrasena')}
          </Text>
        </TouchableOpacity>

        {!modoRecuperar && (
          <>
            <TouchableOpacity 
              style={styles.googleButton}
              onPress={() => manejarLoginSocial('google')}
              disabled={cargando}
            >
              <Text style={styles.socialButtonText}>{t('btnGoogle')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.githubButton}
              onPress={() => manejarLoginSocial('github')}
              disabled={cargando}
            >
              <Text style={styles.socialButtonText}>{t('btnGithub')}</Text>
            </TouchableOpacity>

            <Text style={styles.linkRegistro} onPress={() => router.push('/(auth)/sign-up')}>
              {t('btnRegistro')}
            </Text>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fondo: { backgroundColor: '#FAFAFC' },
  scrollContainer: { flexGrow: 1, backgroundColor: '#FAFAFC' },
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  
  // ESTILOS NUEVOS PARA EL BOTÓN DE IDIOMA
  botonIdioma: {
    position: 'absolute',
    top: 50, 
    right: 20, 
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  textoIdioma: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C1C1E'
  },

  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', color: '#1C1C1E', marginTop: 20 },
  subtitle: { fontSize: 14, color: '#8E8E93', textAlign: 'center', marginBottom: 25, marginTop: 5 },
  input: { borderWidth: 1, borderColor: '#E5E5EA', padding: 14, marginBottom: 15, borderRadius: 8, backgroundColor: '#FFFFFF', fontSize: 16, color: '#1C1C1E' },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 8, padding: 4, marginBottom: 25 },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 6 },
  tabClienteActive: { backgroundColor: '#007bff' },
  tabProfActive: { backgroundColor: '#28a745' },
  textActive: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  textInactive: { color: '#666', fontSize: 14, fontWeight: '500' },
  
  botonPrincipal: { paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  textoBoton: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  
  linkRecuperar: { color: '#d9534f', marginTop: 20, textAlign: 'center', fontSize: 14, fontWeight: 'bold' },
  linkRegistro: { color: '#007bff', marginTop: 30, textAlign: 'center', fontSize: 15, fontWeight: '600' },
  
  textoMensaje: { marginTop: 15, textAlign: 'center', fontSize: 14, fontWeight: '600' },
  
  googleButton: { backgroundColor: '#DB4437', padding: 15, borderRadius: 8, marginTop: 25, alignItems: 'center' },
  githubButton: { backgroundColor: '#24292E', padding: 15, borderRadius: 8, marginTop: 10, alignItems: 'center' },
  socialButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
});