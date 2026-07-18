import { usePerfil } from '@/context/PerfilContext';
import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/theme/Colors';
import { Typography } from '@/theme/Typography';
import { Radius, Shadow, Spacing } from '@/theme/Spacing';
import NavbarProfesionista from '@/components/NavbarProfesionista';

export default function EditarPerfilScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { setFotoGlobal } = usePerfil();

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoTrabajo, setSubiendoTrabajo] = useState(false);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState<any>(null);
  
  const [isActive, setIsActive] = useState(true);
  const [portafolio, setPortafolio] = useState<any[]>([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: perfilData, error } = await supabase.from('professionals').select('*').eq('prof_id', user.id).single();
        if (error) throw error;

        setFullName(perfilData.full_name || '');
        setUsername(perfilData.username || '');
        setPhone(perfilData.phone || '');
        setDescription(perfilData.profile_description || '');
        setIsActive(perfilData.is_active ?? true);
        if (perfilData.profile_picture) setFotoPerfil({ uri: perfilData.profile_picture });

        const { data: fotosData } = await supabase.from('professional_images').select('*').eq('prof_id', user.id);
        if (fotosData) setPortafolio(fotosData);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setCargando(false);
    }
  };

  const seleccionarImagen = async () => {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!resultado.canceled && resultado.assets[0].base64) {
      setFotoPerfil({ uri: resultado.assets[0].uri, base64: resultado.assets[0].base64 });
    }
  };

  const agregarFotoPortafolio = async () => {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      base64: true,
    });

    if (!resultado.canceled && resultado.assets[0].base64) {
      setSubiendoTrabajo(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const fileName = `trabajo_${user.id}_${Date.now()}.jpg`;
        const { error: uploadError = null } = await supabase.storage
          .from('profesionales-documentos')
          .upload(fileName, decode(resultado.assets[0].base64), { contentType: 'image/jpeg', upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('profesionales-documentos').getPublicUrl(fileName);

        const { data: nuevaFoto, error: insertError } = await supabase
          .from('professional_images')
          .insert([{ prof_id: user.id, image_url: publicUrl }])
          .select()
          .single();

        if (insertError) throw insertError;
        setPortafolio([...portafolio, nuevaFoto]);

      } catch (e) {
        Alert.alert(t('error'), t('errorSubirFotoTrabajo'));
      } finally {
        setSubiendoTrabajo(false);
      }
    }
  };

  const borrarFotoPortafolio = async (id: number) => {
    try {
      await supabase.from('professional_images').delete().eq('image_id', id);
      setPortafolio(portafolio.filter(foto => foto.image_id !== id));
    } catch (e) {
      Alert.alert(t('error'), t('errorBorrarFoto'));
    }
  };

  const handleGuardar = async () => {
    const nombreLimpio = fullName.trim();
    const usuarioLimpio = username.trim();
    const telefonoLimpio = phone.trim();
    const descripcionLimpia = description.trim();

    if (!nombreLimpio || !usuarioLimpio) {
      Alert.alert(t('error'), t('nombreUsuarioObligatorios'));
      return;
    }

    setGuardando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let publicUrl = fotoPerfil?.uri;

      if (fotoPerfil?.base64) {
        const fileName = `avatar_${user.id}_${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('profesionales-documentos')
          .upload(fileName, decode(fotoPerfil.base64), { contentType: 'image/jpeg', upsert: true });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('profesionales-documentos').getPublicUrl(fileName);
        publicUrl = data.publicUrl;
      }

      const { error: updateError } = await supabase
        .from('professionals')
        .update({
          full_name: nombreLimpio,
          username: usuarioLimpio,
          phone: telefonoLimpio,
          profile_description: descripcionLimpia,
          profile_picture: publicUrl,
          is_active: isActive
        })
        .eq('prof_id', user.id);

      if (updateError) throw updateError;
      if (publicUrl) setFotoGlobal(publicUrl);

      router.replace('/(profesionista)/perfil');
    } catch (error) {
      Alert.alert(t('error'), t('errorGuardarCambios'));
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color="#5c4b8a" />
      </View>
    );
  }

  // EL TRUCO: Si no hay foto, usamos el avatar de repuesto
  const imagenAMostrar = fotoPerfil?.uri || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

  return (
    <View style={{ flex: 1, backgroundColor: Colors.neutral[50] }}>
      <NavbarProfesionista />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>
        <TouchableOpacity onPress={() => router.replace('/(profesionista)/perfil')} style={styles.botonAtrasInline}>
          <Text style={styles.flechaAtras}>❮</Text>
          <Text style={styles.textoAtrasInline}>{t('atras')}</Text>
        </TouchableOpacity>
        
        <Text style={styles.tituloPrincipal}>{t('editarPerfil')}</Text>
        
        <TouchableOpacity style={styles.fotoContainer} onPress={seleccionarImagen}>
          {/* Ahora siempre se dibujará una imagen redonda, ya sea la tuya o el avatar base */}
          <Image source={{ uri: imagenAMostrar }} style={styles.foto} />
        </TouchableOpacity>

        <View style={styles.switchContainer}>
          <View style={styles.switchTextos}>
            <Text style={styles.switchTitulo}>{t('perfilVisible')}</Text>
            <Text style={styles.switchSubtitulo}>
              {isActive ? t('clientesPuedenEncontrarte') : t('perfilOculto')}
            </Text>
          </View>
          <Switch
            trackColor={{ false: "#ccc", true: "#5c4b8a" }}
            thumbColor={isActive ? "#fff" : "#f4f3f4"}
            onValueChange={() => setIsActive(!isActive)}
            value={isActive}
          />
        </View>

        <Text style={styles.label}>{t('nombreCompletoLabel')}</Text>
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} maxLength={100} />

        <Text style={styles.label}>{t('nombreUsuarioLabel')}</Text>
        <TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" maxLength={50} />

        <Text style={styles.label}>{t('telefonoLabel')}</Text>
        <TextInput 
          style={styles.input} 
          value={phone} 
          onChangeText={(texto) => setPhone(texto.replace(/[^0-9]/g, ''))} 
          keyboardType="phone-pad" 
          maxLength={10} 
        />

        <Text style={styles.label}>{t('descripcionProfesionalLabel')}</Text>
        <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline numberOfLines={4} maxLength={500} placeholder={t('cuentaleATusClientes')} />

        <Text style={[styles.label, { marginTop: 25 }]}>{t('misTrabajosFotos')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carrusel}>
          {portafolio.map((item) => (
            <View key={item.image_id} style={styles.fotoTrabajoBox}>
              <Image source={{ uri: item.image_url }} style={styles.fotoTrabajo} />
              <TouchableOpacity style={styles.btnBorrarFoto} onPress={() => borrarFotoPortafolio(item.image_id)}>
                <Text style={styles.txtBorrarFoto}>X</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.btnAgregarFoto} onPress={agregarFotoPortafolio} disabled={subiendoTrabajo}>
            {subiendoTrabajo ? <ActivityIndicator color="#5c4b8a" /> : <Text style={styles.txtAgregarFoto}>{t('anadirTrabajo')}</Text>}
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.contenedorBotonesAccion}>
          <TouchableOpacity style={styles.botonCancelar} onPress={() => router.replace('/(profesionista)/perfil')} disabled={guardando}>
            <Text style={styles.textoBotonCancelar}>{t('cancelar')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.botonGuardar, guardando && styles.botonDeshabilitado]} onPress={handleGuardar} disabled={guardando}>
            {guardando ? <ActivityIndicator color="#fff" /> : <Text style={styles.textoBotonGuardar}>{t('guardar')}</Text>}
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.neutral[50] },
  scroll: { flexGrow: 1, backgroundColor: Colors.neutral[50], paddingBottom: Spacing[10] },
  container: { padding: Spacing[5], maxWidth: 800, width: '100%', alignSelf: 'center' },
  botonAtrasInline: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[4] },
  flechaAtras: { fontSize: 20, color: Colors.primary[700], fontWeight: 'bold', marginRight: 5 },
  textoAtrasInline: { ...Typography.styles.body, color: Colors.primary[700], fontWeight: '700' },
  tituloPrincipal: { ...Typography.styles.h2, fontWeight: 'bold', color: Colors.primary[800], textAlign: 'center', marginBottom: Spacing[5] },
  fotoContainer: { alignSelf: 'center', marginBottom: Spacing[6] },
  foto: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.neutral[200], borderWidth: 2, borderColor: Colors.border.default },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: Spacing[4], borderRadius: Radius.md, marginBottom: Spacing[5], borderWidth: 1, borderColor: Colors.border.default, ...Shadow.sm },
  switchTextos: { flex: 1 },
  switchTitulo: { ...Typography.styles.body, fontWeight: 'bold', color: Colors.text.primary },
  switchSubtitulo: { ...Typography.styles.caption, color: Colors.text.secondary, marginTop: 2 },
  label: { ...Typography.styles.label, fontWeight: 'bold', color: Colors.text.primary, marginBottom: 5, marginTop: Spacing[4] },
  input: { borderWidth: 1, borderColor: Colors.border.default, padding: Spacing[3], borderRadius: Radius.md, backgroundColor: '#fff', ...Typography.styles.body, ...Shadow.sm },
  textArea: { height: 100, textAlignVertical: 'top' },
  carrusel: { flexDirection: 'row', marginTop: Spacing[2], paddingBottom: Spacing[3] },
  fotoTrabajoBox: { marginRight: Spacing[4], position: 'relative' },
  fotoTrabajo: { width: 100, height: 100, borderRadius: Radius.md, backgroundColor: Colors.neutral[200], borderWidth: 1, borderColor: Colors.border.default },
  btnBorrarFoto: { position: 'absolute', top: -5, right: -5, backgroundColor: Colors.error.main, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', ...Shadow.sm },
  txtBorrarFoto: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  btnAgregarFoto: { width: 100, height: 100, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.primary[600], borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary[50] },
  txtAgregarFoto: { color: Colors.primary[700], fontWeight: 'bold', ...Typography.styles.caption, textAlign: 'center' },
  contenedorBotonesAccion: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing[8] },
  botonCancelar: { flex: 1, backgroundColor: Colors.neutral[200], padding: Spacing[4], borderRadius: Radius.button, alignItems: 'center', marginRight: Spacing[2], ...Shadow.sm },
  textoBotonCancelar: { color: Colors.text.primary, fontWeight: 'bold', ...Typography.styles.btn },
  botonGuardar: { flex: 1, backgroundColor: Colors.primary[600], padding: Spacing[4], borderRadius: Radius.button, alignItems: 'center', marginLeft: Spacing[2], ...Shadow.brand },
  botonDeshabilitado: { backgroundColor: Colors.text.disabled },
  textoBotonGuardar: { color: '#fff', fontWeight: 'bold', ...Typography.styles.btn }
});