import { supabase } from '@/lib/supabase';
import { Picker } from '@react-native-picker/picker';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AgregarServicioScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [mensajeError, setMensajeError] = useState('');

  // Campos del formulario
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [duracion, setDuracion] = useState('60');
  const [categoriaId, setCategoriaId] = useState('');
  const [modalidad, setModalidad] = useState('Presencial');
  
  // NUEVO: El estado para guardar la foto
  const [foto, setFoto] = useState<any>(null);

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      setCategorias(data || []);
      
      if (data && data.length > 0) {
        setCategoriaId(data[0].category_id.toString());
      }
    } catch (error: any) {
      setMensajeError(t('errorCargarCategorias'));
    } finally {
      setCargando(false);
    }
  };

  // NUEVO: Función para abrir la galería del celular
  const seleccionarImagen = async () => {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Para que la foto sea cuadrada como la tarjeta
      quality: 0.6,
      base64: true,
    });

    if (!resultado.canceled && resultado.assets[0].base64) {
      setFoto({ uri: resultado.assets[0].uri, base64: resultado.assets[0].base64 });
    }
  };

  const handleGuardar = async () => {
    setMensajeError('');
    const nombreLimpio = nombre.trim();
    const descripcionLimpia = descripcion.trim();
    const precioLimpio = precio.trim();

    if (!nombreLimpio || !descripcionLimpia || !precioLimpio || !categoriaId) {
      return setMensajeError(t('camposObligatoriosError'));
    }

    if (parseFloat(precioLimpio) > 999999) {
      return setMensajeError(t('precioMaximoError'));
    }

    setGuardando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('noSesionError'));

      // 1. Guardamos el servicio en la base de datos y le pedimos que nos devuelva el ID creado
      const { data: nuevoServicio, error: errorServicio } = await supabase
        .from('services')
        .insert({
          prof_id: user.id,
          category_id: parseInt(categoriaId),
          service_name: nombreLimpio,
          description: descripcionLimpia,
          base_price: parseFloat(precioLimpio),
          duration_minutes: parseInt(duracion),
          modality: modalidad
        })
        .select()
        .single(); // .single() es la magia para que nos regrese el servicio recién creado

      if (errorServicio) throw errorServicio;

      // 2. Si el usuario seleccionó una foto, la subimos a la nube
      if (foto?.base64 && nuevoServicio) {
        const fileName = `servicio_${nuevoServicio.service_id}_${Date.now()}.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from('profesionales-documentos')
          .upload(fileName, decode(foto.base64), { contentType: 'image/jpeg', upsert: true });

        if (!uploadError) {
          // Si se subió bien, sacamos el link público y lo guardamos en la tabla de service_images
          const { data: { publicUrl } } = supabase.storage.from('profesionales-documentos').getPublicUrl(fileName);
          
          await supabase.from('service_images').insert({
            service_id: nuevoServicio.service_id,
            image_url: publicUrl
          });
        }
      }

      router.replace('/(profesionista)/servicios');
    } catch (error: any) {
      setMensajeError(t('errorAlGuardar') + error.message);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <View style={styles.centro}><ActivityIndicator size="large" color="#5c4b8a" /></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.container}>
        <Text style={styles.titulo}>{t('crearNuevoServicioTitulo')}</Text>
        <Text style={styles.subtitulo}>{t('crearServicioSubtitulo')}</Text>

        {/* NUEVO: El botón para subir la foto */}
        <TouchableOpacity style={styles.fotoContainer} onPress={seleccionarImagen}>
          {foto ? (
            <Image source={{ uri: foto.uri }} style={styles.fotoSeleccionada} />
          ) : (
            <View style={styles.fotoPlaceholder}>
              <Text style={styles.textoPlaceholder}>{t('subirFotoMas')}</Text>
              <Text style={styles.textoSubPlaceholder}>{t('opcional')}</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>{t('nombreServicioReq')}</Text>
        <TextInput style={styles.input} value={nombre} onChangeText={setNombre} maxLength={100} editable={!guardando} />

        <Text style={styles.label}>{t('descripcionReq')}</Text>
        <TextInput style={[styles.input, styles.textArea]} value={descripcion} onChangeText={setDescripcion} multiline numberOfLines={3} editable={!guardando} />

        <View style={styles.filaDivisora}>
          <View style={styles.mitad}>
            <Text style={styles.label}>{t('precioBaseReq')}</Text>
            <TextInput 
              style={styles.input} 
              value={precio} 
              onChangeText={(texto) => setPrecio(texto.replace(/[^0-9]/g, ''))} 
              keyboardType="numeric" 
              editable={!guardando} 
              maxLength={6} 
            />
          </View>
          
          <View style={styles.mitad}>
            <Text style={styles.label}>{t('modalidad')}</Text>
            <View style={styles.pickerBox}>
              <Picker selectedValue={modalidad} onValueChange={setModalidad} enabled={!guardando}>
                <Picker.Item label={t('presencial')} value="Presencial" />
                <Picker.Item label={t('enLinea')} value="En línea" />
                <Picker.Item label={t('ambos')} value="Ambos" />
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.filaDivisora}>
          <View style={styles.mitad}>
            <Text style={styles.label}>{t('duracion')}</Text>
            <View style={styles.pickerBox}>
              <Picker selectedValue={duracion} onValueChange={setDuracion} enabled={!guardando}>
                <Picker.Item label={t('duracion30')} value="30" />
                <Picker.Item label={t('duracion60')} value="60" />
                <Picker.Item label={t('duracion90')} value="90" />
                <Picker.Item label={t('duracion120')} value="120" />
              </Picker>
            </View>
          </View>

          <View style={styles.mitad}>
            <Text style={styles.label}>{t('categoriaReq')}</Text>
            <View style={styles.pickerBox}>
              <Picker selectedValue={categoriaId} onValueChange={setCategoriaId} enabled={!guardando}>
                {categorias.map(cat => <Picker.Item key={cat.category_id} label={cat.category_name} value={cat.category_id.toString()} />)}
              </Picker>
            </View>
          </View>
        </View>

        {mensajeError !== '' && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{mensajeError}</Text>
          </View>
        )}

        <View style={styles.contenedorBotones}>
        <TouchableOpacity style={styles.botonCancelar} onPress={() => router.replace('/(profesionista)/servicios')} disabled={guardando}>
  <Text style={styles.textoCancelar}>{t('cancelar')}</Text>
</TouchableOpacity>

          <TouchableOpacity style={[styles.botonGuardar, guardando && styles.botonDeshabilitado]} onPress={handleGuardar} disabled={guardando}>
            {guardando ? <ActivityIndicator color="#fff" /> : <Text style={styles.textoGuardar}>{t('crearServicioBtn')}</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  scroll: { flexGrow: 1, backgroundColor: '#fff', paddingBottom: 40 },
  container: { padding: 20 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#5c4b8a', textAlign: 'center' },
  subtitulo: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20, marginTop: 5 },
  
  // Estilos de la foto
  fotoContainer: { alignSelf: 'center', marginBottom: 20 },
  fotoSeleccionada: { width: 120, height: 120, borderRadius: 12, backgroundColor: '#e9ecef', borderWidth: 1, borderColor: '#ccc' },
  fotoPlaceholder: { width: 120, height: 120, borderRadius: 12, backgroundColor: '#f4f1fa', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#5c4b8a', borderStyle: 'dashed' },
  textoPlaceholder: { color: '#5c4b8a', fontSize: 16, fontWeight: 'bold' },
  textoSubPlaceholder: { color: '#888', fontSize: 10, marginTop: 4 },

  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 5, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, backgroundColor: '#f9f9f9', fontSize: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  filaDivisora: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  mitad: { width: '48%' },
  pickerBox: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, backgroundColor: '#f9f9f9', height: 50, justifyContent: 'center' },
  errorBox: { backgroundColor: '#ffe6e6', padding: 12, borderRadius: 5, marginTop: 20, borderWidth: 1, borderColor: '#ff4d4d' },
  errorText: { color: '#d9534f', textAlign: 'center', fontWeight: 'bold', fontSize: 14 },
  contenedorBotones: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  botonCancelar: { flex: 1, backgroundColor: '#6c757d', padding: 15, borderRadius: 8, alignItems: 'center', marginRight: 10 },
  textoCancelar: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  botonGuardar: { flex: 1, backgroundColor: '#5c4b8a', padding: 15, borderRadius: 8, alignItems: 'center', marginLeft: 10 },
  botonDeshabilitado: { backgroundColor: '#aaa' },
  textoGuardar: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});