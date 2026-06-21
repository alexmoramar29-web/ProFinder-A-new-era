import { supabase } from '@/lib/supabase';
import { Picker } from '@react-native-picker/picker';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AgregarServicioScreen() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [mensajeError, setMensajeError] = useState('');

  // Campos del formulario
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [duracion, setDuracion] = useState('60'); 
  const [categoriaId, setCategoriaId] = useState('');
  
  // NUEVO: Estado para la modalidad
  const [modalidad, setModalidad] = useState('Presencial');

  // NUEVO: Estados para la galería de fotos
  const [fotos, setFotos] = useState<any[]>([]);
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    setMensajeError('');
    try {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      setCategorias(data || []);
      if (data && data.length > 0) setCategoriaId(data[0].category_id.toString());
    } catch (error: any) {
      setMensajeError('No se pudieron leer las categorias: ' + error.message);
    }
  };

  // Función para abrir la galería del celular y elegir una foto
  const agregarFoto = async () => {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      base64: true,
    });

    if (!resultado.canceled && resultado.assets[0].base64) {
      const nuevaFoto = {
        uri: resultado.assets[0].uri,
        base64: resultado.assets[0].base64,
        id: Date.now().toString() // Un ID temporal para poder borrarla de la pantalla
      };
      setFotos([...fotos, nuevaFoto]);
    }
  };

  // Función para quitar una foto de la lista antes de guardar
  const quitarFoto = (id: string) => {
    setFotos(fotos.filter(f => f.id !== id));
  };

  const handleGuardar = async () => {
    setMensajeError('');
    const nombreLimpio = nombre.trim();
    const descripcionLimpia = descripcion.trim();
    const precioLimpio = precio.trim();

    if (!nombreLimpio || !descripcionLimpia || !precioLimpio || !categoriaId) {
      return setMensajeError('Faltan datos: Llena todos los textos y el precio.');
    }

    setCargando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesión expirada.');

      // 1. Guardamos el servicio en la base de datos
      const { data: nuevoServicio, error: errorServicio } = await supabase.from('services').insert([{
        prof_id: user.id,
        category_id: parseInt(categoriaId),
        service_name: nombreLimpio,
        description: descripcionLimpia,
        base_price: parseFloat(precioLimpio),
        duration_minutes: parseInt(duracion),
        modality: modalidad // Guardamos si es presencial o en línea
      }]).select().single();

      if (errorServicio) throw errorServicio;

      // 2. Si el profesionista agregó fotos, las guardamos en la bodega conectadas a este servicio
      if (fotos.length > 0) {
        for (const foto of fotos) {
          const fileName = `servicio_${nuevoServicio.service_id}_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
          
          // Subimos la imagen a Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('profesionales-documentos')
            .upload(fileName, decode(foto.base64), { contentType: 'image/jpeg', upsert: true });
          
          if (!uploadError) {
            // Obtenemos el link público
            const { data: urlData } = supabase.storage.from('profesionales-documentos').getPublicUrl(fileName);
            
            // Registramos la foto en tu tabla de service_images
            await supabase.from('service_images').insert([{
              service_id: nuevoServicio.service_id,
              image_url: urlData.publicUrl
            }]);
          }
        }
      }

      router.replace('/(profesionista)/servicios');
    } catch (error: any) {
      setMensajeError('Error al guardar: ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>
          <Text style={styles.titulo}>Nuevo Servicio</Text>
          <Text style={styles.subtitulo}>Escribe los detalles y sube fotos para atraer más clientes.</Text>

          <Text style={styles.label}>Nombre del Servicio</Text>
          <TextInput style={styles.input} placeholder="Ej: Limpieza Dental" value={nombre} onChangeText={setNombre} maxLength={100} editable={!cargando} />

          <Text style={styles.label}>Descripción</Text>
          <TextInput style={[styles.input, styles.textArea]} placeholder="¿En qué consiste el trabajo?" value={descripcion} onChangeText={setDescripcion} multiline numberOfLines={3} editable={!cargando} />

          <View style={styles.filaDivisora}>
            <View style={styles.mitad}>
              <Text style={styles.label}>Precio Base ($)</Text>
              <TextInput style={styles.input} placeholder="Ej: 500" value={precio} onChangeText={(texto) => setPrecio(texto.replace(/[^0-9.]/g, ''))} keyboardType="numeric" editable={!cargando} />
            </View>
            
            <View style={styles.mitad}>
              <Text style={styles.label}>Modalidad</Text>
              <View style={styles.pickerBox}>
                <Picker selectedValue={modalidad} onValueChange={setModalidad} enabled={!cargando}>
                  <Picker.Item label="Presencial" value="Presencial" />
                  <Picker.Item label="En línea" value="En línea" />
                  <Picker.Item label="Ambos" value="Ambos" />
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.filaDivisora}>
            <View style={styles.mitad}>
              <Text style={styles.label}>Duración (Aprox)</Text>
              <View style={styles.pickerBox}>
                <Picker selectedValue={duracion} onValueChange={setDuracion} enabled={!cargando}>
                  <Picker.Item label="30 min" value="30" />
                  <Picker.Item label="1 hora" value="60" />
                  <Picker.Item label="1 hr 30 min" value="90" />
                  <Picker.Item label="2 horas" value="120" />
                </Picker>
              </View>
            </View>

            <View style={styles.mitad}>
              <Text style={styles.label}>Categoría</Text>
              <View style={styles.pickerBox}>
                <Picker selectedValue={categoriaId} onValueChange={setCategoriaId} enabled={!cargando}>
                  {categorias.map(cat => <Picker.Item key={cat.category_id} label={cat.category_name} value={cat.category_id.toString()} />)}
                </Picker>
              </View>
            </View>
          </View>

          {/* SECCION DE GALERIA DE FOTOS */}
          <Text style={[styles.label, { marginTop: 25 }]}>Fotos de muestra (Opcional)</Text>
          <Text style={styles.notaGaleria}>Sube fotos de tus trabajos anteriores para darle confianza al cliente.</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carrusel}>
            {fotos.map((foto) => (
              <View key={foto.id} style={styles.fotoTrabajoBox}>
                <TouchableOpacity onPress={() => setFotoAmpliada(foto.uri)}>
                  <Image source={{ uri: foto.uri }} style={styles.fotoTrabajo} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnBorrarFoto} onPress={() => quitarFoto(foto.id)}>
                  <Text style={styles.txtBorrarFoto}>X</Text>
                </TouchableOpacity>
              </View>
            ))}
            
            <TouchableOpacity style={styles.btnAgregarFoto} onPress={agregarFoto} disabled={cargando}>
              <Text style={styles.txtAgregarFoto}>+ Añadir</Text>
            </TouchableOpacity>
          </ScrollView>

          {mensajeError !== '' && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{mensajeError}</Text>
            </View>
          )}

          <View style={styles.contenedorBotones}>
            <TouchableOpacity style={styles.botonCancelar} onPress={() => router.back()} disabled={cargando}>
              <Text style={styles.textoCancelar}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.botonGuardar, cargando && styles.botonDeshabilitado]} onPress={handleGuardar} disabled={cargando}>
              {cargando ? <ActivityIndicator color="#fff" /> : <Text style={styles.textoGuardar}>Guardar Servicio</Text>}
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      {/* LUPA: Capa oscura para ver la foto en grande */}
      <Modal visible={fotoAmpliada !== null} transparent={true} animationType="fade">
        <View style={styles.modalFondoOscuro}>
          <TouchableOpacity style={styles.botonCerrarModal} onPress={() => setFotoAmpliada(null)}>
            <Text style={styles.textoCerrarModal}>Cerrar X</Text>
          </TouchableOpacity>
          {fotoAmpliada && <Image source={{ uri: fotoAmpliada }} style={styles.fotoGigante} resizeMode="contain" />}
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: '#fff', paddingBottom: 40 },
  container: { padding: 20 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#5c4b8a', textAlign: 'center' },
  subtitulo: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20, marginTop: 5 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 5, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, backgroundColor: '#f9f9f9', fontSize: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  filaDivisora: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  mitad: { width: '48%' },
  pickerBox: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, backgroundColor: '#f9f9f9', height: 50, justifyContent: 'center' },
  
  notaGaleria: { fontSize: 12, color: '#888', marginBottom: 10 },
  carrusel: { flexDirection: 'row', paddingBottom: 10 },
  fotoTrabajoBox: { marginRight: 15, position: 'relative' },
  fotoTrabajo: { width: 100, height: 100, borderRadius: 8, backgroundColor: '#eee', borderWidth: 1, borderColor: '#ccc' },
  btnBorrarFoto: { position: 'absolute', top: -5, right: -5, backgroundColor: 'red', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  txtBorrarFoto: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  btnAgregarFoto: { width: 100, height: 100, borderRadius: 8, borderWidth: 2, borderColor: '#5c4b8a', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f1fa' },
  txtAgregarFoto: { color: '#5c4b8a', fontWeight: 'bold' },

  errorBox: { backgroundColor: '#ffe6e6', padding: 12, borderRadius: 5, marginTop: 20, borderWidth: 1, borderColor: '#ff4d4d' },
  errorText: { color: '#d9534f', textAlign: 'center', fontWeight: 'bold', fontSize: 14 },
  contenedorBotones: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  botonCancelar: { flex: 1, backgroundColor: '#6c757d', padding: 15, borderRadius: 8, alignItems: 'center', marginRight: 10 },
  textoCancelar: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  botonGuardar: { flex: 1, backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center', marginLeft: 10 },
  botonDeshabilitado: { backgroundColor: '#aaa' },
  textoGuardar: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  modalFondoOscuro: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)', justifyContent: 'center', alignItems: 'center' },
  botonCerrarModal: { position: 'absolute', top: 50, right: 20, padding: 10, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 5, zIndex: 10 },
  textoCerrarModal: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  fotoGigante: { width: '90%', height: '80%' }
});