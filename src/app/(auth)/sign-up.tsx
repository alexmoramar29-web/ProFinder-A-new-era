import { Ionicons } from '@expo/vector-icons';
import ConfirmHcaptcha from '@hcaptcha/react-native-hcaptcha';
import { Picker } from '@react-native-picker/picker';
import { decode } from 'base64-arraybuffer';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../theme/Colors';
import { Radius, Shadow, Spacing } from '../../theme/Spacing';
import { Typography } from '../../theme/Typography';
import LegalModal from '../../components/LegalModal';
import { LEGAL_TEXTS, LEGAL_TEXTS_EN } from '../../constants/LegalTexts';

let HCaptchaWeb: any;
if (Platform.OS === 'web') {
  HCaptchaWeb = require('@hcaptcha/react-hcaptcha').default;
}

export default function SignUpScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  // ── Todo el estado original intacto ─────────────────────────
  const [rol, setRol] = useState<'cliente' | 'profesionista'>('cliente');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [speciality, setSpeciality] = useState('Doctor');
  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [ineDoc, setIneDoc] = useState<any>(null);
  const [cedulaDoc, setCedulaDoc] = useState<any>(null);
  const [certificadoDoc, setCertificadoDoc] = useState<any>(null);
  const [mostrarPass, setMostrarPass] = useState(false);
  const [mostrarConfirm, setMostrarConfirm] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  
  // Estado para los modales legales
  const [modalLegal, setModalLegal] = useState<{ visible: boolean; tipo: 'terminos' | 'privacidad' | null }>({ visible: false, tipo: null });
  
  const captchaRef = useRef<any>(null);
  const SITE_KEY = process.env.EXPO_PUBLIC_HCAPTCHA_SITE_KEY || '10000000-ffff-ffff-ffff-000000000001';

  // ── Toda la lógica original intacta ─────────────────────────
  const seleccionarDocumento = async (tipo: 'ine' | 'cedula' | 'certificado') => {
    setMensajeError('');
    try {
      const resultado = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (!resultado.canceled && resultado.assets.length > 0) {
        const archivo = resultado.assets[0];
        if (archivo.size && archivo.size > 2 * 1024 * 1024) return setMensajeError('El PDF debe pesar menos de 2MB.');
        if (tipo === 'ine') setIneDoc(archivo);
        if (tipo === 'cedula') setCedulaDoc(archivo);
        if (tipo === 'certificado') setCertificadoDoc(archivo);
      }
    } catch (e) { setMensajeError('No se pudo abrir el selector de documentos.'); }
  };

  const subirDocumentoAlAlmacen = async (archivo: any, nombreArchivo: string): Promise<string> => {
    try {
      if (Platform.OS === 'web') {
        const { error } = await supabase.storage.from('profesionales-documentos').upload(nombreArchivo, archivo.file, { contentType: 'application/pdf' });
        if (error) throw error;
      } else {
        const fileInfo = await FileSystem.getInfoAsync(archivo.uri);
        if (!fileInfo.exists) throw new Error('No se pudo leer el archivo local.');
        const base64 = await FileSystem.readAsStringAsync(archivo.uri, { encoding: 'base64' });
        const { error } = await supabase.storage.from('profesionales-documentos').upload(nombreArchivo, decode(base64), { contentType: 'application/pdf', upsert: true });
        if (error) throw error;
      }
      const { data } = supabase.storage.from('profesionales-documentos').getPublicUrl(nombreArchivo);
      return data.publicUrl;
    } catch (error: any) { throw new Error(`Fallo al subir documento: ${error.message}`); }
  };

  const handleRegistro = () => {
    setMensajeError(''); setMensajeExito('');
    const correoLimpio = email.trim();
    const usuarioLimpio = username.trim();
    if (!usuarioLimpio || !fullName || !correoLimpio || !password || !confirmPassword) return setMensajeError('Faltan datos: Todos los campos son obligatorios.');
    if (password.length < 8) return setMensajeError(t('errContrasenaDebil'));
    if (password !== confirmPassword) return setMensajeError(t('errContrasenaNoCoincide'));
    if (rol === 'profesionista' && (!ineDoc || !cedulaDoc || !certificadoDoc)) return setMensajeError(t('errDocsIncompletos'));
    if (!aceptaTerminos) return setMensajeError(t('errAceptaTerminos'));
    if (process.env.EXPO_PUBLIC_TEST_MODE === 'true') { ejecutarRegistro('dummy-token-para-pruebas'); return; }
    if (Platform.OS === 'web') captchaRef.current?.execute();
    else captchaRef.current?.show();
  };

  const ejecutarRegistro = async (tokenCaptcha: string) => {
    const correoLimpio = email.trim();
    const usuarioLimpio = username.trim();
    const telefonoLimpio = phone.trim();
    setCargando(true);
    try {
      let urlIneFinal = null, urlCedulaFinal = null, urlCertificadoFinal = null;
      if (rol === 'profesionista') {
        setMensajeExito(t('msgGuardandoDocs'));
        const tiempo = Date.now();
        urlIneFinal = await subirDocumentoAlAlmacen(ineDoc, `ine_${usuarioLimpio}_${tiempo}.pdf`);
        urlCedulaFinal = await subirDocumentoAlAlmacen(cedulaDoc, `cedula_${usuarioLimpio}_${tiempo}.pdf`);
        urlCertificadoFinal = await subirDocumentoAlAlmacen(certificadoDoc, `cert_${usuarioLimpio}_${tiempo}.pdf`);
      }
      setMensajeExito(t('msgCreandoGafete'));
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: correoLimpio, password,
        options: {
          emailRedirectTo: 'profinder://',
          captchaToken: tokenCaptcha,
          data: {
            rol_temporal: rol, username_temporal: usuarioLimpio, fullname_temporal: fullName,
            phone_temporal: telefonoLimpio || null, speciality_temporal: rol === 'profesionista' ? speciality : null,
            ine_temporal: urlIneFinal, cedula_temporal: urlCedulaFinal, certificado_temporal: urlCertificadoFinal,
          }
        }
      });
      if (authError) { if (authError.message.includes('already registered')) throw new Error(t('errCorreoExiste')); throw authError; }
      if (!authData.user) throw new Error(t('errCuentaLimite'));
      
      if (authData.session) {
        setMensajeExito(t('msgCuentaCreadaDirecto'));
      } else {
        setMensajeExito(t('msgCuentaCreadaCorreo'));
        setTimeout(() => router.replace('/(auth)/sign-in'), 4000);
      }
    } catch (error: any) { setMensajeError(error.message || t('errInesperado'));
    } finally { setCargando(false); }
  };

  // ── UI ──────────────────────────────────────────────────────
  const esCliente = rol === 'cliente';

  return (
    <LinearGradient colors={['#ffffff', '#ede9fe', '#7c3aed']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.fondo}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Botón volver */}
        <TouchableOpacity style={styles.volverBtn} onPress={() => router.replace('/(auth)/landing')}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>

        {/* Cabecera */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('creaTuCuenta') || 'Crea tu cuenta'}</Text>
          <Text style={styles.headerSub}>{t('uneteRed', 'Únete a la red de profesionales más grande')}</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>

          {/* Selector de rol */}
          <View style={styles.rolSelector}>
            <TouchableOpacity
              style={[styles.rolTab, esCliente && styles.rolTabActive]}
              onPress={() => setRol('cliente')} disabled={cargando}
            >
              <Ionicons name="person-outline" size={16} color={esCliente ? '#fff' : Colors.text.secondary} />
              <Text style={[styles.rolTabTxt, esCliente && styles.rolTabTxtActive]}>{t('soyCliente')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rolTab, !esCliente && styles.rolTabActive]}
              onPress={() => setRol('profesionista')} disabled={cargando}
            >
              <Ionicons name="briefcase-outline" size={16} color={!esCliente ? '#fff' : Colors.text.secondary} />
              <Text style={[styles.rolTabTxt, !esCliente && styles.rolTabTxtActive]}>{t('soyProfesionista')}</Text>
            </TouchableOpacity>
          </View>

          {/* Nombre completo */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('nombreCompleto') || 'Nombre completo'}</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={16} color={Colors.text.disabled} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Ej. Juan Pérez" placeholderTextColor={Colors.text.disabled} value={fullName} onChangeText={setFullName} maxLength={100} editable={!cargando} />
            </View>
          </View>

          {/* Nombre de usuario */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('nombreUsuario') || 'Nombre de usuario'}</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="at-outline" size={16} color={Colors.text.disabled} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="ej. juanperez123" placeholderTextColor={Colors.text.disabled} value={username} onChangeText={setUsername} autoCapitalize="none" maxLength={50} editable={!cargando} />
            </View>
          </View>

          {/* Correo */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('correoElectronico') || 'Correo electrónico'}</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={16} color={Colors.text.disabled} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="nombre@empresa.com" placeholderTextColor={Colors.text.disabled} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" maxLength={100} editable={!cargando} />
            </View>
          </View>

          {/* Teléfono */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('telefonoPlaceholder') || 'Teléfono'}</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={16} color={Colors.text.disabled} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="+52 123 456 7890" placeholderTextColor={Colors.text.disabled} value={phone} onChangeText={(t) => setPhone(t.replace(/[^0-9+]/g, ''))} keyboardType="phone-pad" maxLength={13} editable={!cargando} />
            </View>
          </View>

          {/* Selector de profesión (solo profesionista) */}
          {!esCliente && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('seleccionaProfesion') || 'Selecciona tu profesión'}</Text>
              <View style={styles.pickerWrap}>
                <Picker selectedValue={speciality} onValueChange={(v: string) => setSpeciality(v)} enabled={!cargando} style={styles.picker}>
                  <Picker.Item label={t('Doctor', 'Doctor')} value="Doctor" />
                  <Picker.Item label={t('Abogado', 'Abogado')} value="Abogado" />
                  <Picker.Item label={t('Dentista', 'Dentista')} value="Dentista" />
                  <Picker.Item label={t('Ingeniero en Sistemas (Hardware)', 'Ingeniero en Sistemas (Hardware)')} value="Ingeniero en Sistemas Hardware" />
                  <Picker.Item label={t('Ingeniero en Sistemas (Software)', 'Ingeniero en Sistemas (Software)')} value="Ingeniero en Sistemas Software" />
                  <Picker.Item label={t('Ingeniero Civil', 'Ingeniero Civil')} value="Ingeniero Civil" />
                  <Picker.Item label={t('Arquitecto', 'Arquitecto')} value="Arquitecto" />
                  <Picker.Item label={t('Otro', 'Otro')} value="Otro" />
                </Picker>
              </View>
            </View>
          )}

          {/* Contraseña */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('contrasenaMinimo') || 'Contraseña'}</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={16} color={Colors.text.disabled} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder={t('min8caracteres', 'Mínimo 8 caracteres')} placeholderTextColor={Colors.text.disabled} value={password} onChangeText={setPassword} secureTextEntry={!mostrarPass} maxLength={50} editable={!cargando} />
              <Pressable onPress={() => setMostrarPass(v => !v)} style={styles.eyeBtn}>
                <Ionicons name={mostrarPass ? 'eye-off-outline' : 'eye-outline'} size={16} color={Colors.text.disabled} />
              </Pressable>
            </View>
          </View>

          {/* Confirmar contraseña */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('confirmarContrasena') || 'Confirmar contraseña'}</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={16} color={Colors.text.disabled} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder={t('repiteNuevaClave', 'Repite tu contraseña')} placeholderTextColor={Colors.text.disabled} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!mostrarConfirm} maxLength={50} editable={!cargando} />
              <Pressable onPress={() => setMostrarConfirm(v => !v)} style={styles.eyeBtn}>
                <Ionicons name={mostrarConfirm ? 'eye-off-outline' : 'eye-outline'} size={16} color={Colors.text.disabled} />
              </Pressable>
            </View>
          </View>

          {/* Documentos (solo profesionista) */}
          {!esCliente && (
            <View style={styles.docsSection}>
              <Text style={styles.docsSectionTitle}>{t('docsObligatorios') || 'Documentos obligatorios'}</Text>

              {[
                { label: t('elegirIne') || 'Elegir foto de INE', labelCambiar: t('cambiarIne') || 'Cambiar INE', doc: ineDoc, tipo: 'ine' as const },
                { label: t('elegirCedula') || 'Elegir foto de Cédula', labelCambiar: t('cambiarCedula') || 'Cambiar Cédula', doc: cedulaDoc, tipo: 'cedula' as const },
                { label: t('elegirCertificado') || 'Elegir foto de Certificado', labelCambiar: t('cambiarCertificado') || 'Cambiar Certificado', doc: certificadoDoc, tipo: 'certificado' as const },
              ].map((item) => (
                <View key={item.tipo} style={styles.docBox}>
                  <TouchableOpacity
                    style={[styles.docBtn, item.doc && styles.docBtnOk]}
                    onPress={() => seleccionarDocumento(item.tipo)}
                    disabled={cargando}
                  >
                    <Ionicons name={item.doc ? 'checkmark-circle' : 'cloud-upload-outline'} size={18} color={item.doc ? Colors.success.main : Colors.text.disabled} />
                    <Text style={[styles.docBtnTxt, item.doc && styles.docBtnTxtOk]}>
                      {item.doc ? item.labelCambiar : item.label}
                    </Text>
                  </TouchableOpacity>
                  {item.doc && (
                    <TouchableOpacity onPress={() => Linking.openURL(item.doc.uri)} style={styles.docVerLink}>
                      <Ionicons name="eye-outline" size={13} color={Colors.primary[600]} />
                      <Text style={styles.docVerTxt}>{t('verPdf') || 'Ver PDF'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Términos y condiciones */}
          <View style={styles.terminosRow}>
            <Pressable style={styles.checkboxContainer} onPress={() => setAceptaTerminos(v => !v)}>
              <View style={[styles.checkbox, aceptaTerminos && styles.checkboxOn]}>
                {aceptaTerminos && <Ionicons name="checkmark" size={11} color="#fff" />}
              </View>
            </Pressable>
            <Text style={styles.terminosTxt} onPress={() => setAceptaTerminos(v => !v)}>
              {t('aceptoLos', 'Acepto los')}{' '}
              <Text 
                style={styles.terminosLink} 
                onPress={(e) => { e.stopPropagation(); setModalLegal({ visible: true, tipo: 'terminos' }); }}
              >
                {t('terminosCondiciones', 'Términos y Condiciones')}
              </Text>{' '}
              {t('yEl', 'y el')}{' '}
              <Text 
                style={styles.terminosLink} 
                onPress={(e) => { e.stopPropagation(); setModalLegal({ visible: true, tipo: 'privacidad' }); }}
              >
                {t('avisoPrivacidad', 'Aviso de Privacidad')}
              </Text>{' '}
              {t('deProFinder', 'de ProFinder.')}
            </Text>
          </View>

          {/* Mensajes */}
          {mensajeError !== '' && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={15} color={Colors.error.main} />
              <Text style={styles.errorTxt}>{mensajeError}</Text>
            </View>
          )}
          {mensajeExito !== '' && (
            <View style={styles.exitoBox}>
              <Ionicons name="checkmark-circle-outline" size={15} color={Colors.success.main} />
              <Text style={styles.exitoTxt}>{mensajeExito}</Text>
            </View>
          )}

          {/* Botón principal */}
          <TouchableOpacity style={[styles.mainBtn, cargando && { opacity: 0.7 }]} onPress={handleRegistro} disabled={cargando}>
            <Text style={styles.mainBtnTxt}>{cargando ? t('procesando') || 'Procesando...' : t('btnRegistrarme') || 'Registrarse'}</Text>
          </TouchableOpacity>

          {/* Link a sign in */}
          <View style={styles.loginRow}>
            <Text style={styles.loginTxt}>{t('yaTienesCuenta', '¿Ya tienes una cuenta?')} </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in')} disabled={cargando}>
              <Text style={styles.loginLink}>{t('yaTengoCuenta') || 'Inicia Sesión'}</Text>
            </TouchableOpacity>
          </View>

          {/* hCaptcha Web */}
          {Platform.OS === 'web' && (
            <HCaptchaWeb ref={captchaRef} sitekey={SITE_KEY} size="invisible"
              onVerify={(token: string) => { ejecutarRegistro(token); }}
              onError={() => { setCargando(false); setMensajeError('Falló la verificación de seguridad. Intenta nuevamente.'); }}
            />
          )}

          {/* hCaptcha Móvil */}
          {Platform.OS !== 'web' && (
            <ConfirmHcaptcha ref={captchaRef} siteKey={SITE_KEY} baseUrl="https://hcaptcha.com" languageCode="es" size="invisible"
              onMessage={(event: any) => {
                if (event && event.nativeEvent.data) {
                  if (['cancel', 'error', 'expired'].includes(event.nativeEvent.data)) { setCargando(false); setMensajeError('Falló la verificación de seguridad. Intenta nuevamente.'); return; }
                  ejecutarRegistro(event.nativeEvent.data);
                }
              }}
            />
          )}
        </View>

        <Text style={styles.footer}>{t('footerText', '© 2024 ProFinder. Conectando visionarios con expertos.')}</Text>
      </ScrollView>

      {/* Modal de Textos Legales movido fuera del ScrollView para que sea fijo */}
      <LegalModal
        visible={modalLegal.visible}
        titulo={modalLegal.tipo === 'terminos' ? (t('terminosCondiciones') || 'Términos y Condiciones') : (t('avisoPrivacidad') || 'Aviso de Privacidad')}
        contenido={
          modalLegal.tipo === 'terminos' 
            ? (i18n.language === 'en' ? LEGAL_TEXTS_EN[rol].terminos : LEGAL_TEXTS[rol].terminos) 
            : modalLegal.tipo === 'privacidad' 
              ? (i18n.language === 'en' ? LEGAL_TEXTS_EN[rol].privacidad : LEGAL_TEXTS[rol].privacidad) 
              : ''
        }
        onClose={() => setModalLegal({ visible: false, tipo: null })}
      />
    </LinearGradient>
  );
}

// ── Estilos ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  fondo:  { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center', paddingVertical: Spacing[8], paddingHorizontal: Spacing[5] },

  volverBtn: { position: 'absolute', top: 48, left: 20, backgroundColor: 'rgba(255,255,255,0.85)', padding: 8, borderRadius: Radius.full, zIndex: 10, ...Shadow.sm },

  // Cabecera fuera del card
  header:     { alignItems: 'center', marginBottom: Spacing[5] },
  headerTitle:{ ...Typography.styles.h2, color: Colors.neutral[900], textAlign: 'center' },
  headerSub:  { ...Typography.styles.body, color: Colors.neutral[600], marginTop: 4 },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: Spacing[6],
    width: '100%',
    maxWidth: 480,
    ...Shadow.lg,
    shadowColor: '#4c1d95',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },

  // Selector de rol
  rolSelector:     { flexDirection: 'row', backgroundColor: Colors.neutral[100], borderRadius: Radius.md, padding: 4, gap: 4, marginBottom: Spacing[5] },
  rolTab:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: Radius.sm, gap: 6 },
  rolTabActive:    { backgroundColor: Colors.primary[600], ...Shadow.sm },
  rolTabTxt:       { ...Typography.styles.btn, color: Colors.text.secondary, fontSize: 13 },
  rolTabTxtActive: { color: '#fff' },

  // Inputs
  inputGroup:  { marginBottom: Spacing[3] },
  inputLabel:  { ...Typography.styles.label, color: Colors.text.secondary, textTransform: 'none', letterSpacing: 0, fontSize: 12, marginBottom: 4 },
  inputWrap:   { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border.default, borderRadius: Radius.input, minHeight: 44, backgroundColor: '#fff' },
  inputIcon:   { paddingLeft: 12 },
  input:       { flex: 1, paddingHorizontal: 8, paddingVertical: 10, ...Typography.styles.body, color: Colors.text.primary },
  eyeBtn:      { paddingRight: 12 },

  // Picker
  pickerWrap: { borderWidth: 1.5, borderColor: Colors.border.default, borderRadius: Radius.input, backgroundColor: '#fff', overflow: 'hidden' },
  picker:     { height: 44, color: Colors.text.primary },

  // Documentos
  docsSection:      { marginBottom: Spacing[4] },
  docsSectionTitle: { ...Typography.styles.label, color: Colors.text.primary, fontSize: 13, marginBottom: Spacing[3] },
  docBox:           { marginBottom: Spacing[2] },
  docBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: Colors.border.default, borderStyle: 'dashed',
    borderRadius: Radius.input, padding: Spacing[3],
    backgroundColor: Colors.neutral[50],
  },
  docBtnOk:    { borderColor: Colors.success.main, backgroundColor: Colors.success.light, borderStyle: 'solid' },
  docBtnTxt:   { ...Typography.styles.body, color: Colors.text.secondary },
  docBtnTxtOk: { color: Colors.success.dark },
  docVerLink:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, paddingLeft: 4 },
  docVerTxt:   { ...Typography.styles.caption, color: Colors.primary[600] },

  // Términos
  terminosRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: Spacing[4] },
  checkboxContainer: { padding: 4, marginLeft: -4 },
  checkbox:    { width: 16, height: 16, borderRadius: 4, borderWidth: 1.5, borderColor: Colors.border.default, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  checkboxOn:  { backgroundColor: Colors.primary[600], borderColor: Colors.primary[600] },
  terminosTxt: { ...Typography.styles.bodySm, color: Colors.text.secondary, flex: 1, lineHeight: 22, marginTop: 1 },
  terminosLink:{ color: Colors.primary[600], fontWeight: '600', textDecorationLine: 'underline' },

  // Mensajes
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.error.light, borderRadius: Radius.md, padding: Spacing[3], marginBottom: Spacing[3] },
  errorTxt: { ...Typography.styles.bodySm, color: Colors.error.dark, flex: 1 },
  exitoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.success.light, borderRadius: Radius.md, padding: Spacing[3], marginBottom: Spacing[3] },
  exitoTxt: { ...Typography.styles.bodySm, color: Colors.success.dark, flex: 1 },

  // Botón
  mainBtn:    { backgroundColor: Colors.primary[600], paddingVertical: 14, borderRadius: Radius.button, alignItems: 'center', ...Shadow.brand },
  mainBtnTxt: { ...Typography.styles.btnLg, color: '#fff' },

  // Login link
  loginRow:  { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing[5] },
  loginTxt:  { ...Typography.styles.bodySm, color: Colors.text.secondary },
  loginLink: { ...Typography.styles.bodySm, color: Colors.primary[600], fontWeight: '600' },

  // Footer
  footer: { ...Typography.styles.caption, color: 'rgba(0, 0, 0, 0.7)', textAlign: 'center', marginTop: Spacing[6] },
});
