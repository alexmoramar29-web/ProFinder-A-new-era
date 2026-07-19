import { supabase } from '@/lib/supabase';
import { Picker } from '@react-native-picker/picker';
import { decode } from 'base64-arraybuffer';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/theme/Colors';
import { Typography } from '@/theme/Typography';
import { Radius, Shadow, Spacing } from '@/theme/Spacing';
import NavbarProfesionista from '@/components/NavbarProfesionista';
import { useTheme } from '@/context/ThemeContext';

export default function CompletarRegistroScreen() {
  const { isDark, colors } = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const { t } = useTranslation();
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
      router.replace('/(profesionista)/mi-perfil');
    } catch (e: any) { Alert.alert('Error', e.message); } 
    finally { setGuardando(false); setTextoEstado(''); }
  };

  if (cargandoInicial) return <View style={styles.centro}><ActivityIndicator size="large" color={colors.primary[600]} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral[50] }}>
      <NavbarProfesionista />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>
          <Text style={styles.titulo}>{t('verificacionProfesional')}</Text>
        <Text style={styles.label}>{t('seleccionaTuProfesion')}</Text>
        <View style={styles.pickerContainer}>
          <Picker dropdownIconColor={colors.text.primary} style={{ color: colors.text.primary, backgroundColor: colors.neutral[0] }} selectedValue={speciality} onValueChange={(item) => setSpeciality(item)} enabled={!guardando}>
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

        <Text style={styles.label}>{t('documentosEnPdf')}</Text>
        {[ {s:ine, f:setIne, t:'INE'}, {s:cedula, f:setCedula, t:'Cedula Profesional'}, {s:certificado, f:setCertificado, t:'Certificado'} ].map((item, i) => {
          const esUrl = typeof item.s === 'string';
          return (
            <View key={i} style={styles.tarjeta}>
              <View style={styles.headerTarjeta}>
                <Text style={styles.nombreDoc}>{item.t}</Text>
                {esUrl && <TouchableOpacity onPress={() => Linking.openURL(item.s)}><Text style={styles.linkVer}>{t('verPdfCorto')}</Text></TouchableOpacity>}
              </View>
              <TouchableOpacity style={[styles.btn, item.s && styles.btnOk]} onPress={() => seleccionarDocumento(item.f)} disabled={guardando}>
                <Text style={styles.txtBtn}>{esUrl ? t('cambiarArchivoActual') : (item.s ? t('nuevoPdfListo') : t('subirPdf'))}</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {textoEstado !== '' && <Text style={styles.textoCargando}>{textoEstado}</Text>}

        {/* BOTONES DE ACCION DOBLES */}
        <View style={styles.contenedorBotonesAccion}>
          <TouchableOpacity style={styles.botonCancelar} onPress={() => router.replace('/(profesionista)/mi-perfil')} disabled={guardando}>
            <Text style={styles.textoBotonCancelar}>{t('cancelar')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.botonGuardar, guardando && styles.botonDeshabilitado]} onPress={handleGuardar} disabled={guardando}>
            {guardando ? <ActivityIndicator color={colors.neutral[0]} /> : <Text style={styles.textoBotonGuardar}>{t('guardarYEnviar')}</Text>}
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.neutral[50] },
  scroll: { flexGrow: 1, backgroundColor: colors.neutral[50] },
  container: { padding: Spacing[5], maxWidth: 800, width: '100%', alignSelf: 'center' },
  titulo: { ...Typography.styles.h2, fontWeight: 'bold', color: colors.primary[800], textAlign: 'center', marginBottom: Spacing[5] },
  label: { ...Typography.styles.label, fontWeight: 'bold', color: colors.text.primary, marginBottom: 10 },
  pickerContainer: { backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.border.default, borderRadius: Radius.md, marginBottom: Spacing[5], ...Shadow.sm },
  tarjeta: { backgroundColor: colors.neutral[0], padding: Spacing[4], borderRadius: Radius.md, marginBottom: Spacing[3], borderWidth: 1, borderColor: colors.border.default, ...Shadow.sm },
  headerTarjeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  nombreDoc: { ...Typography.styles.body, fontWeight: 'bold', color: colors.text.primary },
  linkVer: { color: colors.info.main, fontSize: 13, textDecorationLine: 'underline' },
  btn: { backgroundColor: colors.neutral[400], padding: Spacing[3], borderRadius: Radius.button, alignItems: 'center' },
  btnOk: { backgroundColor: colors.success.main },
  txtBtn: { color: colors.neutral[0], ...Typography.styles.btn, fontWeight: 'bold' },
  textoCargando: { color: colors.primary[700], fontWeight: 'bold', textAlign: 'center', marginVertical: Spacing[4] },
  
  contenedorBotonesAccion: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing[6] },
  botonCancelar: { flex: 1, backgroundColor: colors.neutral[200], padding: Spacing[4], borderRadius: Radius.button, alignItems: 'center', marginRight: Spacing[2], ...Shadow.sm },
  textoBotonCancelar: { color: colors.text.primary, ...Typography.styles.btn, fontWeight: 'bold' },
  botonGuardar: { flex: 1, backgroundColor: colors.primary[600], padding: Spacing[4], borderRadius: Radius.button, alignItems: 'center', marginLeft: Spacing[2], ...Shadow.brand },
  botonDeshabilitado: { backgroundColor: colors.text.disabled },
  textoBotonGuardar: { color: colors.neutral[0], ...Typography.styles.btn, fontWeight: 'bold' }
});