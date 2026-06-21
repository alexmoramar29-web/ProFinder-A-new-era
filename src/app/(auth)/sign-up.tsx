import { Picker } from '@react-native-picker/picker';
import { decode } from 'base64-arraybuffer';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function SignUpScreen() {
  const router = useRouter();
  
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

  const seleccionarDocumento = async (tipo: 'ine' | 'cedula' | 'certificado') => {
    setMensajeError('');
    try {
      const resultado = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!resultado.canceled && resultado.assets.length > 0) {
        const archivo = resultado.assets[0];
        if (archivo.size && archivo.size > 2 * 1024 * 1024) {
          return setMensajeError('El PDF debe pesar menos de 2MB.');
        }
        if (tipo === 'ine') setIneDoc(archivo);
        if (tipo === 'cedula') setCedulaDoc(archivo);
        if (tipo === 'certificado') setCertificadoDoc(archivo);
      }
    } catch (e) {
      setMensajeError('No se pudo abrir el selector de documentos.');
    }
  };

  const subirDocumentoAlAlmacen = async (archivo: any, nombreArchivo: string): Promise<string> => {
    try {
      if (Platform.OS === 'web') {
        const { error } = await supabase.storage
          .from('profesionales-documentos')
          .upload(nombreArchivo, archivo.file, { contentType: 'application/pdf' });
        if (error) throw error;
      } else {
        const fileInfo = await FileSystem.getInfoAsync(archivo.uri);
        if (!fileInfo.exists) throw new Error('No se pudo leer el archivo local.');
        
        const base64 = await FileSystem.readAsStringAsync(archivo.uri, { encoding: 'base64' });
        const { error } = await supabase.storage
          .from('profesionales-documentos')
          .upload(nombreArchivo, decode(base64), { 
            contentType: 'application/pdf',
            upsert: true 
          });
        if (error) throw error;
      }

      const { data } = supabase.storage.from('profesionales-documentos').getPublicUrl(nombreArchivo);
      return data.publicUrl;
    } catch (error: any) {
      throw new Error(`Fallo al subir documento: ${error.message}`);
    }
  };

  const handleRegistro = async () => {
    setMensajeError('');
    setMensajeExito('');

    const correoLimpio = email.trim();
    const usuarioLimpio = username.trim();
    const telefonoLimpio = phone.trim();

    if (!usuarioLimpio || !fullName || !correoLimpio || !password || !confirmPassword) {
      return setMensajeError('Faltan datos: Todos los campos son obligatorios.');
    }
    
    if (password.length < 8) {
      return setMensajeError('Contrasena debil: Debe tener minimo 8 caracteres.');
    }

    if (password !== confirmPassword) {
      return setMensajeError('Las contrasenas no coinciden: Escribe exactamente lo mismo en ambas cajas.');
    }

    if (rol === 'profesionista' && (!ineDoc || !cedulaDoc || !certificadoDoc)) {
      return setMensajeError('Documentos incompletos: Sube los archivos PDF de tu INE, Cedula y Certificado.');
    }

    setCargando(true);

    try {
      let urlIneFinal = null;
      let urlCedulaFinal = null;
      let urlCertificadoFinal = null;

      if (rol === 'profesionista') {
        setMensajeExito('Guardando documentos en la bodega segura...');
        const tiempo = Date.now();
        urlIneFinal = await subirDocumentoAlAlmacen(ineDoc, `ine_${usuarioLimpio}_${tiempo}.pdf`);
        urlCedulaFinal = await subirDocumentoAlAlmacen(cedulaDoc, `cedula_${usuarioLimpio}_${tiempo}.pdf`);
        urlCertificadoFinal = await subirDocumentoAlAlmacen(certificadoDoc, `cert_${usuarioLimpio}_${tiempo}.pdf`);
      }

      setMensajeExito('Creando tu gafete oficial...');

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: correoLimpio,
        password: password,
        options: {
          data: {
            rol_temporal: rol,
            username_temporal: usuarioLimpio,
            fullname_temporal: fullName,
            phone_temporal: telefonoLimpio || null,
            speciality_temporal: rol === 'profesionista' ? speciality : null,
            ine_temporal: urlIneFinal,
            cedula_temporal: urlCedulaFinal,
            certificado_temporal: urlCertificadoFinal,
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) throw new Error('Ese correo ya existe.');
        throw authError;
      }

      setMensajeExito('Cuenta creada. Por favor, revisa tu Gmail y dale clic al enlace para verificar tu cuenta.');
      setTimeout(() => router.replace('/(auth)/sign-in'), 3500);

    } catch (error: any) {
      setMensajeError(error.message || 'Error inesperado.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Crea tu cuenta</Text>

        <View style={styles.roleContainer}>
          <TouchableOpacity style={[styles.roleButton, rol === 'cliente' && styles.roleActive]} onPress={() => setRol('cliente')} disabled={cargando}>
            <Text style={rol === 'cliente' ? styles.textActive : styles.textInactive}>Soy Cliente</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.roleButton, rol === 'profesionista' && styles.roleActive]} onPress={() => setRol('profesionista')} disabled={cargando}>
            <Text style={rol === 'profesionista' ? styles.textActive : styles.textInactive}>Soy Profesionista</Text>
          </TouchableOpacity>
        </View>

        <TextInput style={styles.input} placeholder="Nombre completo" value={fullName} onChangeText={setFullName} maxLength={100} editable={!cargando} />
        <TextInput style={styles.input} placeholder="Nombre de usuario" value={username} onChangeText={setUsername} autoCapitalize="none" maxLength={50} editable={!cargando} />
        <TextInput style={styles.input} placeholder="Correo electronico" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" maxLength={100} editable={!cargando} />
        
        <TextInput 
          style={styles.input} 
          placeholder="Telefono (Ej: +526141234567)" 
          value={phone} 
          onChangeText={(texto) => setPhone(texto.replace(/[^0-9+]/g, ''))} 
          keyboardType="phone-pad" 
          maxLength={13} 
          editable={!cargando} 
        />
        
        <TextInput style={styles.input} placeholder="Contrasena (minimo 8 caracteres)" value={password} onChangeText={setPassword} secureTextEntry maxLength={50} editable={!cargando} />
        <TextInput style={styles.input} placeholder="Confirmar tu contrasena" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry maxLength={50} editable={!cargando} />

        {rol === 'profesionista' && (
          <View>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Selecciona tu profesion:</Text>
              <Picker selectedValue={speciality} onValueChange={(itemValue: string) => setSpeciality(itemValue)} enabled={!cargando}>
                <Picker.Item label="Doctor" value="Doctor" />
                <Picker.Item label="Abogado" value="Abogado" />
                <Picker.Item label="Dentista" value="Dentista" />
                <Picker.Item label="Ingeniero en Sistemas (Hardware)" value="Ingeniero en Sistemas Hardware" />
                <Picker.Item label="Ingeniero en Sistemas (Software)" value="Ingeniero en Sistemas Software" />
                <Picker.Item label="Ingeniero Civil" value="Ingeniero Civil" />
                <Picker.Item label="Arquitecto" value="Arquitecto" />
                <Picker.Item label="Otro" value="Otro" />
              </Picker>
            </View>

            <Text style={styles.sectionSubtitle}>Documentos obligatorios (Formatos PDF):</Text>
            
            <View style={styles.docBox}>
              <TouchableOpacity style={[styles.uploadButton, ineDoc && styles.uploadSuccess]} onPress={() => seleccionarDocumento('ine')} disabled={cargando}>
                <Text style={styles.uploadButtonText}>{ineDoc ? "Cambiar archivo INE" : "Elegir archivo PDF de INE"}</Text>
              </TouchableOpacity>
              {ineDoc && (
                <TouchableOpacity onPress={() => Linking.openURL(ineDoc.uri)}>
                  <Text style={styles.linkVer}>Ver PDF seleccionado</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.docBox}>
              <TouchableOpacity style={[styles.uploadButton, cedulaDoc && styles.uploadSuccess]} onPress={() => seleccionarDocumento('cedula')} disabled={cargando}>
                <Text style={styles.uploadButtonText}>{cedulaDoc ? "Cambiar archivo Cedula" : "Elegir archivo PDF de Cedula"}</Text>
              </TouchableOpacity>
              {cedulaDoc && (
                <TouchableOpacity onPress={() => Linking.openURL(cedulaDoc.uri)}>
                  <Text style={styles.linkVer}>Ver PDF seleccionado</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.docBox}>
              <TouchableOpacity style={[styles.uploadButton, certificadoDoc && styles.uploadSuccess]} onPress={() => seleccionarDocumento('certificado')} disabled={cargando}>
                <Text style={styles.uploadButtonText}>{certificadoDoc ? "Cambiar archivo Certificado" : "Elegir archivo PDF de Certificado"}</Text>
              </TouchableOpacity>
              {certificadoDoc && (
                <TouchableOpacity onPress={() => Linking.openURL(certificadoDoc.uri)}>
                  <Text style={styles.linkVer}>Ver PDF seleccionado</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        
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
          <Button title={cargando ? "Procesando..." : "Registrarme"} onPress={handleRegistro} disabled={cargando} />
        </View>

        {/* BOTON PARA VOLVER AL SIGN-IN */}
        <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in')} disabled={cargando}>
          <Text style={styles.linkLogin}>Ya tengo cuenta, iniciar sesion</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, backgroundColor: '#fff' },
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 15, borderRadius: 5, backgroundColor: '#f9f9f9' },
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  roleButton: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#ccc', alignItems: 'center', marginHorizontal: 5, borderRadius: 5 },
  roleActive: { backgroundColor: '#007bff', borderColor: '#007bff' },
  textActive: { color: '#fff', fontWeight: 'bold' },
  textInactive: { color: '#333' },
  pickerContainer: { borderWidth: 1, borderColor: '#007bff', borderRadius: 5, marginBottom: 15, backgroundColor: '#eef6ff', padding: 5 },
  pickerLabel: { fontSize: 14, color: '#333', marginLeft: 10, marginTop: 5 },
  buttonContainer: { marginTop: 10 },
  sectionSubtitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 10, marginTop: 5 },
  docBox: { marginBottom: 15 },
  uploadButton: { backgroundColor: '#6c757d', padding: 12, borderRadius: 5, alignItems: 'center' },
  uploadSuccess: { backgroundColor: '#28a745' },
  uploadButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  linkVer: { color: '#007bff', fontSize: 13, textDecorationLine: 'underline', textAlign: 'center', marginTop: 8 },
  errorBox: { backgroundColor: '#ffe6e6', padding: 10, borderRadius: 5, marginBottom: 15, borderWidth: 1, borderColor: '#ff4d4d' },
  errorText: { color: '#d9534f', textAlign: 'center', fontWeight: 'bold' },
  successBox: { backgroundColor: '#e6ffe6', padding: 10, borderRadius: 5, marginBottom: 15, borderWidth: 1, borderColor: '#28a745' },
  successText: { color: '#28a745', textAlign: 'center', fontWeight: 'bold' },
  linkLogin: { color: '#007bff', marginTop: 25, textAlign: 'center', fontSize: 15, fontWeight: 'bold' }
});