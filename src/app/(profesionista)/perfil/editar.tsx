import { usePerfil } from '@/context/PerfilContext';
import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function EditarPerfilScreen() {
  const router = useRouter();
  const { setFotoGlobal } = usePerfil();

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoTrabajo, setSubiendoTrabajo] = useState(false);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState<any>(null);
  
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
        if (perfilData.profile_picture) setFotoPerfil({ uri: perfilData.profile_picture });

        // Traemos las fotos de la tabla corregida
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
        const { error: uploadError } = await supabase.storage
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
        Alert.alert('Error', 'No se pudo subir la foto del trabajo');
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
      Alert.alert('Error', 'No se pudo borrar la foto');
    }
  };

  const handleGuardar = async () => {
    const nombreLimpio = fullName.trim();
    const usuarioLimpio = username.trim();
    const telefonoLimpio = phone.trim();
    const descripcionLimpia = description.trim();

    if (!nombreLimpio || !usuarioLimpio) {
      Alert.alert('Error', 'Nombre y Usuario son obligatorios');
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
        })
        .eq('prof_id', user.id);

      if (updateError) throw updateError;
      if (publicUrl) setFotoGlobal(publicUrl);

      router.back();
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar los cambios');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.container}>
        
        <TouchableOpacity style={styles.fotoContainer} onPress={seleccionarImagen}>
          {fotoPerfil ? (
            <Image source={{ uri: fotoPerfil.uri }} style={styles.foto} />
          ) : (
            <View style={styles.fotoPlaceholder}>
              <Text style={styles.textoPlaceholder}>Subir Foto</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Nombre Completo</Text>
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} maxLength={100} />

        <Text style={styles.label}>Nombre de Usuario</Text>
        <TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" maxLength={50} />

      <Text style={styles.label}>Teléfono</Text>
        <TextInput 
          style={styles.input} 
          value={phone} 
          onChangeText={(texto) => setPhone(texto.replace(/[^0-9+]/g, ''))} 
          keyboardType="phone-pad" 
          maxLength={13} 
        />

        <Text style={styles.label}>Descripción Profesional</Text>
        <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline numberOfLines={4} maxLength={500} placeholder="Cuéntale a tus clientes sobre tu experiencia..." />

        <Text style={[styles.label, { marginTop: 25 }]}>Mis Trabajos (Fotos)</Text>
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
            {subiendoTrabajo ? <ActivityIndicator color="#5c4b8a" /> : <Text style={styles.txtAgregarFoto}>+ Añadir</Text>}
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity style={[styles.boton, guardando && styles.botonDeshabilitado]} onPress={handleGuardar} disabled={guardando}>
          {guardando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botonTexto}>Guardar Cambios</Text>}
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flexGrow: 1, backgroundColor: '#fff' },
  container: { padding: 20 },
  fotoContainer: { alignSelf: 'center', marginBottom: 25 },
  foto: { width: 120, height: 120, borderRadius: 60 },
  fotoPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#e9ecef', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ccc' },
  textoPlaceholder: { color: '#6c757d', fontSize: 14, fontWeight: 'bold' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 5, marginTop: 15 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, backgroundColor: '#f9f9f9', fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  carrusel: { flexDirection: 'row', marginTop: 10, paddingBottom: 10 },
  fotoTrabajoBox: { marginRight: 15, position: 'relative' },
  fotoTrabajo: { width: 100, height: 100, borderRadius: 8, backgroundColor: '#eee', borderWidth: 1, borderColor: '#ccc' },
  btnBorrarFoto: { position: 'absolute', top: -5, right: -5, backgroundColor: 'red', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  txtBorrarFoto: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  btnAgregarFoto: { width: 100, height: 100, borderRadius: 8, borderWidth: 2, borderColor: '#5c4b8a', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f1fa' },
  txtAgregarFoto: { color: '#5c4b8a', fontWeight: 'bold' },
  boton: { backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 30 },
  botonDeshabilitado: { backgroundColor: '#ccc' },
  botonTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});