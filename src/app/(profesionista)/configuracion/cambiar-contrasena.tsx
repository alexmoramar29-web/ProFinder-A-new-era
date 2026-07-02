import { useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform } from 'react-native';
import { supabase } from '../../../lib/supabase';
import ConfirmHcaptcha from '@hcaptcha/react-native-hcaptcha';

let HCaptchaWeb: any;
if (Platform.OS === 'web') {
  HCaptchaWeb = require('@hcaptcha/react-hcaptcha').default;
}

export default function CambiarContrasenaScreen() {
  const { t } = useTranslation();
  const [cargando, setCargando] = useState(false);
  const [correoUsuario, setCorreoUsuario] = useState('');
  const [paso, setPaso] = useState(1); 
  
  const [codigoOtp, setCodigoOtp] = useState('');
  const [nuevaContraseña, setNuevaContraseña] = useState('');
  // 1. NUEVO: Creamos el espacio para confirmar la clave
  const [confirmarContraseña, setConfirmarContraseña] = useState(''); 
  
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState<'info' | 'error' | 'exito' | ''>('');
  
  const router = useRouter();
  
  const captchaRef = useRef<any>(null);
  const SITE_KEY = process.env.EXPO_PUBLIC_HCAPTCHA_SITE_KEY || '10000000-ffff-ffff-ffff-000000000001';

  useEffect(() => {
    const obtenerUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setCorreoUsuario(user.email);
      }
    };
    obtenerUsuario();
  }, []);

  const enviarCodigoAlCorreo = () => {
    if (!correoUsuario) return;
    
    if (process.env.EXPO_PUBLIC_TEST_MODE === 'true') {
      ejecutarEnvio('dummy-token-para-pruebas');
      return;
    }

    if (Platform.OS === 'web') {
      captchaRef.current?.execute();
    } else {
      captchaRef.current?.show();
    }
  };

  const ejecutarEnvio = async (tokenCaptcha: string) => {
    setCargando(true);
    setMensaje(t('enviandoSolicitud'));
    setTipoMensaje('info');
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(correoUsuario, { captchaToken: tokenCaptcha });
      if (error) throw error;

      setMensaje(t('codigoEnviado'));
      setTipoMensaje('exito');
      
      setTimeout(() => {
        setPaso(2);
        setMensaje(''); 
      }, 2000);
      
    } catch (error: any) {
      setMensaje(t('error') + error.message);
      setTipoMensaje('error');
    } finally {
      setCargando(false);
    }
  };

  const verificarYCambiarContraseña = async () => {
    setMensaje('');
    
    if (codigoOtp.length !== 8) {
      setMensaje(t('codigo8Numeros'));
      setTipoMensaje('error');
      return;
    }
    
    if (nuevaContraseña.length < 8) {
      setMensaje(t('contrasena8Caracteres'));
      setTipoMensaje('error');
      return;
    }

    // 2. NUEVO: Filtro para asegurar que sean idénticas
    if (nuevaContraseña !== confirmarContraseña) {
      setMensaje(t('contrasenasNoCoinciden'));
      setTipoMensaje('error');
      return;
    }

    setCargando(true);
    setMensaje(t('verificandoCodigo'));
    setTipoMensaje('info');
    
    try {
      const { error: errorVerificacion } = await supabase.auth.verifyOtp({
        email: correoUsuario,
        token: codigoOtp,
        type: 'recovery'
      });

      if (errorVerificacion) throw new Error(t('codigoIncorrectoOExpiro'));

      const { error: errorClave } = await supabase.auth.updateUser({
        password: nuevaContraseña
      });

      if (errorClave) throw errorClave;

      setMensaje(t('contrasenaActualizada'));
      setTipoMensaje('exito');
      
      // Te regresamos automáticamente al menú anterior después de 2 segundos
      setTimeout(() => {
         router.replace('/(profesionista)/configuracion');
      }, 2000);

    } catch (error: any) {
      setMensaje(t('falloActualizacion') + error.message);
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
    <View style={styles.contenedorFondo}>
      <View style={styles.tarjeta}>
        <TouchableOpacity onPress={() => router.replace('/(profesionista)/configuracion')} style={styles.botonAtrasInline}>
          <Text style={styles.flechaAtras}>❮</Text>
          <Text style={styles.textoAtrasInline}>{t('atras')}</Text>
        </TouchableOpacity>
        
        {paso === 1 ? (
          <>
            <Text style={styles.titulo}>{t('seguridadCuenta')}</Text>
            <Text style={styles.subtitulo}>
              {t('enviaremosCodigo')}
            </Text>

            <View style={styles.cajaCorreo}>
              <Text style={styles.textoCorreo}>{correoUsuario || t('cargandoCorreo')}</Text>
            </View>

            <TouchableOpacity
              style={styles.boton}
              onPress={enviarCodigoAlCorreo}
              disabled={cargando || !correoUsuario}
            >
              {cargando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.textoBoton}>{t('enviarCodigo')}</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.titulo}>{t('verificaIdentidad')}</Text>
            <Text style={styles.subtitulo}>
              {t('escribeCodigo')}
            </Text>

            <Text style={styles.etiquetaInput}>{t('codigoSeguridadLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder="12345678"
              keyboardType="number-pad"
              maxLength={8}
              value={codigoOtp}
              onChangeText={setCodigoOtp}
            />

            <Text style={styles.etiquetaInput}>{t('nuevaContrasenaLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder="Mínimo 8 caracteres"
              secureTextEntry={true}
              value={nuevaContraseña}
              onChangeText={setNuevaContraseña}
            />

            {/* 3. NUEVO: La cajita visual para confirmar */}
            <Text style={styles.etiquetaInput}>{t('confirmarContrasenaLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder="Repite tu nueva clave"
              secureTextEntry={true}
              value={confirmarContraseña}
              onChangeText={setConfirmarContraseña}
            />

            <TouchableOpacity
              style={styles.boton}
              onPress={verificarYCambiarContraseña}
              disabled={cargando}
            >
              {cargando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.textoBoton}>{t('guardarContrasenaBtn')}</Text>}
            </TouchableOpacity>
          </>
        )}

        {mensaje !== '' && (
          <Text style={[styles.textoMensaje, { color: obtenerColorMensaje() }]}>
            {mensaje}
          </Text>
        )}

        {Platform.OS === 'web' && (
          <HCaptchaWeb
            ref={captchaRef}
            sitekey={SITE_KEY}
            size="invisible"
            onVerify={(token: string) => {
              ejecutarEnvio(token);
            }}
            onError={() => {
              setCargando(false);
              setMensaje('Falló la verificación de seguridad. Intenta nuevamente.');
              setTipoMensaje('error');
            }}
          />
        )}

        {Platform.OS !== 'web' && (
          <ConfirmHcaptcha
            ref={captchaRef}
            siteKey={SITE_KEY}
            baseUrl="https://hcaptcha.com"
            languageCode="es"
            size="invisible"
            onMessage={(event: any) => {
              if (event && event.nativeEvent.data) {
                if (['cancel', 'error', 'expired'].includes(event.nativeEvent.data)) {
                  setCargando(false);
                  setMensaje('Falló la verificación de seguridad. Intenta nuevamente.');
                  setTipoMensaje('error');
                  return;
                }
                ejecutarEnvio(event.nativeEvent.data);
              }
            }}
          />
        )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedorFondo: { flex: 1, backgroundColor: '#FAFAFC', padding: 20, justifyContent: 'center' },
  tarjeta: { backgroundColor: '#FFFFFF', padding: 25, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  botonAtrasInline: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  flechaAtras: { fontSize: 20, color: '#5c4b8a', fontWeight: 'bold', marginRight: 5 },
  textoAtrasInline: { fontSize: 16, color: '#5c4b8a', fontWeight: 'bold' },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 10, textAlign: 'center' },
  subtitulo: { fontSize: 14, color: '#8E8E93', textAlign: 'center', marginBottom: 25, lineHeight: 20 },
  cajaCorreo: { backgroundColor: '#F2F2F7', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 15, marginBottom: 25, alignItems: 'center', borderWidth: 1, borderColor: '#E5E5EA' },
  textoCorreo: { fontSize: 16, color: '#5c4b8a', fontWeight: 'bold' },
  etiquetaInput: { fontSize: 14, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 8, marginLeft: 5 },
  input: { backgroundColor: '#F2F2F7', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 14, fontSize: 16, marginBottom: 20, color: '#1C1C1E' },
  boton: { backgroundColor: '#5c4b8a', paddingVertical: 15, borderRadius: 8, alignItems: 'center' },
  textoBoton: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  textoMensaje: { marginTop: 20, textAlign: 'center', fontSize: 14, fontWeight: '600' }
});