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
    const { data } = await supabase.from('users').select('*').eq('user_id', user.id).single();
    if (data) {
      setFullName(data.full_name || '');
      setUsername(data.username || '');
      setPhone(data.phone || '');
      const pic = data.profile_picture || user.user_metadata?.avatar_url || user.user_metadata?.picture;
      if (pic) setFotoPerfil({ uri: pic, esNueva: false });
    } else {
      // Fallback
      setFullName(user.user_metadata?.full_name || '');
      setUsername(user.email?.split('@')[0] || '');
      const avatarFallback = user.user_metadata?.avatar_url || user.user_metadata?.picture;
      if (avatarFallback) setFotoPerfil({ uri: avatarFallback, esNueva: false });
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
        .from('users')
        .upsert({ 
          user_id: user.id,
          full_name: fullName,
          username: username,
          phone: phone,
          profile_picture: urlFinal 
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
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} maxLength={100} />
        
        <Text style={styles.label}>Usuario</Text>
        <TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" maxLength={50} />
        
        <Text style={styles.label}>Teléfono</Text>
        <TextInput 
          style={styles.input} 
          value={phone} 
          onChangeText={(texto) => setPhone(texto.replace(/[^0-9]/g, ''))} 
          keyboardType="phone-pad" 
          maxLength={10} 
        />

        <View style={styles.contenedorBotonesAccion}>
          <TouchableOpacity style={styles.botonCancelar} onPress={() => router.replace('/(cliente)/perfil')} disabled={guardando}>
            <Text style={styles.textoBotonCancelar}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botonGuardar} onPress={handleGuardar} disabled={guardando}>
            <Text style={styles.textoBotonGuardar}>{guardando ? 'Guardando...' : 'Guardar'}</Text>
          </TouchableOpacity>
        </View>
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
  contenedorBotonesAccion: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 15 },
  botonGuardar: { flex: 1, backgroundColor: '#5c4b8a', padding: 15, borderRadius: 8, alignItems: 'center' },
  botonCancelar: { flex: 1, backgroundColor: '#f4f3f4', padding: 15, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ccc' },
  textoBotonGuardar: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  textoBotonCancelar: { color: '#333', fontWeight: 'bold', fontSize: 16 }
});