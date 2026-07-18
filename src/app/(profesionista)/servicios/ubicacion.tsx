import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../../../lib/supabase'; // <-- Tu conexión a la base de datos
import MapaWeb from '../../../components/shared/MapaWeb'; // <-- El mapa universal (Web + Móvil)
import { NominatimService } from '../../../utils/geocodingService'; // <-- Servicio de geolocalización extraído
import { Colors } from '@/theme/Colors';
import { Typography } from '@/theme/Typography';
import { Radius, Shadow, Spacing } from '@/theme/Spacing';
import NavbarProfesionista from '@/components/NavbarProfesionista';

export default function UbicacionServiciosScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  // Estados del formulario
  const [calle, setCalle] = useState('');
  const [numExt, setNumExt] = useState('');
  const [numInt, setNumInt] = useState('');
  const [colonia, setColonia] = useState('');
  const [cp, setCp] = useState('');
  const [referencias, setReferencias] = useState('');

  // Estados del mapa (iniciamos en Chihuahua por defecto)
  const [coordenadas, setCoordenadas] = useState({
    latitude: 28.632995,
    longitude: -106.069099,
  });
  const [cargando, setCargando] = useState(false);

  // Cargar ubicación previamente guardada
  useEffect(() => {
    const cargarUbicacionGuardada = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data, error } = await supabase
          .from('professionals')
          .select('latitude, longitude, address')
          .eq('prof_id', user.id)
          .single();
          
        if (data && data.latitude && data.longitude) {
          setCoordenadas({ latitude: data.latitude, longitude: data.longitude });
          
          if (data.address) {
            if (data.address.includes('|||')) {
              // Formato nuevo con delimitadores para no perder campos
              const partes = data.address.split('|||');
              setCalle(partes[0] || '');
              setNumExt(partes[1] || '');
              setNumInt(partes[2] || '');
              setColonia(partes[3] || '');
              setCp(partes[4] || '');
              setReferencias(partes[5] || '');
            } else {
              // Formato antiguo (texto puro) o guardado desde otra parte
              obtenerDireccionPorCoordenadas(data.latitude, data.longitude);
            }
          } else {
            // Autocompletamos los campos basándonos en el pin guardado si no hay dirección guardada
            obtenerDireccionPorCoordenadas(data.latitude, data.longitude);
          }
        }
      } catch (error) {
        console.log('Error cargando ubicación:', error);
      }
    };
    
    cargarUbicacionGuardada();
  }, []);

  // Función mágica: Traduce las coordenadas a una dirección de texto delegada al servicio externo
  const obtenerDireccionPorCoordenadas = async (lat: number, lon: number) => {
    const direccion = await NominatimService.obtenerDireccion(lat, lon);
    if (direccion) {
      setCalle(direccion.calle);
      setNumExt(direccion.numExt);
      setColonia(direccion.colonia);
      setCp(direccion.cp);
    }
  };

  // Función para buscar latitud/longitud delegada al servicio
  const buscarCoordenadasPorDireccion = async () => {
    if (!calle || !colonia) {
      Alert.alert(t('faltanDatosTitulo', 'Faltan datos'), t('faltanDatosDesc', 'Por favor ingresa al menos la calle y la colonia para buscar en el mapa.'));
      return;
    }
    setCargando(true);
    
    const res = await NominatimService.buscarCoordenadas(calle, numExt, colonia, cp);
    
    if (res) {
      setCoordenadas({ latitude: res.latitude, longitude: res.longitude });
      if (res.intentoUsado === 'estructurada' || res.intentoUsado === 'libre' || res.intentoUsado === 'nativa_exacta') {
        Alert.alert(t('calleEncontradaTitulo', '¡Calle encontrada!'), t('calleEncontradaDesc', 'Te hemos llevado a tu calle. Ahora toca el mapa EXACTAMENTE en tu casa para colocar el pin ahí.'));
      } else {
        Alert.alert(t('zonaEncontradaTitulo', 'Zona encontrada'), t('zonaEncontradaDesc', 'Te hemos acercado a tu zona. Ahora toca el mapa EXACTAMENTE en tu casa para colocar el pin ahí.'));
      }
    } else {
      Alert.alert(t('noEncontradoTitulo', 'No encontrado'), t('noEncontradoDesc', 'No se encontró esa dirección. Usa el botón "📡 Usar mi ubicación actual" o toca el mapa directamente.'));
    }
    
    setCargando(false);
  };

  // ★ NUEVA FUNCIÓN ESTRELLA: Usar el GPS real del dispositivo (funciona en Web Y Móvil)
  const usarMiUbicacion = async () => {
    setCargando(true);
    try {
      // Pedir permiso de ubicación (en Web muestra el popup del navegador, en Móvil el de Android/iOS)
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Para usar esta función necesitas permitir el acceso a tu ubicación en tu navegador o celular.');
        setCargando(false);
        return;
      }

      // Obtener las coordenadas GPS reales del dispositivo
      const ubicacion = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = ubicacion.coords;
      
      setCoordenadas({ latitude, longitude });
      
      // Autocompletar los campos de texto con la dirección que encontró el GPS
      obtenerDireccionPorCoordenadas(latitude, longitude);
      
      Alert.alert(t('ubicacionDetectadaTitulo', '¡Ubicación detectada!'), t('ubicacionDetectadaDesc', 'El mapa se ha centrado en tu ubicación actual. Si necesitas ajustar, toca el mapa para mover el pin.'));
    } catch (error) {
      console.log('Error al obtener ubicación GPS:', error);
      Alert.alert(t('errorGpsTitulo', 'Error de GPS'), t('errorGpsDesc', 'No se pudo obtener tu ubicación. Asegúrate de tener el GPS activado y de haber dado permiso en tu navegador.'));
    } finally {
      setCargando(false);
    }
  };

  // Función para guardar todo en Supabase
  const guardarUbicacion = async () => {
    setCargando(true);
    try {
      // 1. Obtenemos al usuario que tiene la app abierta
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay sesión activa');

      // 2. Unimos la dirección con delimitadores para no perder ningún campo al recargar y no exceder límite de texto en BD
      const direccionCompleta = `${calle}|||${numExt}|||${numInt}|||${colonia}|||${cp}|||${referencias}`;

      // 3. Guardamos en tu tabla professionals (minúsculas)
      const { error } = await supabase
        .from('professionals')
        .update({
          address: direccionCompleta,
          latitude: coordenadas.latitude,
          longitude: coordenadas.longitude,
        })
        .eq('prof_id', user.id);

      if (error) throw error;

      Alert.alert(t('exitoUbicacionTitulo', '¡Éxito!'), t('exitoUbicacionDesc', 'Tu ubicación de trabajo se guardó correctamente.'));
      router.replace('/(profesionista)/servicios'); // Regresamos a servicios

    } catch (error: any) {
      Alert.alert(t('error'), error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.neutral[50] }}>
      <NavbarProfesionista />
      <View style={styles.contenedorFondo}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.container}>
          
          <TouchableOpacity onPress={() => router.replace('/(profesionista)/servicios')} style={styles.botonAtrasInline}>
            <Text style={styles.flechaAtras}>❮</Text>
            <Text style={styles.textoAtrasInline}>{t('atras', 'Atrás')}</Text>
          </TouchableOpacity>

          <Text style={styles.titulo}>{t('ubicacionTitulo', 'Ubicación de Trabajo')}</Text>
          <Text style={styles.subtitulo}>{t('ubicacionSubtitulo', 'Configura la dirección de tu establecimiento para que los clientes sepan a dónde ir.')}</Text>

          {/* BOTÓN GPS: Usar mi ubicación actual */}
          <TouchableOpacity 
            style={styles.botonGPS} 
            onPress={usarMiUbicacion}
            disabled={cargando}
          >
            <Text style={styles.textoBotonGPS}>{t('usarMiUbicacionBoton', '📡 Usar mi ubicación actual')}</Text>
          </TouchableOpacity>

          {/* EL MAPA UNIVERSAL (Web y Móvil) */}
          <View style={styles.mapaContenedor}>
            <MapaWeb 
              coordenadas={coordenadas} 
              onLocationSelect={(lat, lon) => {
                setCoordenadas({ latitude: lat, longitude: lon });
                obtenerDireccionPorCoordenadas(lat, lon);
              }} 
            />
            <Text style={styles.textoMapaSub}>{t('mapaIndicacion', 'Toca el mapa para mover el pin a tu ubicación exacta')}</Text>
            {Platform.OS === 'web' && (
              <Text style={{ fontSize: 12, color: '#ff9800', textAlign: 'center', marginTop: 8, fontStyle: 'italic', paddingHorizontal: 15 }}>
                {t('notaMapaWeb', 'Nota: El mapa visual puede no mostrar las calles con exactitud, pero no te preocupes, los datos que escribas abajo se conectarán a la perfección con Google Maps.')}
              </Text>
            )}
          </View>

          {/* Formulario de Dirección */}
          <Text style={styles.label}>{t('calle', 'Calle')}</Text>
          <TextInput style={styles.input} value={calle} onChangeText={setCalle} placeholder={t('ejCalle', 'Ej. Av. Reforma')} />

          <View style={styles.filaDivisora}>
            <View style={styles.mitad}>
              <Text style={styles.label}>{t('numExt', 'Núm. Exterior')}</Text>
              <TextInput style={styles.input} value={numExt} onChangeText={setNumExt} keyboardType="numeric" />
            </View>
            <View style={styles.mitad}>
              <Text style={styles.label}>{t('numInt', 'Núm. Interior')}</Text>
              <TextInput style={styles.input} value={numInt} onChangeText={setNumInt} placeholder={t('opcional', '(Opcional)')} />
            </View>
          </View>

          <View style={styles.filaDivisora}>
            <View style={styles.mitad}>
              <Text style={styles.label}>{t('colonia', 'Colonia')}</Text>
              <TextInput style={styles.input} value={colonia} onChangeText={setColonia} />
            </View>
            <View style={styles.mitad}>
              <Text style={styles.label}>{t('codigoPostal', 'Código Postal')}</Text>
              <TextInput style={styles.input} value={cp} onChangeText={setCp} keyboardType="numeric" maxLength={5} />
            </View>
          </View>

          <Text style={styles.label}>{t('referencias', 'Referencias Adicionales')}</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            value={referencias} 
            onChangeText={setReferencias} 
            multiline 
            numberOfLines={3} 
            placeholder={t('ejReferencias', 'Ej. Local azul frente al parque...')} 
          />

          <TouchableOpacity 
            style={styles.botonSecundarioLleno} 
            onPress={buscarCoordenadasPorDireccion}
            disabled={cargando}
          >
            <Text style={styles.textoBotonSecundarioLleno}>{t('alinearMapaBoton', '📍 Alinear mapa con lo escrito')}</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      <View style={styles.contenedorFijoAbajo}>
        <TouchableOpacity 
          style={[styles.botonPrimario, cargando && { backgroundColor: '#8a7db3' }]} 
          onPress={guardarUbicacion}
          disabled={cargando}
        >
          <Text style={styles.textoBotonPrimario}>
            {cargando ? t('guardando', 'Guardando...') : t('guardarUbicacion', 'Guardar Ubicación')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedorFondo: { flex: 1, backgroundColor: Colors.neutral[50] },
  scroll: { paddingBottom: Spacing[10] },
  container: { padding: Spacing[5], maxWidth: 800, width: '100%', alignSelf: 'center' },
  botonAtrasInline: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[4] },
  flechaAtras: { fontSize: 20, color: Colors.primary[700], fontWeight: 'bold', marginRight: 5 },
  textoAtrasInline: { ...Typography.styles.body, color: Colors.primary[700], fontWeight: '700' },
  titulo: { ...Typography.styles.h2, fontWeight: 'bold', color: Colors.primary[800], textAlign: 'center' },
  subtitulo: { ...Typography.styles.body, color: Colors.text.secondary, textAlign: 'center', marginBottom: Spacing[6], marginTop: Spacing[1] },
  
  // Nuevos estilos para el mapa
  mapaContenedor: { marginBottom: Spacing[6] },
  mapa: { height: 350, width: '100%', borderRadius: Radius.lg, overflow: 'hidden' },
  textoMapaSub: { color: Colors.text.secondary, fontSize: 12, marginTop: 8, textAlign: 'center', fontStyle: 'italic' },

  label: { ...Typography.styles.label, fontWeight: 'bold', color: Colors.text.primary, marginBottom: 5, marginTop: Spacing[3] },
  input: { borderWidth: 1, borderColor: Colors.border.default, padding: Spacing[3], borderRadius: Radius.md, backgroundColor: '#fff', ...Typography.styles.body, ...Shadow.sm },
  textArea: { height: 80, textAlignVertical: 'top' },
  filaDivisora: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing[2] },
  mitad: { width: '48%' },

  botonSecundarioLleno: { backgroundColor: Colors.neutral[100], padding: Spacing[4], borderRadius: Radius.md, alignItems: 'center', marginTop: Spacing[4], borderWidth: 1, borderColor: Colors.border.default, ...Shadow.sm },
  textoBotonSecundarioLleno: { color: Colors.text.primary, fontWeight: 'bold', ...Typography.styles.body },

  botonGPS: { backgroundColor: Colors.info.main, padding: Spacing[4], borderRadius: Radius.button, alignItems: 'center', marginBottom: Spacing[4], ...Shadow.md },
  textoBotonGPS: { color: '#fff', fontWeight: 'bold', ...Typography.styles.btn },

  contenedorFijoAbajo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing[5], backgroundColor: Colors.neutral[50], borderTopWidth: 1, borderTopColor: Colors.border.default },
  botonPrimario: { backgroundColor: Colors.primary[600], padding: Spacing[4], borderRadius: Radius.button, alignItems: 'center', ...Shadow.brand },
  textoBotonPrimario: { color: '#fff', fontWeight: 'bold', ...Typography.styles.btn }
});