import { supabase } from '@/lib/supabase';
import { Picker } from '@react-native-picker/picker';
import { decode } from 'base64-arraybuffer';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CompletarRegistroScreen() {
  const router = useRouter();
  const [speciality, setSpeciality] = useState('Doctor');
  const [ine, setIne] = useState<any>(null);
  const [cedula, setCedula] = useState<any>(null);
  const [certificado, setCertificado] = useState<any>(null);
  const [guardando, setGuardando] = useState(false);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [textoEstado, setTextoEstado] = useState('');

  useEffect(() => {
    const cargarDatosPrevios = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profData } = await supabase.from('professionals').select('speciality').eq('prof_id', user.id).single();
        if (profData?.speciality && profData.speciality !== 'Por definir') {
          setSpeciality(profData.speciality);
        }

        const { data: docsData } = await supabase.from('professional_documents').select('*').eq('prof_id', user.id);
        if (docsData) {
          docsData.forEach(doc => {
            if (doc.document_type === 'INE') setIne(doc.file_url);
            if (doc.document_type === 'Cédula Profesional') setCedula(doc.file_url);
            if (doc.document_type === 'Certificado') setCertificado(doc.file_url);
          });
        }
      } catch (error) {
        console.log('Error al cargar datos:', error);
      } finally {
        setCargandoInicial(false);
      }
    };
    cargarDatosPrevios();
  }, []);

  const seleccionarDocumento = async (guardarEn: any) => {
    try {
      const resultado = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (!resultado.canceled && resultado.assets.length > 0) {
        const archivo = resultado.assets[0];
        if (archivo.size && archivo.size > 2 * 1024 * 1024) {
          return Alert.alert('Error', 'El PDF debe pesar menos de 2MB.');
        }
        guardarEn(archivo);
      }
    } catch (e) { Alert.alert('Error', 'No se pudo abrir el buscador'); }
  };

  const subirAlStorage = async (archivo: any, userId: string, tipo: string) => {
    const nombre = `${tipo}_${userId}_${Date.now()}.pdf`;
    try {
      if (Platform.OS === 'web') {
        const { error } = await supabase.storage.from('profesionales-documentos').upload(nombre, archivo.file, { contentType: 'application/pdf' });
        if (error) throw error;
      } else {
        const fileInfo = await FileSystem.getInfoAsync(archivo.uri);
        if (!fileInfo.exists) throw new Error('No se pudo leer el archivo');
        const base64 = await FileSystem.readAsStringAsync(archivo.uri, { encoding: 'base64' });
        const { error } = await supabase.storage.from('profesionales-documentos').upload(nombre, decode(base64), { contentType: 'application/pdf' });
        if (error) throw error;
      }
      return supabase.storage.from('profesionales-documentos').getPublicUrl(nombre).data.publicUrl;
    } catch (error) {
       throw new Error(`Error subiendo el documento ${tipo}`);
    }
  };

  const procesarArchivo = async (archivoEstado: any, userId: string, tipo: string) => {
    if (typeof archivoEstado === 'string') return archivoEstado; 
    if (archivoEstado) return await subirAlStorage(archivoEstado, userId, tipo);
    return null;
  };

  const handleGuardar = async () => {
    if (!ine || !cedula || !certificado) return Alert.alert('Error', 'Sube los 3 PDFs para continuar');
    setGuardando(true);
    setTextoEstado('Procesando documentos...'); 
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesion expirada');
      
      const urlIne = await procesarArchivo(ine, user.id, 'ine');
      const urlCedula = await procesarArchivo(cedula, user.id, 'cedula');
      const urlCert = await procesarArchivo(certificado, user.id, 'cert');
      
      setTextoEstado('Actualizando perfil...');
      await supabase.from('professionals').update({ speciality }).eq('prof_id', user.id);
      
      setTextoEstado('Guardando registros...');
      await supabase.from('professional_documents').delete().eq('prof_id', user.id);
      await supabase.from('professional_documents').insert([
        { prof_id: user.id, document_type: 'INE', file_url: urlIne },
        { prof_id: user.id, document_type: 'Cédula Profesional', file_url: urlCedula },
        { prof_id: user.id, document_type: 'Certificado', file_url: urlCert}
      ]);

      Alert.alert('Exito', 'Documentos actualizados correctamente');
      router.replace('/(profesionista)/perfil');
    } catch (e: any) { Alert.alert('Error', e.message); } 
    finally { setGuardando(false); setTextoEstado(''); }
  };

  if (cargandoInicial) return <View style={styles.centro}><ActivityIndicator size="large" color="#5c4b8a" /></View>;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.container}>
        <Text style={styles.titulo}>Verificacion Profesional</Text>
        <Text style={styles.label}>Selecciona tu Profesion</Text>
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
        {[ {s:ine, f:setIne, t:'INE'}, {s:cedula, f:setCedula, t:'Cedula Profesional'}, {s:certificado, f:setCertificado, t:'Certificado'} ].map((item, i) => {
          const esUrl = typeof item.s === 'string';
          return (
            <View key={i} style={styles.tarjeta}>
              <View style={styles.headerTarjeta}>
                <Text style={styles.nombreDoc}>{item.t}</Text>
                {esUrl && <TouchableOpacity onPress={() => Linking.openURL(item.s)}><Text style={styles.linkVer}>Ver PDF</Text></TouchableOpacity>}
              </View>
              <TouchableOpacity style={[styles.btn, item.s && styles.btnOk]} onPress={() => seleccionarDocumento(item.f)} disabled={guardando}>
                <Text style={styles.txtBtn}>{esUrl ? 'Cambiar archivo actual' : (item.s ? 'Nuevo PDF listo' : 'Subir PDF')}</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {textoEstado !== '' && <Text style={styles.textoCargando}>{textoEstado}</Text>}

        {/* BOTONES DE ACCION DOBLES */}
        <View style={styles.contenedorBotonesAccion}>
          <TouchableOpacity style={styles.botonCancelar} onPress={() => router.replace('/(profesionista)/perfil')} disabled={guardando}>
            <Text style={styles.textoBotonCancelar}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.botonGuardar, guardando && styles.botonDeshabilitado]} onPress={handleGuardar} disabled={guardando}>
            {guardando ? <ActivityIndicator color="#fff" /> : <Text style={styles.textoBotonGuardar}>Guardar y Enviar</Text>}
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flexGrow: 1, backgroundColor: '#f9f9f9' },
  container: { padding: 25 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#5c4b8a', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  pickerContainer: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 20 },
  tarjeta: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  headerTarjeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  nombreDoc: { fontSize: 14, fontWeight: 'bold', color: '#444' },
  linkVer: { color: '#007bff', fontSize: 13, textDecorationLine: 'underline' },
  btn: { backgroundColor: '#777', padding: 10, borderRadius: 5, alignItems: 'center' },
  btnOk: { backgroundColor: '#28a745' },
  txtBtn: { color: '#fff', fontWeight: 'bold' },
  textoCargando: { color: '#5c4b8a', fontWeight: 'bold', textAlign: 'center', marginVertical: 15 },
  
  contenedorBotonesAccion: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  botonCancelar: { flex: 1, backgroundColor: '#6c757d', padding: 15, borderRadius: 8, alignItems: 'center', marginRight: 10 },
  textoBotonCancelar: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  botonGuardar: { flex: 1, backgroundColor: '#5c4b8a', padding: 15, borderRadius: 8, alignItems: 'center', marginLeft: 10 },
  botonDeshabilitado: { backgroundColor: '#aaa' },
  textoBotonGuardar: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});