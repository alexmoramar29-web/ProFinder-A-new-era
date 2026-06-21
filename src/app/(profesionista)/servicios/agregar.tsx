import { supabase } from '@/lib/supabase';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AgregarServicioScreen() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  
  // NUEVO: Caja para mostrar los errores directo en la pantalla
  const [mensajeError, setMensajeError] = useState('');

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [duracion, setDuracion] = useState('60'); 
  const [categoriaId, setCategoriaId] = useState('');

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    setMensajeError('');
    try {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      
      setCategorias(data || []);
      
      if (data && data.length > 0) {
        setCategoriaId(data[0].category_id.toString());
      } else {
        // Si la tabla categories está vacía en Supabase, avisamos al usuario
        setMensajeError('Aviso: La tabla de categorias esta vacia en Supabase. Ve al SQL Editor e inserta al menos una categoria.');
      }
    } catch (error: any) {
      setMensajeError('No se pudieron leer las categorias: ' + error.message);
    }
  };

  const handleGuardar = async () => {
    setMensajeError('');
    
    const nombreLimpio = nombre.trim();
    const descripcionLimpia = descripcion.trim();
    const precioLimpio = precio.trim();

    // Validaciones con letreros visuales
    if (!nombreLimpio || !descripcionLimpia || !precioLimpio) {
      return setMensajeError('Faltan datos: Por favor escribe el nombre, descripcion y precio.');
    }

    if (!categoriaId) {
      return setMensajeError('Falta la categoria: No puedes guardar un servicio si la cajita de categorias esta vacia.');
    }

    setCargando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Tu sesion ha expirado, vuelve a iniciar sesion.');

      const { error } = await supabase.from('services').insert([{
        prof_id: user.id,
        category_id: parseInt(categoriaId),
        service_name: nombreLimpio,
        description: descripcionLimpia,
        base_price: parseFloat(precioLimpio),
        duration_minutes: parseInt(duracion)
      }]);

      if (error) throw error;

      router.replace('/(profesionista)/servicios');
    } catch (error: any) {
      setMensajeError('Supabase rechazo el guardado: ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.container}>
        <Text style={styles.titulo}>Nuevo Servicio</Text>
        <Text style={styles.subtitulo}>Escribe los detalles del servicio que vas a ofrecer.</Text>

        <Text style={styles.label}>Nombre del Servicio</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ej: Formateo de Computadora" 
          value={nombre} 
          onChangeText={setNombre} 
          maxLength={100} 
          editable={!cargando} 
        />

        <Text style={styles.label}>Descripcion</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="¿En qué consiste el trabajo?" 
          value={descripcion} 
          onChangeText={setDescripcion} 
          multiline 
          numberOfLines={3} 
          editable={!cargando} 
        />

        <Text style={styles.label}>Precio Base ($)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ej: 500" 
          value={precio} 
          onChangeText={(texto) => setPrecio(texto.replace(/[^0-9.]/g, ''))} 
          keyboardType="numeric" 
          editable={!cargando} 
        />

        <View style={styles.filaDivisora}>
          <View style={styles.mitad}>
            <Text style={styles.label}>Duración (Aprox)</Text>
            <View style={styles.pickerBox}>
              <Picker selectedValue={duracion} onValueChange={setDuracion} enabled={!cargando}>
                <Picker.Item label="30 min" value="30" />
                <Picker.Item label="1 hora" value="60" />
                <Picker.Item label="1 hr 30 min" value="90" />
                <Picker.Item label="2 horas" value="120" />
                <Picker.Item label="3 horas" value="180" />
              </Picker>
            </View>
          </View>

          <View style={styles.mitad}>
            <Text style={styles.label}>Categoría</Text>
            <View style={styles.pickerBox}>
              <Picker selectedValue={categoriaId} onValueChange={setCategoriaId} enabled={!cargando}>
                {categorias.map(cat => (
                  <Picker.Item key={cat.category_id} label={cat.category_name} value={cat.category_id.toString()} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* NUEVO: Caja roja que te dira exactamente que esta fallando */}
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
            {cargando ? <ActivityIndicator color="#fff" /> : <Text style={styles.textoGuardar}>Guardar</Text>}
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: '#fff' },
  container: { padding: 20 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#5c4b8a', textAlign: 'center' },
  subtitulo: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20, marginTop: 5 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 5, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, backgroundColor: '#f9f9f9', fontSize: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  filaDivisora: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  mitad: { width: '48%' },
  pickerBox: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, backgroundColor: '#f9f9f9' },
  errorBox: { backgroundColor: '#ffe6e6', padding: 12, borderRadius: 5, marginTop: 20, borderWidth: 1, borderColor: '#ff4d4d' },
  errorText: { color: '#d9534f', textAlign: 'center', fontWeight: 'bold', fontSize: 14 },
  contenedorBotones: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  botonCancelar: { flex: 1, backgroundColor: '#6c757d', padding: 15, borderRadius: 8, alignItems: 'center', marginRight: 10 },
  textoCancelar: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  botonGuardar: { flex: 1, backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center', marginLeft: 10 },
  botonDeshabilitado: { backgroundColor: '#aaa' },
  textoGuardar: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});