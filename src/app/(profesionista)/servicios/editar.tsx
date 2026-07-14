import { supabase } from '@/lib/supabase';
import { Picker } from '@react-native-picker/picker';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function EditarServicioScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams(); 

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
  const [isActive, setIsActive] = useState(true);
  
  // NUEVO: Estados para la foto
  const [foto, setFoto] = useState<any>(null);
  const [fotoIdOriginal, setFotoIdOriginal] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      inicializarPantalla();
    }
  }, [id]);

  const inicializarPantalla = async () => {
    setCargando(true);
    try {
      const { data: cats } = await supabase.from('categories').select('*');
      setCategorias(cats || []);

      // Pedimos el servicio Y SU FOTO
      const { data: servicio, error } = await supabase
        .from('services')
        .select('*, service_images(image_id, image_url)')
        .eq('service_id', id)
        .single();

      if (error) throw error;

      if (servicio) {
        setNombre(servicio.service_name);
        setDescripcion(servicio.description);
        setPrecio(servicio.base_price.toString());
        setDuracion(servicio.duration_minutes?.toString() || '60');
        setCategoriaId(servicio.category_id.toString());
        setModalidad(servicio.modality || 'Presencial');
        setIsActive(servicio.is_active ?? true);
        
        // Si ya tenía una foto guardada, la ponemos en la pantalla
        if (servicio.service_images && servicio.service_images.length > 0) {
          setFoto({ uri: servicio.service_images[0].image_url });
          setFotoIdOriginal(servicio.service_images[0].image_id); // Guardamos el ID de la foto vieja
        }
      }
    } catch (error: any) {
      setMensajeError(t('errorCargarDatos') + error.message);
    } finally {
      setCargando(false);
    }
  };

  const seleccionarImagen = async () => {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });

    if (!resultado.canceled && resultado.assets[0].base64) {
      setFoto({ uri: resultado.assets[0].uri, base64: resultado.assets[0].base64 });
    }
  };

  const handleActualizar = async () => {
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
      // 1. Actualizamos los textos del servicio
      const { error } = await supabase
        .from('services')
        .update({
          category_id: parseInt(categoriaId),
          service_name: nombreLimpio,
          description: descripcionLimpia,
          base_price: parseFloat(precioLimpio),
          duration_minutes: parseInt(duracion),
          modality: modalidad,
          is_active: isActive
        })
        .eq('service_id', id);

      if (error) throw error;

      // 2. Si hay una FOTO NUEVA (tiene base64), la subimos
      if (foto?.base64) {
        const fileName = `servicio_${id}_${Date.now()}.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from('profesionales-documentos')
          .upload(fileName, decode(foto.base64), { contentType: 'image/jpeg', upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('profesionales-documentos').getPublicUrl(fileName);
          
          // Si ya tenía foto vieja, la actualizamos. Si no tenía foto, la insertamos.
          if (fotoIdOriginal) {
            await supabase.from('service_images').update({ image_url: publicUrl }).eq('image_id', fotoIdOriginal);
          } else {
            await supabase.from('service_images').insert({ service_id: id, image_url: publicUrl });
          }
        }
      }

      router.replace('/(profesionista)/servicios');
    } catch (error: any) {
      setMensajeError(t('errorAlActualizar') + error.message);
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
        <TouchableOpacity onPress={() => router.replace('/(profesionista)/servicios')} style={styles.botonAtrasInline}>
          <Text style={styles.flechaAtras}>❮</Text>
          <Text style={styles.textoAtrasInline}>{t('atras')}</Text>
        </TouchableOpacity>

        <Text style={styles.titulo}>{t('editarServicioTitulo')}</Text>
        <Text style={styles.subtitulo}>{t('editarServicioSubtitulo')}</Text>

        <TouchableOpacity style={styles.fotoContainer} onPress={seleccionarImagen}>
          {foto ? (
            <Image source={{ uri: foto.uri }} style={styles.fotoSeleccionada} />
          ) : (
            <View style={styles.fotoPlaceholder}>
              <Text style={styles.textoPlaceholder}>{t('subirFotoMas')}</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.switchContainer}>
          <View style={styles.switchTextos}>
            <Text style={styles.switchTitulo}>{t('estadoServicio')}</Text>
            <Text style={styles.switchSubtitulo}>
              {isActive ? t('activoVisible') : t('pausadoOculto')}
            </Text>
          </View>
          <Switch
            trackColor={{ false: "#ccc", true: "#5c4b8a" }}
            thumbColor={isActive ? "#fff" : "#f4f3f4"}
            onValueChange={() => setIsActive(!isActive)}
            value={isActive}
          />
        </View>

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
          <TouchableOpacity style={[styles.botonGuardar, guardando && styles.botonDeshabilitado]} onPress={handleActualizar} disabled={guardando}>
            {guardando ? <ActivityIndicator color="#fff" /> : <Text style={styles.textoGuardar}>{t('guardarCambiosBtn')}</Text>}
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
  botonAtrasInline: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  flechaAtras: { fontSize: 20, color: '#5c4b8a', fontWeight: 'bold', marginRight: 5 },
  textoAtrasInline: { fontSize: 16, color: '#5c4b8a', fontWeight: 'bold' },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#5c4b8a', textAlign: 'center' },
  subtitulo: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20, marginTop: 5 },

  fotoContainer: { alignSelf: 'center', marginBottom: 20 },
  fotoSeleccionada: { width: 120, height: 120, borderRadius: 12, backgroundColor: '#e9ecef', borderWidth: 1, borderColor: '#ccc' },
  fotoPlaceholder: { width: 120, height: 120, borderRadius: 12, backgroundColor: '#f4f1fa', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#5c4b8a', borderStyle: 'dashed' },
  textoPlaceholder: { color: '#5c4b8a', fontSize: 16, fontWeight: 'bold' },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f4f1fa', padding: 15, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  switchTextos: { flex: 1 },
  switchTitulo: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  switchSubtitulo: { fontSize: 12, color: '#666', marginTop: 2 },
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