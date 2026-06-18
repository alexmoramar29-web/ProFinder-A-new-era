import { supabase } from '@/lib/supabase';
import { Picker } from '@react-native-picker/picker';
import { decode } from 'base64-arraybuffer';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CompletarRegistroScreen() {
  const router = useRouter();
  const [speciality, setSpeciality] = useState('Doctor');
  const [ine, setIne] = useState<any>(null);
  const [cedula, setCedula] = useState<any>(null);
  const [certificado, setCertificado] = useState<any>(null);
  const [guardando, setGuardando] = useState(false);
  const [textoEstado, setTextoEstado] = useState('');

  const seleccionarDocumento = async (guardarEn: any) => {
    try {
      const resultado = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (!resultado.canceled && resultado.assets.length > 0) {
        const archivo = resultado.assets[0];
        if (archivo.size && archivo.size > 2 * 1024 * 1024) {
          return Alert.alert('Error', 'El PDF debe pesar menos de 2MB.');
        }
        guardarEn(archivo);
      }
    } catch (e) { Alert.alert('Error', 'No se pudo abrir archivos'); }
  };

  const subirAlStorage = async (archivo: any, userId: string, tipo: string) => {
    const nombre = `${tipo}_${userId}_${Date.now()}.pdf`;
    const base64 = await FileSystem.readAsStringAsync(archivo.uri, { encoding: 'base64' });
    const { error } = await supabase.storage.from('profesionales-documentos').upload(nombre, decode(base64), { contentType: 'application/pdf' });
    if (error) throw error;
    return supabase.storage.from('profesionales-documentos').getPublicUrl(nombre).data.publicUrl;
  };

  const handleGuardar = async () => {
    if (!ine || !cedula || !certificado) return Alert.alert('Error', 'Sube los 3 PDFs');
    setGuardando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesión expirada');
      
      const urls = [await subirAlStorage(ine, user.id, 'ine'), await subirAlStorage(cedula, user.id, 'cedula'), await subirAlStorage(certificado, user.id, 'cert')];
      
      await supabase.from('professionals').update({ speciality }).eq('prof_id', user.id);
      await supabase.from('professional_documents').insert([
        { prof_id: user.id, document_type: 'INE', file_url: urls[0] },
        { prof_id: user.id, document_type: 'Cédula', file_url: urls[1] },
        { prof_id: user.id, document_type: 'Certificado', file_url: urls[2] }
      ]);

      Alert.alert('Éxito', 'Perfil enviado a revisión');
      router.replace('/(profesionista)/perfil');
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setGuardando(false); }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.container}>
        <Text style={styles.titulo}>Verificación Profesional</Text>
        
        <Text style={styles.label}>Selecciona tu Profesión</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={speciality} onValueChange={(item) => setSpeciality(item)} enabled={!guardando}>
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

        <Text style={styles.label}>Documentos en PDF</Text>
        {[ {s:ine, f:setIne, t:'INE'}, {s:cedula, f:setCedula, t:'Cédula'}, {s:certificado, f:setCertificado, t:'Certificado'} ].map((item, i) => (
          <View key={i} style={styles.tarjeta}>
            <Text style={styles.nombreDoc}>{item.t}</Text>
            <TouchableOpacity style={[styles.btn, item.s && styles.btnOk]} onPress={() => seleccionarDocumento(item.f)}>
              <Text style={styles.txtBtn}>{item.s ? 'Cargado' : 'Subir PDF'}</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.btnEnv} onPress={handleGuardar} disabled={guardando}>
          {guardando ? <ActivityIndicator color="#fff" /> : <Text style={styles.txtEnv}>Enviar Documentos</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: '#f9f9f9' },
  container: { padding: 25 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#5c4b8a', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  pickerContainer: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 20 },
  tarjeta: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  nombreDoc: { fontSize: 14, marginBottom: 5 },
  btn: { backgroundColor: '#777', padding: 10, borderRadius: 5, alignItems: 'center' },
  btnOk: { backgroundColor: '#28a745' },
  txtBtn: { color: '#fff', fontWeight: 'bold' },
  btnEnv: { backgroundColor: '#5c4b8a', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  txtEnv: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});