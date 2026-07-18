import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import ConfirmHcaptcha from '@hcaptcha/react-native-hcaptcha';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../theme/Colors';
import { Radius, Shadow, Spacing } from '../../theme/Spacing';
import { Typography } from '../../theme/Typography';

let HCaptchaWeb: any;
if (Platform.OS === 'web') {
  HCaptchaWeb = require('@hcaptcha/react-hcaptcha').default;
}

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  // ── Todo el estado original intacto ─────────────────────────
  const [portal, setPortal] = useState<'cliente' | 'profesionista'>('cliente');
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState<'info' | 'error' | 'exito' | ''>('');
  const [modoRecuperar, setModoRecuperar] = useState(false);
  const [mostrarPass, setMostrarPass] = useState(false);
  const captchaRef = useRef<any>(null);
  const [tokenWeb, setTokenWeb] = useState('');
  type AccionPendiente = { tipo: 'login', identificador: string, pass: string } | { tipo: 'social', proveedor: 'google' | 'github' } | { tipo: 'recovery', identificador: string } | null;
  const [accionPendiente, setAccionPendiente] = useState<AccionPendiente>(null);
  const SITE_KEY = process.env.EXPO_PUBLIC_HCAPTCHA_SITE_KEY || '10000000-ffff-ffff-ffff-000000000001';

  useEffect(() => {
    const limpiarFantasmas = async () => {
      const pending = await AsyncStorage.getItem('pending_oauth_portal');
      if (!pending) {
        // Solo limpiamos fantasmas si NO estamos en medio de un flujo OAuth
        if (Platform.OS === 'web' && window.location.hash.includes('access_token')) {
          return; // Tampoco limpiar si apenas llegó el hash y no se ha leído
        }
        await supabase.auth.signOut();
      }
    };
    limpiarFantasmas();

    const procesarSiHayPendiente = async (sessionData: any) => {
      const pendingPortal = await AsyncStorage.getItem('pending_oauth_portal');
      const pendingProvider = await AsyncStorage.getItem('pending_oauth_provider');
      if (pendingPortal && pendingProvider) {
        setCargando(true);
        await AsyncStorage.removeItem('pending_oauth_portal');
        await AsyncStorage.removeItem('pending_oauth_provider');
        try { await procesarUsuarioAutenticado(sessionData.user, pendingPortal, pendingProvider); }
        catch (err: any) { setMensaje('Error de sincronización: ' + err.message); setTipoMensaje('error'); setCargando(false); }
      }
    };

    if (Platform.OS === 'web') {
      // 1. Revisión manual
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          const pendingPortal = await AsyncStorage.getItem('pending_oauth_portal');
          if (pendingPortal) {
            procesarSiHayPendiente(session);
          }
        }
      });

      // 2. Suscripción por si el evento ocurre después
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          procesarSiHayPendiente(session);
        }
      });
      return () => { subscription.unsubscribe(); };
    }
  }, []);

  const cambiarIdioma = () => { i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es'); };

  const cambiarDePortal = (tipo: 'cliente' | 'profesionista') => {
    setPortal(tipo); setMensaje(''); setTipoMensaje(''); setIdentificador(''); setPassword('');
  };

  const procesarUsuarioAutenticado = async (usuarioRedSocial: any, portalElegido: string, proveedor: string) => {
    if (!usuarioRedSocial) throw new Error('Error al leer el perfil.');
    const idDelUsuario = usuarioRedSocial.id;
    const correo = usuarioRedSocial.email || `${idDelUsuario}@${proveedor}.com`;
    const nombreCompleto = usuarioRedSocial.user_metadata?.full_name || usuarioRedSocial.user_metadata?.name || 'Usuario';
    const fotoDePerfil = usuarioRedSocial.user_metadata?.avatar_url || usuarioRedSocial.user_metadata?.picture || null;
    const nombreUsuarioGenerado = (correo.split('@')[0] || 'user') + Math.floor(Math.random() * 100);
    setMensaje('Preparando tu espacio de trabajo...');
    if (portalElegido === 'cliente') {
      const { data: existeCliente } = await supabase.from('users').select('user_id, profile_picture').eq('user_id', idDelUsuario).maybeSingle();
      if (!existeCliente) {
        const { error: insertError } = await supabase.from('users').insert([{ user_id: idDelUsuario, username: nombreUsuarioGenerado, full_name: nombreCompleto, email: correo, profile_picture: fotoDePerfil, password_hash: 'PROTEGIDO_POR_RED_SOCIAL' }]);
        if (insertError) throw new Error('No se pudo crear la cuenta de cliente: ' + insertError.message);
        await supabase.from('social_logins').insert([{ user_id: idDelUsuario, provider: proveedor, provider_id: idDelUsuario }]);
      } else if (!existeCliente.profile_picture && fotoDePerfil) {
        await supabase.from('users').update({ profile_picture: fotoDePerfil }).eq('user_id', idDelUsuario);
      }
      await AsyncStorage.setItem('last_portal', 'cliente');
      router.replace('/(cliente)');
    } else {
      const { data: existeProf } = await supabase.from('professionals').select('prof_id, profile_picture').eq('prof_id', idDelUsuario).maybeSingle();
      if (!existeProf) {
        const { error: insertError } = await supabase.from('professionals').insert([{ prof_id: idDelUsuario, username: nombreUsuarioGenerado, full_name: nombreCompleto, email: correo, profile_picture: fotoDePerfil, speciality: 'Por definir', year_experience: 0, password_hash: 'PROTEGIDO_POR_RED_SOCIAL' }]);
        if (insertError) throw new Error('No se pudo crear la cuenta de profesionista: ' + insertError.message);
        await supabase.from('social_logins').insert([{ user_id: idDelUsuario, provider: proveedor, provider_id: idDelUsuario }]);
        await AsyncStorage.setItem('last_portal', 'profesionista');
        router.replace('/(profesionista)/perfil/editar');
        return;
      } else if (!existeProf.profile_picture && fotoDePerfil) {
        await supabase.from('professionals').update({ profile_picture: fotoDePerfil }).eq('prof_id', idDelUsuario);
      }
      await AsyncStorage.setItem('last_portal', 'profesionista');
      router.replace('/(profesionista)');
    }
  };

  const ejecutarLoginSocial = async (proveedor: 'google' | 'github') => {
    setMensaje(''); setCargando(true); setMensaje('Conectando con ' + proveedor + '...'); setTipoMensaje('info');
    try {
      await AsyncStorage.setItem('pending_oauth_portal', portal);
      await AsyncStorage.setItem('pending_oauth_provider', proveedor);

      if (Platform.OS === 'web') {
        const { error } = await supabase.auth.signInWithOAuth({ 
          provider: proveedor, 
          options: { 
            redirectTo: window.location.origin + '/sign-in',
            queryParams: { prompt: 'consent select_account' } 
          } 
        });
        if (error) throw error;
        return;
      }
      
      // 1. Generamos la URL de retorno dinámica (Uso de AuthSession para cerrar la pestaña automáticamente)
      const urlDeRegreso = AuthSession.makeRedirectUri({ path: 'sign-in' });
      console.log('URL de regreso móvil:', urlDeRegreso);
      
      // 2. Iniciamos el proceso OAuth con Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({ 
        provider: proveedor, 
        options: { 
          redirectTo: urlDeRegreso, 
          skipBrowserRedirect: true, 
          queryParams: { prompt: 'consent select_account' } 
        } 
      });
      if (error) throw error;
      
      // 3. Abrimos el navegador interno del celular
      if (data?.url) {
        const resultado = await WebBrowser.openAuthSessionAsync(data.url, urlDeRegreso);
        if (Platform.OS === 'android') WebBrowser.dismissBrowser();
        
        // 4. Extraemos tokens si el usuario terminó el login
        if (resultado.type === 'success' && resultado.url) {
          setMensaje('Verificando llaves de seguridad...');
          
          // Soporte tanto para parseo oficial como fallback manual para hash de Supabase
          const parsedUrl = Linking.parse(resultado.url);
          const paramsFromLinking = parsedUrl.queryParams || {};
          
          let accessToken = paramsFromLinking.access_token;
          let refreshToken = paramsFromLinking.refresh_token;

          if (!accessToken && resultado.url.includes('#')) {
            const hashParams = new URLSearchParams(resultado.url.split('#')[1]);
            accessToken = hashParams.get('access_token') || undefined;
            refreshToken = hashParams.get('refresh_token') || undefined;
          }

          if (!accessToken || !refreshToken) {
            throw new Error('Faltan los tokens de acceso en el regreso (OAuth fallido o incompleto).');
          }
          
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({ 
            access_token: accessToken as string, 
            refresh_token: refreshToken as string 
          });
          
          if (sessionError) throw sessionError;
          try { await procesarUsuarioAutenticado(sessionData.user, portal, proveedor); }
          catch (err: any) { setMensaje('Error de sincronización: ' + err.message); setTipoMensaje('error'); setCargando(false); }
        } else {
           setCargando(false);
        }
      } else {
          setCargando(false);
      }
    } catch (error: any) {
      setMensaje('Error: ' + (error.message || `No se pudo iniciar sesión con ${proveedor}`));
      setTipoMensaje('error');
      setCargando(false);
    }
  };

  const ejecutarAccion = (accion: AccionPendiente, token: string) => {
    if (!accion) return;
    if (accion.tipo === 'login') ejecutarLoginPassword(accion.identificador, accion.pass, token);
    else if (accion.tipo === 'recovery') ejecutarRecuperarPassword(accion.identificador, token);
    setAccionPendiente(null); setTokenWeb('');
  };

  const procesarAccionConCaptcha = (accion: AccionPendiente) => {
    setAccionPendiente(accion);
    if (process.env.EXPO_PUBLIC_TEST_MODE === 'true') { ejecutarAccion(accion, 'dummy-token-para-pruebas'); return; }
    if (Platform.OS === 'web') { if (tokenWeb) ejecutarAccion(accion, tokenWeb); else captchaRef.current?.execute(); }
    else { captchaRef.current?.show(); }
  };

  const manejarLoginSocial = (proveedor: 'google' | 'github') => { ejecutarLoginSocial(proveedor); };

  const handleLogin = () => {
    setMensaje('');
    const entradaLimpia = identificador.trim();
    if (!entradaLimpia || !password) { setMensaje('Faltan datos: Escribe tu correo/usuario y contraseña.'); setTipoMensaje('error'); return; }
    procesarAccionConCaptcha({ tipo: 'login', identificador: entradaLimpia, pass: password });
  };

  const ejecutarLoginPassword = async (entradaLimpia: string, pass: string, tokenCaptcha: string) => {
    setCargando(true); setMensaje('Iniciando sesión...'); setTipoMensaje('info');
    try {
      let correoFinal = entradaLimpia;
      const esCorreo = entradaLimpia.includes('@');
      if (!esCorreo) {
        if (portal === 'cliente') {
          const { data: u } = await supabase.from('users').select('email').eq('username', entradaLimpia).maybeSingle();
          if (u) correoFinal = u.email; else throw new Error('No existe un cliente con ese nombre de usuario.');
        } else {
          const { data: p } = await supabase.from('professionals').select('email').eq('username', entradaLimpia).maybeSingle();
          if (p) correoFinal = p.email; else throw new Error('No existe un profesionista con ese nombre de usuario.');
        }
      }
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email: correoFinal, password: pass, options: { captchaToken: tokenCaptcha } });
      if (authError) throw new Error('Acceso denegado. Revisa tu contraseña o intenta recuperar tu cuenta.');
      const idDelUsuario = authData.user.id;
      const metadatos = authData.user.user_metadata;
      const rolOriginal = metadatos.rol_temporal;
      if (rolOriginal && rolOriginal !== portal) { await supabase.auth.signOut(); throw new Error(`Esta cuenta no está disponible, haz el intento en el otro portal.`); }
      if (portal === 'cliente') {
        const { data: existeCliente } = await supabase.from('users').select('user_id').eq('user_id', idDelUsuario).maybeSingle();
        if (!existeCliente) {
          setMensaje('Configurando tu nuevo perfil de cliente...');
          const { error: dbError } = await supabase.from('users').insert([{ user_id: idDelUsuario, username: metadatos.username_temporal || correoFinal.split('@')[0], full_name: metadatos.fullname_temporal || 'Usuario', email: correoFinal, phone: metadatos.phone_temporal, password_hash: 'PROTEGIDO_POR_AUTH' }]);
          if (dbError) throw new Error('No se pudo crear el perfil en la base de datos.');
        }
        await AsyncStorage.setItem('last_portal', 'cliente');
        router.replace('/(cliente)');
      } else {
        const { data: existeProf } = await supabase.from('professionals').select('prof_id').eq('prof_id', idDelUsuario).maybeSingle();
        if (!existeProf) {
          setMensaje('Configurando tu nuevo perfil profesional...');
          const { error: profError } = await supabase.from('professionals').insert([{ prof_id: idDelUsuario, username: metadatos.username_temporal || correoFinal.split('@')[0], full_name: metadatos.fullname_temporal || 'Usuario', email: correoFinal, phone: metadatos.phone_temporal, speciality: metadatos.speciality_temporal || 'Por definir', password_hash: 'PROTEGIDO_POR_AUTH' }]);
          if (profError) throw new Error('No se pudo guardar tus datos.');
          setMensaje('Vinculando documentos de seguridad...');
          const docs = [];
          if (metadatos.ine_temporal) docs.push({ prof_id: idDelUsuario, document_type: 'INE', file_url: metadatos.ine_temporal });
          if (metadatos.cedula_temporal) docs.push({ prof_id: idDelUsuario, document_type: 'Cédula Profesional', file_url: metadatos.cedula_temporal });
          if (metadatos.certificado_temporal) docs.push({ prof_id: idDelUsuario, document_type: 'Certificado', file_url: metadatos.certificado_temporal });
          if (docs.length > 0) {
            await supabase.from('professional_documents').insert(docs);
          }
        }
        await AsyncStorage.setItem('last_portal', 'profesionista');
        router.replace('/(profesionista)');
      }
    } catch (error: any) {
      setMensaje(error.message || 'Ocurrió un error inesperado al entrar.');
      setTipoMensaje('error');
    } finally { setCargando(false); }
  };

  const handleSolicitarRecuperacion = () => {
    setMensaje('');
    const entradaLimpia = identificador.trim();
    if (!entradaLimpia) { setMensaje('Escribe tu correo o usuario para enviarte el código.'); setTipoMensaje('error'); return; }
    procesarAccionConCaptcha({ tipo: 'recovery', identificador: entradaLimpia });
  };

  const ejecutarRecuperarPassword = async (entradaLimpia: string, tokenCaptcha: string) => {
    setCargando(true); setMensaje('Enviando código de recuperación...'); setTipoMensaje('info');
    try {
      let correoFinal = entradaLimpia;
      const esCorreo = entradaLimpia.includes('@');
      if (!esCorreo) {
        const tabla = portal === 'cliente' ? 'users' : 'professionals';
        const { data: usuario } = await supabase.from(tabla).select('email').eq('username', entradaLimpia).maybeSingle();
        if (usuario) correoFinal = usuario.email; else throw new Error('No encontramos una cuenta con ese nombre de usuario.');
      }
      const { error } = await supabase.auth.resetPasswordForEmail(correoFinal, { captchaToken: tokenCaptcha });
      if (error) throw error;
      setMensaje('¡Listo! Revisa tu correo, te hemos enviado un código.');
      setTipoMensaje('exito');
      setTimeout(() => { router.push({ pathname: '/(auth)/reset-password', params: { correoParam: correoFinal } }); }, 2000);
    } catch (error: any) {
      setMensaje('Error: ' + (error.message || 'No se pudo enviar el correo de recuperación.'));
      setTipoMensaje('error');
    } finally { setCargando(false); }
  };

  // ── UI ──────────────────────────────────────────────────────
  const esCliente = portal === 'cliente';
  const colorMensaje = tipoMensaje === 'error' ? Colors.error.main : tipoMensaje === 'exito' ? Colors.success.main : Colors.info.main;
  const bgMensaje    = tipoMensaje === 'error' ? Colors.error.light : tipoMensaje === 'exito' ? Colors.success.light : Colors.info.light;

  return (
    <LinearGradient
      colors={['#ffffff', '#ede9fe', '#7c3aed']}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.fondo}
    >
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

      {/* Botón volver */}
      <TouchableOpacity style={styles.volverBtn} onPress={() => router.replace('/(auth)/landing')}>
        <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
      </TouchableOpacity>

      {/* Botón idioma */}
      <TouchableOpacity style={styles.idiomaBtn} onPress={cambiarIdioma}>
        <Text style={styles.idiomaTxt}>{i18n.language === 'es' ? 'EN' : 'ES'}</Text>
      </TouchableOpacity>

      {/* Cabecera con logo */}
      <View style={styles.header}>
        <Image source={require('../../../assets/images/logo.png')} style={styles.logoImg} resizeMode="contain" />
        <Text style={styles.logoText}>ProFinder</Text>
        <Text style={styles.tagline}>{t('connectingVisionaries', 'Connecting visionaries with experts.')}</Text>
      </View>

      {/* Card del formulario */}
      <View style={styles.card}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{modoRecuperar ? t('recuperaAcceso') : t('bienvenidoDeNuevo', 'Bienvenido de nuevo')}</Text>
        <Text style={styles.subtitle}>{modoRecuperar ? t('ingresaCorreoRecuperar', 'Ingresa tu correo o usuario para recuperar tu cuenta.') : t('iniciaSesion')}</Text>

        {/* Selector portal */}
        <View style={styles.portalSelector}>
          <TouchableOpacity style={[styles.portalTab, esCliente && styles.portalTabActive]} onPress={() => cambiarDePortal('cliente')} disabled={cargando}>
            <Ionicons name="person-outline" size={15} color={esCliente ? '#fff' : Colors.text.secondary} />
            <Text style={[styles.portalTabTxt, esCliente && styles.portalTabTxtActive]}>{t('soyCliente')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.portalTab, !esCliente && styles.portalTabActive]} onPress={() => cambiarDePortal('profesionista')} disabled={cargando}>
            <Ionicons name="briefcase-outline" size={15} color={!esCliente ? '#fff' : Colors.text.secondary} />
            <Text style={[styles.portalTabTxt, !esCliente && styles.portalTabTxtActive]}>{t('soyProfesionista')}</Text>
          </TouchableOpacity>
        </View>

        {/* Input correo */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('correoOUser', 'Correo electrónico o Usuario')}</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={17} color={Colors.text.disabled} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder={t('ejemploCorreo', 'nombre@ejemplo.com')} placeholderTextColor={Colors.text.disabled} value={identificador} onChangeText={setIdentificador} autoCapitalize="none" editable={!cargando} />
          </View>
        </View>

        {/* Input contraseña */}
        {!modoRecuperar && (
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>{t('contrasenaLabel', 'Contraseña')}</Text>
              <TouchableOpacity onPress={() => { setModoRecuperar(true); setMensaje(''); }}>
                <Text style={styles.forgotLink}>{t('btnOlvideContrasena', '¿Olvidaste tu contraseña?')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={17} color={Colors.text.disabled} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={Colors.text.disabled} value={password} onChangeText={setPassword} secureTextEntry={!mostrarPass} editable={!cargando} />
              <Pressable onPress={() => setMostrarPass(v => !v)} style={styles.eyeBtn}>
                <Ionicons name={mostrarPass ? 'eye-off-outline' : 'eye-outline'} size={17} color={Colors.text.disabled} />
              </Pressable>
            </View>
          </View>
        )}

        {/* hCaptcha Web */}
        {Platform.OS === 'web' && (
          <HCaptchaWeb ref={captchaRef} sitekey={SITE_KEY} size="invisible"
            onVerify={(token: string) => { setTokenWeb(token); setMensaje(''); if (accionPendiente) ejecutarAccion(accionPendiente, token); }}
            onError={() => { setCargando(false); setMensaje('Falló la verificación de seguridad. Intenta nuevamente.'); setTipoMensaje('error'); }}
          />
        )}

        {/* hCaptcha Móvil */}
        {!modoRecuperar && Platform.OS !== 'web' && (
          <ConfirmHcaptcha ref={captchaRef} siteKey={SITE_KEY} size="invisible" baseUrl="https://profinder-a-new-era-1.onrender.com" languageCode={i18n.language || 'es'}
            onMessage={(event: any) => {
              if (event && event.nativeEvent.data) {
                const msj = event.nativeEvent.data;
                if (['cancel', 'error', 'expired'].includes(msj)) { setMensaje(`Captcha ${msj}.`); setTipoMensaje('error'); }
                else if (msj.length > 20) { if (accionPendiente) ejecutarAccion(accionPendiente, msj); }
              }
            }}
          />
        )}

        {/* Mensaje de estado */}
        {mensaje !== '' && (
          <View style={[styles.mensajeBox, { backgroundColor: bgMensaje }]}>
            <Ionicons name={tipoMensaje === 'error' ? 'alert-circle-outline' : tipoMensaje === 'exito' ? 'checkmark-circle-outline' : 'information-circle-outline'} size={16} color={colorMensaje} />
            <Text style={[styles.mensajeTxt, { color: colorMensaje }]}>{mensaje}</Text>
          </View>
        )}

        {/* Botón principal */}
        <TouchableOpacity testID="btn-login" style={styles.mainBtn} onPress={modoRecuperar ? handleSolicitarRecuperacion : handleLogin} disabled={cargando}>
          {cargando ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBtnTxt}>{modoRecuperar ? t('btnEnviarCodigo') : t('btnEntrar')}</Text>}
        </TouchableOpacity>

        {/* Cancelar recuperación */}
        {modoRecuperar && (
          <TouchableOpacity style={styles.cancelRow} onPress={() => { setModoRecuperar(false); setMensaje(''); }}>
            <Text style={styles.cancelTxt}>{t('btnCancelarRecuperar') || 'Cancelar'}</Text>
          </TouchableOpacity>
        )}

        {/* Redes sociales */}
        {!modoRecuperar && (
          <>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerTxt}>{t('o continua con', 'o continúa con')}</Text>
              <View style={styles.dividerLine} />
            </View>
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn} onPress={() => manejarLoginSocial('google')} disabled={cargando}>
                <Ionicons name="logo-google" size={17} color="#DB4437" />
                <Text style={styles.socialBtnTxt}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialBtn, styles.socialBtnGithub]} onPress={() => manejarLoginSocial('github')} disabled={cargando}>
                <Ionicons name="logo-github" size={17} color="#fff" />
                <Text style={[styles.socialBtnTxt, { color: '#fff' }]}>GitHub</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.registerRow}>
              <Text style={styles.registerTxt}>{t('No tienes cuenta', '¿No tienes una cuenta?')} </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
                <Text style={styles.registerLink}>{t('btnRegistro') || 'Regístrate gratis'}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        </ScrollView>
      </View>

      <Text style={styles.footer}>{t('footerText', '© 2024 ProFinder. Conectando visionarios con expertos.')}</Text>
    </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fondo:  { flex: 1 },
  scroll: { flexGrow: 1, paddingVertical: Spacing[8], justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing[5] },

  volverBtn: { position: 'absolute', top: 48, left: 20, backgroundColor: 'rgba(255,255,255,0.85)', padding: 8, borderRadius: Radius.full, zIndex: 10, ...Shadow.sm },
  idiomaBtn: { position: 'absolute', top: 48, right: 20, backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, zIndex: 10, ...Shadow.sm },
  idiomaTxt: { ...Typography.styles.label, color: Colors.text.primary },

  header:   { alignItems: 'center', marginBottom: Spacing[4] },
  logoImg:  { width: 56, height: 56, marginBottom: Spacing[1] },
  logoText: { ...Typography.styles.h4, color: '#374151' },
  tagline:  { ...Typography.styles.bodySm, color: '#6B7280', marginTop: 2 },

  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: Spacing[5],
    width: 380,
    height: 520,
    ...Shadow.lg,
    shadowColor: '#4c1d95',
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
    overflow: 'hidden',
  },

  title:    { ...Typography.styles.h4, color: Colors.text.primary, textAlign: 'center', marginBottom: 2 },
  subtitle: { ...Typography.styles.bodySm, color: Colors.text.secondary, textAlign: 'center', marginBottom: Spacing[4] },

  portalSelector:     { flexDirection: 'row', backgroundColor: Colors.neutral[100], borderRadius: Radius.md, padding: 3, gap: 3, marginBottom: Spacing[4] },
  portalTab:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: Radius.sm, gap: 5 },
  portalTabActive:    { backgroundColor: Colors.primary[600], ...Shadow.sm },
  portalTabTxt:       { ...Typography.styles.btn, color: Colors.text.secondary, fontSize: 13 },
  portalTabTxtActive: { color: '#fff' },

  inputGroup:    { marginBottom: Spacing[3] },
  inputLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  inputLabel:    { ...Typography.styles.label, color: Colors.text.secondary, textTransform: 'none', letterSpacing: 0, fontSize: 12 },
  forgotLink:    { ...Typography.styles.bodySm, color: Colors.primary[600], fontSize: 12 },
  inputWrap:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.border.default, borderRadius: Radius.input, minHeight: 44 },
  inputIcon:     { paddingLeft: 12 },
  input:         { flex: 1, paddingHorizontal: 8, paddingVertical: 10, ...Typography.styles.body, color: Colors.text.primary },
  eyeBtn:        { paddingRight: 12, padding: 4 },

  mensajeBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: Radius.md, padding: Spacing[2], marginBottom: Spacing[2] },
  mensajeTxt: { ...Typography.styles.bodySm, flex: 1, fontSize: 12 },

  mainBtn:    { backgroundColor: Colors.primary[600], paddingVertical: 13, borderRadius: Radius.button, alignItems: 'center', marginTop: Spacing[1], ...Shadow.brand },
  mainBtnTxt: { ...Typography.styles.btn, color: '#fff' },

  cancelRow: { alignItems: 'center', marginTop: Spacing[3] },
  cancelTxt: { ...Typography.styles.bodySm, color: Colors.text.secondary },

  dividerRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: Spacing[4] },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border.default },
  dividerTxt:  { ...Typography.styles.caption, color: Colors.text.disabled },

  socialRow:       { flexDirection: 'row', gap: Spacing[2] },
  socialBtn:       { flex: 1, flexDirection: 'row', paddingVertical: 10, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: Colors.border.default, backgroundColor: '#fff' },
  socialBtnGithub: { backgroundColor: '#24292E', borderColor: '#24292E' },
  socialBtnTxt:    { ...Typography.styles.btn, color: Colors.text.primary, fontSize: 13 },

  registerRow:  { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing[4] },
  registerTxt:  { ...Typography.styles.bodySm, color: Colors.text.secondary },
  registerLink: { ...Typography.styles.bodySm, color: Colors.primary[600], fontWeight: '600' },

  footer: { ...Typography.styles.caption, color: Colors.text.disabled, textAlign: 'center', marginTop: Spacing[5] },
});
