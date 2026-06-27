import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../../../lib/supabase'; // <-- Tu conexión a la base de datos
import MapaWeb from '../../../components/shared/MapaWeb'; // <-- El mapa universal (Web + Móvil)

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
          .select('latitude, longitude')
          .eq('prof_id', user.id)
          .single();
          
        if (data && data.latitude && data.longitude) {
          setCoordenadas({ latitude: data.latitude, longitude: data.longitude });
          // Autocompletamos los campos basándonos en el pin guardado
          obtenerDireccionPorCoordenadas(data.latitude, data.longitude);
        }
      } catch (error) {
        console.log('Error cargando ubicación:', error);
      }
    };
    
    cargarUbicacionGuardada();
  }, []);

  // Freno anti-spam: Nominatim solo permite 1 petición por segundo
  const ultimaPeticion = React.useRef(0);

  // Función mágica: Traduce las coordenadas a una dirección de texto
  const obtenerDireccionPorCoordenadas = async (lat: number, lon: number) => {
    // Evitar mandar demasiadas peticiones a Nominatim (mínimo 2 segundos entre cada una)
    const ahora = Date.now();
    if (Platform.OS === 'web' && ahora - ultimaPeticion.current < 2000) {
      console.log('[ProFinder] Esperando cooldown de Nominatim...');
      return;
    }
    ultimaPeticion.current = ahora;

    try {
      if (Platform.OS === 'web') {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&email=alexmoramar29@gmail.com`;
        const response = await fetch(url);
        const data = await response.json();

        console.log('[ProFinder] Reverse geocode completa:', JSON.stringify(data.address));
        console.log('[ProFinder] display_name:', data.display_name);

        if (data && data.address) {
          const a = data.address;
          setCalle(a.road || a.pedestrian || a.street || '');
          setNumExt(a.house_number || '');
          
          // Colonia: buscar en todos los campos posibles de Nominatim para México
          const coloniaEncontrada = a.neighbourhood || a.suburb || a.quarter || a.city_district || a.hamlet || a.village || a.town || '';
          
          // Si Nominatim no devolvió colonia en campos individuales, la sacamos del display_name
          // display_name siempre viene completo, ej: "Calle X, Colonia Y, Chihuahua, 31064, México"
          if (!coloniaEncontrada && data.display_name) {
            const partes = data.display_name.split(',').map((p: string) => p.trim());
            // La colonia suele ser el 2do o 3er elemento del display_name
            if (partes.length >= 3) {
              setColonia(partes[1] || '');
            }
          } else {
            setColonia(coloniaEncontrada);
          }
          
          // CP: si no viene en postcode, buscarlo en el display_name (es un número de 5 dígitos)
          if (a.postcode) {
            setCp(a.postcode);
          } else if (data.display_name) {
            const matchCP = data.display_name.match(/\b(\d{5})\b/);
            if (matchCP) {
              setCp(matchCP[1]);
            }
          }
        }
      } else {
        const ubicaciones = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        if (ubicaciones && ubicaciones.length > 0) {
          const u = ubicaciones[0];
          setCalle(u.street || '');
          setNumExt(u.streetNumber || '');
          setColonia(u.district || u.city || u.subregion || '');
          setCp(u.postalCode || '');
        }
      }
    } catch (error) {
      console.log('Error al traducir las coordenadas:', error);
    }
  };

  // Función para buscar latitud/longitud a partir del texto escrito a mano
  const buscarCoordenadasPorDireccion = async () => {
    if (!calle || !colonia) {
      Alert.alert('Faltan datos', 'Por favor ingresa al menos la calle y la colonia para buscar en el mapa.');
      return;
    }
    setCargando(true);
    try {
      if (Platform.OS === 'web') {
        // LÓGICA WEB: Nominatim optimizado para direcciones mexicanas
        let data: any = null;
        let intentoUsado = '';

        // Limpiamos los datos: si el usuario ya escribió el número en el campo de calle, no lo duplicamos
        let calleClean = calle.trim();
        let numClean = numExt.trim();
        if (numClean && calleClean.includes(numClean)) {
          // El número ya está dentro del campo de calle, lo quitamos para no duplicar
          numClean = '';
        }

        // INTENTO 1: Búsqueda estructurada (street + CP + país, SIN colonia como ciudad)
        // En México las colonias NO son ciudades, así que no usamos el parámetro city=colonia
        const streetParam = numClean ? `${numClean} ${calleClean}` : calleClean;
        const urlEstructurada = `https://nominatim.openstreetmap.org/search?format=json&street=${encodeURIComponent(streetParam)}&postalcode=${encodeURIComponent(cp || '')}&country=Mexico&limit=1&addressdetails=1&email=alexmoramar29@gmail.com`;
        console.log('[ProFinder] Intento 1 - Estructurada:', streetParam, '| CP:', cp);
        
        try {
          const res1 = await fetch(urlEstructurada);
          if (res1.status !== 429) {
            const data1 = await res1.json();
            console.log('[ProFinder] Resultado estructurada:', JSON.stringify(data1));
            if (data1 && data1.length > 0) { data = data1; intentoUsado = 'estructurada'; }
          }
        } catch (e) { console.log('[ProFinder] Error intento 1:', e); }

        // INTENTO 2: Búsqueda libre con calle + número + colonia + CP + México
        if (!data) {
          const query2 = `${calleClean} ${numClean}, ${colonia}, ${cp || ''}, México`;
          const url2 = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query2)}&limit=1&countrycodes=mx&email=alexmoramar29@gmail.com`;
          console.log('[ProFinder] Intento 2 - Libre completa:', query2);
          try {
            const res2 = await fetch(url2);
            if (res2.status !== 429) {
              const data2 = await res2.json();
              console.log('[ProFinder] Resultado libre:', JSON.stringify(data2));
              if (data2 && data2.length > 0) { data = data2; intentoUsado = 'libre'; }
            }
          } catch (e) { console.log('[ProFinder] Error intento 2:', e); }
        }

        // INTENTO 3: Solo calle + CP + México (sin colonia, que a veces confunde)
        if (!data) {
          const query3 = `${calleClean}, ${cp || ''}, México`;
          const url3 = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query3)}&limit=1&countrycodes=mx&email=alexmoramar29@gmail.com`;
          console.log('[ProFinder] Intento 3 - Calle + CP:', query3);
          try {
            const res3 = await fetch(url3);
            if (res3.status !== 429) {
              const data3 = await res3.json();
              console.log('[ProFinder] Resultado intento 3:', JSON.stringify(data3));
              if (data3 && data3.length > 0) { data = data3; intentoUsado = 'calle_cp'; }
            }
          } catch (e) { console.log('[ProFinder] Error intento 3:', e); }
        }

        // INTENTO 4: Solo colonia + CP + México
        if (!data) {
          const query4 = `${colonia}, ${cp || ''}, México`;
          const url4 = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query4)}&limit=1&countrycodes=mx&email=alexmoramar29@gmail.com`;
          console.log('[ProFinder] Intento 4 - Solo colonia:', query4);
          try {
            const res4 = await fetch(url4);
            if (res4.status !== 429) {
              const data4 = await res4.json();
              console.log('[ProFinder] Resultado intento 4:', JSON.stringify(data4));
              if (data4 && data4.length > 0) { data = data4; intentoUsado = 'solo_colonia'; }
            }
          } catch (e) { console.log('[ProFinder] Error intento 4:', e); }
        }
        
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          console.log('[ProFinder] ¡ENCONTRADO! (intento:', intentoUsado, ') Moviendo mapa a:', lat, lon);
          setCoordenadas({ latitude: lat, longitude: lon });
          if (intentoUsado === 'estructurada' || intentoUsado === 'libre') {
            Alert.alert('¡Calle encontrada!', 'Te hemos llevado a tu calle. Ahora toca el mapa EXACTAMENTE en tu casa para colocar el pin ahí.');
          } else {
            Alert.alert('Zona encontrada', 'Te hemos acercado a tu zona. Ahora toca el mapa EXACTAMENTE en tu casa para colocar el pin ahí.');
          }
        } else {
          Alert.alert('No encontrado', 'No se encontró esa dirección. Usa el botón "📡 Usar mi ubicación actual" o toca el mapa directamente.');
        }
      } else {
        // LÓGICA MÓVIL: Expo Location (Nativo de Google/Apple)
        await Location.requestForegroundPermissionsAsync();
        const direccionCompleta = `${calle} ${numExt ? numExt : ''}, ${colonia}${cp ? `, ${cp}` : ''}, México`;
        const resultados = await Location.geocodeAsync(direccionCompleta);
        
        if (resultados && resultados.length > 0) {
          setCoordenadas({ latitude: resultados[0].latitude, longitude: resultados[0].longitude });
          Alert.alert('¡Encontrado!', 'El mapa se ha centrado en tu dirección.');
        } else {
          const fallback = `${calle}, ${colonia}, México`;
          const res2 = await Location.geocodeAsync(fallback);
          if (res2 && res2.length > 0) {
            setCoordenadas({ latitude: res2[0].latitude, longitude: res2[0].longitude });
            Alert.alert('Aproximación', 'Centramos el mapa en tu zona. Mueve el pin para mayor exactitud.');
          } else {
            Alert.alert('No encontrado', 'Usa el botón "📡 Usar mi ubicación actual" para que el GPS te lleve directo.');
          }
        }
      }
    } catch (error) {
      console.log('Error al buscar dirección:', error);
      Alert.alert('Error', 'Hubo un problema. Usa el botón de "📡 Usar mi ubicación actual".');
    } finally {
      setCargando(false);
    }
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
      
      Alert.alert('¡Ubicación detectada!', 'El mapa se ha centrado en tu ubicación actual. Si necesitas ajustar, toca el mapa para mover el pin.');
    } catch (error) {
      console.log('Error al obtener ubicación GPS:', error);
      Alert.alert('Error de GPS', 'No se pudo obtener tu ubicación. Asegúrate de tener el GPS activado y de haber dado permiso en tu navegador.');
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

      // 2. Unimos la dirección en un solo texto limpio
      const direccionCompleta = `${calle} ${numExt} ${numInt ? `Int ${numInt}` : ''}, ${colonia}, CP ${cp}. Ref: ${referencias}`;

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

      Alert.alert('¡Éxito!', 'Tu ubicación de trabajo se guardó correctamente.');
      router.replace('/(profesionista)/servicios'); // Regresamos a servicios

    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
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
            <Text style={styles.textoBotonGPS}>📡 Usar mi ubicación actual</Text>
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
            <Text style={styles.textoBotonSecundarioLleno}>📍 Alinear mapa con lo escrito</Text>
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
  );
}

const styles = StyleSheet.create({
  contenedorFondo: { flex: 1, backgroundColor: '#fcfcfc' },
  scroll: { paddingBottom: 100 },
  container: { padding: 20 },
  botonAtrasInline: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  flechaAtras: { fontSize: 20, color: '#5c4b8a', fontWeight: 'bold', marginRight: 5 },
  textoAtrasInline: { fontSize: 16, color: '#5c4b8a', fontWeight: 'bold' },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#5c4b8a', textAlign: 'center' },
  subtitulo: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20, marginTop: 5 },
  
  // Nuevos estilos para el mapa
  mapaContenedor: { marginBottom: 25 },
  mapa: { height: 350, width: '100%', borderRadius: 12, overflow: 'hidden' },
  textoMapaSub: { color: '#888', fontSize: 12, marginTop: 8, textAlign: 'center', fontStyle: 'italic' },

  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 5, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, backgroundColor: '#f9f9f9', fontSize: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  filaDivisora: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  mitad: { width: '48%' },

  botonSecundarioLleno: { backgroundColor: '#e9ecef', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 15, borderWidth: 1, borderColor: '#ccc' },
  textoBotonSecundarioLleno: { color: '#333', fontWeight: 'bold', fontSize: 14 },

  botonGPS: { backgroundColor: '#2196F3', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15, shadowColor: '#2196F3', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  textoBotonGPS: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  contenedorFijoAbajo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#fcfcfc', borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  botonPrimario: { backgroundColor: '#5c4b8a', padding: 15, borderRadius: 8, alignItems: 'center' },
  textoBotonPrimario: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});