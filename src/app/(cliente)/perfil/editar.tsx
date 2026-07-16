import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import NavbarCliente from '../../../components/NavbarCliente';

export default function EditarPerfilClienteScreen() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState<any>(null);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('clientes').select('*').eq('id', user.id).single();
    if (data) {
      setFullName(data.full_name || '');
      setUsername(data.username || '');
      setPhone(data.phone || '');
      if (data.avatar_url) setFotoPerfil({ uri: data.avatar_url, esNueva: false });
    }
    setCargando(false);
  };

  const seleccionarImagen = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled) {
      setFotoPerfil({ uri: result.assets[0].uri, base64: result.assets[0].base64, esNueva: true });
    }
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No hay usuario");

      let urlFinal = fotoPerfil?.uri;

      // SUBIDA AL STORAGE SI LA FOTO ES NUEVA
      if (fotoPerfil?.esNueva && fotoPerfil?.base64) {
        const fileName = `avatar_${user.id}_${Date.now()}.jpg`; 
        const { error: uploadError } = await supabase.storage
          .from('clientes-avatars')
          .upload(fileName, decode(fotoPerfil.base64), { 
            contentType: 'image/jpeg', 
            upsert: true 
          });
        
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('clientes-avatars').getPublicUrl(fileName);
        urlFinal = data.publicUrl;
      }

      // USO DE UPSERT: Si el ID existe, actualiza; si no, inserta.
      const { error: upsertError } = await supabase
        .from('clientes')
        .upsert({ 
          id: user.id,
          full_name: fullName,
          username: username,
          phone: phone,
          avatar_url: urlFinal 
        });

      if (upsertError) throw upsertError;

      setGuardando(false);
      Alert.alert('Éxito', 'Perfil actualizado');
      
      // Navegación segura
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(cliente)/perfil');
      }

    } catch (e) {
      setGuardando(false);
      Alert.alert('Error', 'No se pudo guardar la información');
      console.log(e);
    }
  };

  if (cargando) return <View style={styles.centro}><ActivityIndicator size="large" /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <NavbarCliente />
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={seleccionarImagen} style={styles.fotoContainer}>
          <Image source={{ uri: fotoPerfil?.uri || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} style={styles.foto} />
          <Text style={styles.textoCambiarFoto}>Cambiar Foto</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Nombre</Text>
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
        
        <Text style={styles.label}>Usuario</Text>
        <TextInput style={styles.input} value={username} onChangeText={setUsername} />
        
        <Text style={styles.label}>Teléfono</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

        <TouchableOpacity style={styles.botonGuardar} onPress={handleGuardar} disabled={guardando}>
          <Text style={styles.textoBotonGuardar}>{guardando ? 'Guardando...' : 'Guardar'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 20, maxWidth: 600, width: '100%', alignSelf: 'center' },
  fotoContainer: { alignSelf: 'center', marginBottom: 20, alignItems: 'center' },
  foto: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#eee' },
  textoCambiarFoto: { color: '#007bff', marginTop: 10, fontWeight: 'bold' },
  label: { fontWeight: 'bold', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 8, fontSize: 16 },
  botonGuardar: { backgroundColor: '#5c4b8a', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  textoBotonGuardar: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});