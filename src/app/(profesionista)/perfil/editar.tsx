import { usePerfil } from '@/context/PerfilContext';
import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function EditarPerfilScreen() {
  const router = useRouter();
  
  // Tomamos la funcion para hablar por el Walkie-Talkie
  const { setFotoGlobal } = usePerfil();

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState<any>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('professionals')
          .select('*')
          .eq('prof_id', user.id)
          .single();

        if (error) throw error;

        setFullName(data.full_name || '');
        setUsername(data.username || '');
        setPhone(data.phone || '');
        setDescription(data.profile_description || '');
        if (data.profile_picture) {
          // Guardamos la URL actual para mostrarla
          setFotoPerfil({ uri: data.profile_picture });
        }
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
      // Guardamos la nueva imagen localmente para la vista previa
      setFotoPerfil({
        uri: resultado.assets[0].uri,
        base64: resultado.assets[0].base64,
      });
    }
  };

  const handleGuardar = async () => {
    if (!fullName || !username) {
      Alert.alert('Error', 'Nombre y Usuario son obligatorios');
      return;
    }

    setGuardando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Por defecto usamos la URL que ya teniamos
      let publicUrl = fotoPerfil?.uri;

      // Si hay una base64 nueva, significa que el usuario cambio la foto
      if (fotoPerfil?.base64) {
        const fileName = `avatar_${user.id}_${Date.now()}.jpg`;
        
        // 1. Subimos la foto real a la bodega (Storage)
        const { error: uploadError } = await supabase.storage
          .from('profesionales-documentos')
          .upload(fileName, decode(fotoPerfil.base64), {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        // 2. Obtenemos la URL publica de la nueva foto
        const { data } = supabase.storage
          .from('profesionales-documentos')
          .getPublicUrl(fileName);
        
        publicUrl = data.publicUrl;
      }

      // 3. Actualizamos la base de datos con los textos y la URL final
      const { error: updateError } = await supabase
        .from('professionals')
        .update({
          full_name: fullName,
          username: username,
          phone: phone,
          profile_description: description,
          profile_picture: publicUrl,
        })
        .eq('prof_id', user.id);

      if (updateError) throw updateError;

      // 4. PASO MAGICO: Avisamos por el Walkie-Talkie la nueva URL
      // Esto actualiza la barra superior y la pantalla de Perfil al instante
      if (publicUrl) setFotoGlobal(publicUrl);

      router.back();
    } catch (error) {
      console.log(error);
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
        <TextInput 
          style={styles.input} 
          value={fullName} 
          onChangeText={setFullName} 
        />

        <Text style={styles.label}>Nombre de Usuario</Text>
        <TextInput 
          style={styles.input} 
          value={username} 
          onChangeText={setUsername} 
          autoCapitalize="none"
        />

        <Text style={styles.label}>Teléfono</Text>
        <TextInput 
          style={styles.input} 
          value={phone} 
          onChangeText={setPhone} 
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Descripción Profesional</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          value={description} 
          onChangeText={setDescription} 
          multiline 
          numberOfLines={4}
          placeholder="Cuéntale a tus clientes sobre tu experiencia..."
        />

        <TouchableOpacity 
          style={[styles.boton, guardando && styles.botonDeshabilitado]} 
          onPress={handleGuardar}
          disabled={guardando}
        >
          {guardando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.botonTexto}>Guardar Cambios</Text>
          )}
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
  boton: { backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 30 },
  botonDeshabilitado: { backgroundColor: '#ccc' },
  botonTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});