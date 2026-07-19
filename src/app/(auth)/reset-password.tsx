import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '@/context/ThemeContext';

export default function ResetPasswordScreen() {
  const { isDark, colors } = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const { t } = useTranslation();
  
  // Atrapamos el correo que nos mandó la pantalla anterior
  const params = useLocalSearchParams();
  const [correo, setCorreo] = useState((params.correoParam as string) || '');
  
  const [codigoOtp, setCodigoOtp] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [confirmarContraseña, setConfirmarContraseña] = useState('');
  const [cargando, setCargando] = useState(false);
  
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState<'info' | 'error' | 'exito' | ''>('');

  const handleActualizarContraseña = async () => {
    setMensaje('');
    
    if (!correo || !codigoOtp || !contraseña || !confirmarContraseña) {
      setMensaje('Por favor, llena todos los campos.');
      setTipoMensaje('error');
      return;
    }

    if (codigoOtp.length !== 8) {
      setMensaje('El código debe tener exactamente 8 números.');
      setTipoMensaje('error');
      return;
    }

    if (contraseña.length < 8) {
      setMensaje('La contraseña debe tener mínimo 8 caracteres.');
      setTipoMensaje('error');
      return;
    }

    if (contraseña !== confirmarContraseña) {
      setMensaje('Las contraseñas no coinciden.');
      setTipoMensaje('error');
      return;
    }

    setCargando(true);
    setMensaje('Verificando código de seguridad...');
    setTipoMensaje('info');

    try {
      // 1. Primero verificamos que los 8 números sean correctos
      const { error: errorVerificacion } = await supabase.auth.verifyOtp({
        email: correo,
        token: codigoOtp,
        type: 'recovery'
      });

      if (errorVerificacion) throw new Error('El código es incorrecto o ya expiró.');

      // 2. Si el código es correcto, guardamos la nueva contraseña
      const { error: errorClave } = await supabase.auth.updateUser({
        password: contraseña
      });

      if (errorClave) throw errorClave;

      setMensaje('Contraseña actualizada con éxito. Llevándote al inicio...');
      setTipoMensaje('exito');
      
      await supabase.auth.signOut();
      setTimeout(() => {
        router.replace('/(auth)/sign-in');
      }, 3000);

    } catch (error: any) {
      setMensaje('Error: ' + (error.message || 'No se pudo actualizar la contraseña.'));
      setTipoMensaje('error');
    } finally {
      setCargando(false);
    }
  };

  const obtenerColorMensaje = () => {
    if (tipoMensaje === 'error') return '#D32F2F';
    if (tipoMensaje === 'exito') return '#388E3C';
    return colors.text.secondary;
  };

  return (
    <ScrollView contentContainerStyle={styles.contenedorScroll} style={styles.fondo}>
      <View style={styles.contenedor}>
        <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in')} style={styles.botonAtrasInline}>
          <Text style={styles.flechaAtras}>❮</Text>
          <Text style={styles.textoAtrasInline}>{t('atras')}</Text>
        </TouchableOpacity>

        <Text style={styles.titulo}>{t('nuevaContrasenaTitle')}</Text>
        <Text style={styles.subtitulo}>{t('escribeCodigo')}</Text>

        <Text style={styles.etiquetaInput}>{t('correoLabel')}</Text>
        <TextInput 
          style={styles.input} 
          placeholder={t('correoPlaceholder')} 
          value={correo} 
          onChangeText={setCorreo} 
          editable={!cargando} 
          autoCapitalize="none"
        />

        <Text style={styles.etiquetaInput}>{t('codigoLabel')}</Text>
        <TextInput 
          style={styles.input} 
          placeholder="12345678" 
          value={codigoOtp} 
          onChangeText={setCodigoOtp} 
          keyboardType="number-pad"
          maxLength={8}
          editable={!cargando} 
        />

        <Text style={styles.etiquetaInput}>{t('nuevaContrasenaLabel')}</Text>
        <TextInput 
          style={styles.input} 
          placeholder={t('minimo8')} 
          value={contraseña} 
          onChangeText={setContraseña} 
          secureTextEntry 
          maxLength={50}
          editable={!cargando} 
        />

        <Text style={styles.etiquetaInput}>{t('confirmarContrasenaLabel')}</Text>
        <TextInput 
          style={styles.input} 
          placeholder={t('repiteClave')} 
          value={confirmarContraseña} 
          onChangeText={setConfirmarContraseña} 
          secureTextEntry 
          maxLength={50}
          editable={!cargando} 
        />

        <TouchableOpacity 
          style={styles.boton} 
          onPress={handleActualizarContraseña} 
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color={colors.neutral[0]} />
          ) : (
            <Text style={styles.textoBoton}>{t('btnGuardarContrasena')}</Text>
          )}
        </TouchableOpacity>

        {mensaje !== '' && (
          <Text style={[styles.textoMensaje, { color: obtenerColorMensaje() }]}>
            {mensaje}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colors.neutral[50] },
  contenedorScroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  contenedor: { backgroundColor: colors.neutral[0], padding: 25, borderRadius: 12, borderWidth: 1, borderColor: colors.border.default, elevation: 2 },
  botonAtrasInline: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingVertical: 5 },
  flechaAtras: { fontSize: 20, color: '#5c4b8a', fontWeight: 'bold', marginRight: 5 },
  textoAtrasInline: { fontSize: 16, color: '#5c4b8a', fontWeight: 'bold' },
  titulo: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: colors.text.primary, marginBottom: 5 },
  subtitulo: { fontSize: 14, color: colors.text.secondary, textAlign: 'center', marginBottom: 25 },
  etiquetaInput: { fontSize: 14, fontWeight: 'bold', color: colors.text.primary, marginBottom: 8, marginLeft: 5 },
  input: { backgroundColor: '#F2F2F7', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 14, fontSize: 16, marginBottom: 20, color: colors.text.primary },
  boton: { backgroundColor: '#5c4b8a', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  textoBoton: { color: colors.neutral[0], fontWeight: 'bold', fontSize: 16 },
  textoMensaje: { marginTop: 20, textAlign: 'center', fontSize: 14, fontWeight: '600' }
});