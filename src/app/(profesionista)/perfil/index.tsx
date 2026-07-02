import { usePerfil } from '@/context/PerfilContext';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
import MapaWeb from '@/components/shared/MapaWeb';

export default function PerfilScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [perfil, setPerfil] = useState<any>(null);
  const [portafolio, setPortafolio] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const { fotoGlobal } = usePerfil();

  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);

  const cargarPerfil = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase.from('professionals').select('*').eq('prof_id', user.id).single();
        if (error) throw error;
        setPerfil(data);

        const { data: fotos } = await supabase.from('professional_images').select('*').eq('prof_id', user.id);
        if (fotos) setPortafolio(fotos);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(useCallback(() => { cargarPerfil(); }, []));

  if (cargando) {
    return (
      <View style={styles.cargandoContainer}>
        <ActivityIndicator size="large" color="#5c4b8a" />
      </View>
    );
  }

  const fotoGrandeMostrar = fotoGlobal || perfil?.profile_picture || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';
  const estadoVerificacion = perfil?.verification_status || 'Pendiente';
  const perfilPausado = perfil?.is_active === false;

  let colorEtiqueta = '#6c757d'; 
  let textoEtiqueta = t('documentosSinRevisar');
  
  const estadoLimpio = estadoVerificacion.toLowerCase();
  const esAprobado = estadoLimpio === 'verificado' || estadoLimpio === 'aprobado' || estadoLimpio === 'perfil aprobado';

  if (esAprobado) {
    colorEtiqueta = '#28a745'; 
    textoEtiqueta = t('perfilAprobado');
  } else if (estadoLimpio === 'en revision' || estadoLimpio === 'en revisión') {
    colorEtiqueta = '#ffc107'; 
    textoEtiqueta = t('documentosEnRevision');
  } else if (estadoLimpio === 'rechazado') {
    colorEtiqueta = '#dc3545'; 
    textoEtiqueta = t('documentosRechazados');
  }

  const abrirGoogleMaps = () => {
    if (perfil?.address && perfil.address.includes('|||')) {
      // Usar la dirección de texto para que Google Maps use su buscador hiper-preciso
      const partes = perfil.address.split('|||');
      const calle = partes[0] || '';
      const numExt = partes[1] || '';
      const colonia = partes[3] || '';
      const cp = partes[4] || '';
      
      // Creamos una búsqueda ultra limpia para Google.
      // Si tenemos CP, OMITIMOS la colonia. Los nombres de colonias muy raros o largos 
      // confunden a Google Maps. El CP + Calle + Número es exacto.
      let searchQuery = '';
      if (cp) {
        searchQuery = `${calle} ${numExt}, ${cp}, México`;
      } else {
        searchQuery = `${calle} ${numExt}, ${colonia}, México`;
      }
      
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;
      Linking.openURL(url);
    } else if (perfil?.latitude && perfil?.longitude) {
      // Fallback a las coordenadas si no hay dirección estructurada
      const url = `https://www.google.com/maps/search/?api=1&query=${perfil.latitude},${perfil.longitude}`;
      Linking.openURL(url);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {perfilPausado && (
          <View style={styles.bannerPausado}>
            <Text style={styles.textoBannerPausado}>
              {t('perfilPausadoMensaje')}
            </Text>
          </View>
        )}

        <View style={styles.container}>
          
          <View style={styles.fotoContainer}>
            <TouchableOpacity onPress={() => { if (fotoGrandeMostrar) setFotoAmpliada(fotoGrandeMostrar); }}>
              {fotoGrandeMostrar ? (
                <Image source={{ uri: fotoGrandeMostrar }} style={styles.foto} />
              ) : (
                <View style={styles.fotoVacia}>
                  <Text style={styles.textoFotoVacia}>{t('sinFoto')}</Text>
                </View>
              )}
            </TouchableOpacity>

            {esAprobado && (
              <View style={styles.circuloVerificado}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
            )}
          </View>

          <View style={styles.nombreContainer}>
            <Text style={styles.nombreTexto}>{perfil?.full_name || t('nombreNoDisponible')}</Text>
          </View>

          <View style={[styles.etiquetaVerificacion, { backgroundColor: colorEtiqueta }]}>
            <Text style={styles.textoEtiqueta}>{textoEtiqueta}</Text>
          </View>

          <View style={styles.datosCard}>
            <Text style={styles.datoTitulo}>{t('nombreUsuarioDato')}</Text>
            <Text style={styles.datoValor}>@{perfil?.username}</Text>

            <Text style={styles.datoTitulo}>{t('profesionDato')}</Text>
            <Text style={styles.datoValor}>{perfil?.speciality}</Text>

            <Text style={styles.datoTitulo}>{t('telefonoDato')}</Text>
            <Text style={styles.datoValor}>{perfil?.phone || t('sinTelefono')}</Text>

            <Text style={styles.datoTitulo}>{t('descripcionDato')}</Text>
            <Text style={styles.datoValor}>{perfil?.profile_description || t('sinDescripcion')}</Text>
          </View>

          {perfil?.address ? (
            <View style={styles.mapaContenedor}>
              <Text style={[styles.datoTitulo, { marginTop: 0 }]}>{t('ubicacionTitulo', '📍 Ubicación de Trabajo')}</Text>
              <Text style={styles.datoValor}>
                {(() => {
                  if (perfil.address.includes('|||')) {
                    const partes = perfil.address.split('|||');
                    const c = partes[0] || '';
                    const ne = partes[1] || '';
                    const ni = partes[2] || '';
                    const co = partes[3] || '';
                    const cp = partes[4] || '';
                    const r = partes[5] || '';
                    return `${c} ${ne} ${ni ? `Int ${ni}` : ''}, ${co}, CP ${cp}${r ? `. Ref: ${r}` : ''}`;
                  }
                  return perfil.address;
                })()}
              </Text>

              {perfil?.latitude && perfil?.longitude && (
                <>
                  <TouchableOpacity onPress={abrirGoogleMaps} style={styles.mapaPequeno} activeOpacity={0.8}>
                    <MapaWeb 
                      coordenadas={{ latitude: perfil.latitude, longitude: perfil.longitude }} 
                      height={150} 
                      readOnly={true}
                    />
                    <View style={styles.etiquetaAbrirMapa}>
                      <Text style={styles.textoAbrirMapa}>{t('abrirEnGoogleMaps', 'Abrir en Google Maps')}</Text>
                    </View>
                  </TouchableOpacity>
                  {Platform.OS === 'web' && (
                    <Text style={{ fontSize: 11, color: '#888', textAlign: 'center', marginTop: 4, fontStyle: 'italic' }}>
                      Al hacer clic se abrirá Google Maps con la ubicación exacta.
                    </Text>
                  )}
                </>
              )}
            </View>
          ) : (
            <View style={styles.mapaPlaceholder}>
              <Text style={styles.textoMapa}>{t('ubicacionNoConfigurada', 'Ubicación no configurada')}</Text>
            </View>
          )}

          {portafolio.length > 0 && (
            <View style={styles.portafolioContenedor}>
              <Text style={styles.tituloSeccion}>{t('misTrabajos')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carrusel}>
                {portafolio.map((item) => (
                  <TouchableOpacity key={item.image_id} onPress={() => setFotoAmpliada(item.image_url)}>
                    <Image source={{ uri: item.image_url }} style={styles.fotoTrabajo} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.contenedorBotones}>
            <TouchableOpacity style={styles.botonSecundario} onPress={() => router.push('/(profesionista)/perfil/editar')}>
              <Text style={styles.textoBoton}>{t('editarPerfil')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.botonPrimario} onPress={() => router.push('/(profesionista)/completar-registro')}>
              <Text style={styles.textoBoton}>{t('documentosBoton')}</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      <Modal visible={fotoAmpliada !== null} transparent={true} animationType="fade">
        
        <View style={styles.modalFondoOscuro}>
          <TouchableOpacity style={styles.botonCerrarModal} onPress={() => setFotoAmpliada(null)}>
            <Text style={styles.textoCerrarModal}>{t('cerrarModal')}</Text>
          </TouchableOpacity>
          
          {fotoAmpliada && (
            <Image source={{ uri: fotoAmpliada }} style={styles.fotoGigante} resizeMode="contain" />
          )}
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  cargandoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContainer: { flexGrow: 1, backgroundColor: '#f4f4f4' },
  bannerPausado: { backgroundColor: '#6c757d', padding: 10, width: '100%', alignItems: 'center' },
  textoBannerPausado: { color: '#fff', fontWeight: 'bold', fontSize: 12, textAlign: 'center' },
  container: { flex: 1, padding: 20, alignItems: 'center' },
  fotoContainer: { marginBottom: 15, position: 'relative' },
  foto: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#ddd' },
  fotoVacia: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  textoFotoVacia: { color: '#666', fontWeight: 'bold' },
  
  // PASO 2: Las reglas mágicas para acomodar el círculo morado encima de la foto
  circuloVerificado: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    backgroundColor: '#5c4b8a', // Tu color morado principal
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f4f4f4', // Una pequeña orilla clara para que resalte hermoso
  },

  nombreContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  nombreTexto: { fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  
  // PASO 3: Reducimos el tamaño del texto y ajustamos la etiqueta
  etiquetaVerificacion: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 20 },
  textoEtiqueta: { color: '#fff', fontWeight: 'bold', fontSize: 10 }, // Texto más pequeño y fino
  
  datosCard: { width: '100%', backgroundColor: '#fff', padding: 20, borderRadius: 10, elevation: 3, marginBottom: 20 },
  datoTitulo: { fontSize: 12, color: '#888', marginTop: 10, fontWeight: 'bold' },
  datoValor: { fontSize: 16, color: '#333', marginBottom: 5 },
  
  mapaContenedor: { width: '100%', backgroundColor: '#fff', padding: 20, borderRadius: 10, elevation: 3, marginBottom: 20 },
  mapaPequeno: { height: 150, width: '100%', borderRadius: 12, overflow: 'hidden', marginTop: 15 },
  mapa: { flex: 1 },
  mapaPlaceholder: { width: '100%', height: 100, backgroundColor: '#e9ecef', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: '#ccc', borderStyle: 'dashed' },
  textoMapa: { color: '#6c757d', fontWeight: 'bold', fontSize: 14 },
  etiquetaAbrirMapa: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
  textoAbrirMapa: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  
  portafolioContenedor: { width: '100%', marginBottom: 20 },
  tituloSeccion: { fontSize: 16, fontWeight: 'bold', color: '#5c4b8a', marginBottom: 10, alignSelf: 'flex-start' },
  carrusel: { flexDirection: 'row' },
  fotoTrabajo: { width: 120, height: 120, borderRadius: 10, marginRight: 15, backgroundColor: '#ddd', borderWidth: 1, borderColor: '#ccc' },
  contenedorBotones: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  botonPrimario: { flex: 1, backgroundColor: '#5c4b8a', padding: 15, borderRadius: 8, alignItems: 'center', marginLeft: 5 },
  botonSecundario: { flex: 1, backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center', marginRight: 5 },
  textoBoton: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  modalFondoOscuro: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)', justifyContent: 'center', alignItems: 'center' },
  botonCerrarModal: { position: 'absolute', top: 50, right: 20, padding: 10, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 5, zIndex: 10 },
  textoCerrarModal: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  fotoGigante: { width: '90%', height: '80%' }
});