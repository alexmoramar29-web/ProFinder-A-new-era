import { Picker } from '@react-native-picker/picker';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

  const [ineFoto, setIneFoto] = useState<{ uri: string, base64: string } | null>(null);
  const [cedulaFoto, setCedulaFoto] = useState<{ uri: string, base64: string } | null>(null);
  const [certificadoFoto, setCertificadoFoto] = useState<{ uri: string, base64: string } | null>(null);

  const seleccionarImagen = async (tipo: 'ine' | 'cedula' | 'certificado') => {
    setMensajeError('');
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.6,
      base64: true,
    });

    if (!resultado.canceled && resultado.assets[0].uri && resultado.assets[0].base64) {
      const paqueteFoto = { uri: resultado.assets[0].uri, base64: resultado.assets[0].base64 };
      if (tipo === 'ine') setIneFoto(paqueteFoto);
      if (tipo === 'cedula') setCedulaFoto(paqueteFoto);
      if (tipo === 'certificado') setCertificadoFoto(paqueteFoto);
    }
  };

  const subirFotoAlAlmacen = async (base64Texto: string, nombreArchivo: string): Promise<string> => {
    const { error } = await supabase.storage
      .from('profesionales-documentos')
      .upload(nombreArchivo, decode(base64Texto), { 
        contentType: 'image/jpeg',
        upsert: true 
      });

    if (error) throw new Error(`Fallo al subir foto: ${error.message}`);

    const { data } = supabase.storage.from('profesionales-documentos').getPublicUrl(nombreArchivo);
    return data.publicUrl;
  };

  const handleRegistro = async () => {
    setMensajeError('');
    setMensajeExito('');

    const correoLimpio = email.trim();
    const usuarioLimpio = username.trim();

    if (!usuarioLimpio || !fullName || !correoLimpio || !password || !confirmPassword) {
      return setMensajeError('Faltan datos: Todos los campos son obligatorios.');
    }
    
    if (password.length < 8) {
      return setMensajeError('Contraseña débil: Debe tener mínimo 8 caracteres.');
    }

    //  Revisar si las dos contraseñas son gemelas
    if (password !== confirmPassword) {
      return setMensajeError('Las contraseñas no coinciden: Escribe exactamente lo mismo en ambas cajas.');
    }

    if (rol === 'profesionista' && (!ineFoto || !cedulaFoto || !certificadoFoto)) {
      return setMensajeError('Documentos incompletos: Sube INE, Cédula y Certificado.');
    }

    setCargando(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: correoLimpio,
        password: password,
      });

      if (authError) {
        if (authError.message.includes('already registered')) throw new Error('Ese correo ya existe.');
        throw authError;
      }

      if (rol === 'cliente') {
        const { error: dbError } = await supabase.from('users').insert([{
          username: usuarioLimpio,
          full_name: fullName,
          email: correoLimpio,
          phone: phone || null,
          password_hash: 'PROTEGIDO_POR_AUTH'
        }]);

        if (dbError) throw new Error('No se pudo crear el perfil de cliente.');
        
        setMensajeExito('¡Cuenta de cliente lista!');
        setTimeout(() => router.replace('/(cliente)'), 1500);

      } else {
        setMensajeExito('Creando tu perfil maestro...');
        
        const { data: nuevoProf, error: profError } = await supabase
          .from('professionals')
          .insert([{
            username: usuarioLimpio,
            full_name: fullName,
            email: correoLimpio,
            phone: phone || null,
            speciality: speciality,
            password_hash: 'PROTEGIDO_POR_AUTH'
          }])
          .select('prof_id')
          .single();

        if (profError) throw new Error('No se pudo guardar los datos principales.');
        
        const idDelProfesionista = nuevoProf.prof_id; 

        setMensajeExito('Subiendo documentos de verificación...');
        const tiempo = Date.now();
        
        const urlIne = await subirFotoAlAlmacen(ineFoto!.base64, `ine_${usuarioLimpio}_${tiempo}.jpg`);
        const urlCedula = await subirFotoAlAlmacen(cedulaFoto!.base64, `cedula_${usuarioLimpio}_${tiempo}.jpg`);
        const urlCertificado = await subirFotoAlAlmacen(certificadoFoto!.base64, `cert_${usuarioLimpio}_${tiempo}.jpg`);

        setMensajeExito('Vinculando documentos de forma ordenada...');
        
        const { error: docsError } = await supabase
          .from('professional_documents')
          .insert([
            { prof_id: idDelProfesionista, document_type: 'INE', file_url: urlIne },
            { prof_id: idDelProfesionista, document_type: 'Cédula Profesional', file_url: urlCedula },
            { prof_id: idDelProfesionista, document_type: 'Certificado', file_url: urlCertificado }
          ]);

        if (docsError) throw new Error('Fallo al asociar los enlaces de tus documentos.');

        setMensajeExito('¡Registro profesional completado y verificado!');
        setTimeout(() => router.replace('/(profesionista)'), 1500);
      }

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
        <TextInput style={styles.input} placeholder="Correo electrónico" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" maxLength={100} editable={!cargando} />
        <TextInput style={styles.input} placeholder="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={20} editable={!cargando} />
        
        {/* contraseña original */}
        <TextInput style={styles.input} placeholder="Contraseña (mínimo 8 caracteres)" value={password} onChangeText={setPassword} secureTextEntry maxLength={50} editable={!cargando} />
        
        {/* Confirmar contraseña */}
        <TextInput style={styles.input} placeholder="Confirmar tu contraseña" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry maxLength={50} editable={!cargando} />

        {rol === 'profesionista' && (
          <View>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Selecciona tu profesión:</Text>
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

            <Text style={styles.sectionSubtitle}>Documentos obligatorios:</Text>
            
            <TouchableOpacity style={[styles.uploadButton, ineFoto && styles.uploadSuccess]} onPress={() => seleccionarImagen('ine')} disabled={cargando}>
              <Text style={styles.uploadButtonText}>{ineFoto ? "INE Seleccionada" : "Elegir foto de INE"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.uploadButton, cedulaFoto && styles.uploadSuccess]} onPress={() => seleccionarImagen('cedula')} disabled={cargando}>
              <Text style={styles.uploadButtonText}>{cedulaFoto ? "Cédula Seleccionada" : "Elegir foto de Cédula"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.uploadButton, certificadoFoto && styles.uploadSuccess]} onPress={() => seleccionarImagen('certificado')} disabled={cargando}>
              <Text style={styles.uploadButtonText}>{certificadoFoto ? "Certificado Seleccionado" : "Elegir foto de Certificado"}</Text>
            </TouchableOpacity>
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
  uploadButton: { backgroundColor: '#6c757d', padding: 12, borderRadius: 5, marginBottom: 10, alignItems: 'center' },
  uploadSuccess: { backgroundColor: '#28a745' },
  uploadButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  errorBox: { backgroundColor: '#ffe6e6', padding: 10, borderRadius: 5, marginBottom: 15, borderWidth: 1, borderColor: '#ff4d4d' },
  errorText: { color: '#d9534f', textAlign: 'center', fontWeight: 'bold' },
  successBox: { backgroundColor: '#e6ffe6', padding: 10, borderRadius: 5, marginBottom: 15, borderWidth: 1, borderColor: '#28a745' },
  successText: { color: '#28a745', textAlign: 'center', fontWeight: 'bold' }
});