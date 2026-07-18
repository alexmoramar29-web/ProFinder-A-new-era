import { usePerfil } from '@/context/PerfilContext';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/theme/Colors';
import { Typography } from '@/theme/Typography';
import { Radius, Shadow, Spacing } from '@/theme/Spacing';
import { ActivityIndicator, Image, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
import NavbarProfesionista from '@/components/NavbarProfesionista';
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
        <ActivityIndicator size="large" color={Colors.primary[600]} />
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
    colorEtiqueta = Colors.success.main; 
    textoEtiqueta = t('perfilAprobado');
  } else if (estadoLimpio === 'en revision' || estadoLimpio === 'en revisión') {
    colorEtiqueta = Colors.warning.main; 
    textoEtiqueta = t('documentosEnRevision');
  } else if (estadoLimpio === 'rechazado') {
    colorEtiqueta = Colors.error.main; 
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
    <View style={{ flex: 1, backgroundColor: Colors.neutral[50] }}>
      <NavbarProfesionista />
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
                    <Text style={{ fontSize: 11, color: Colors.text.disabled, textAlign: 'center', marginTop: 4, fontStyle: 'italic' }}>
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
              <Text style={styles.textoBotonSecundario}>{t('editarPerfil')}</Text>
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
  scrollContainer: { flexGrow: 1, backgroundColor: Colors.neutral[50] },
  bannerPausado: { backgroundColor: Colors.text.secondary, padding: Spacing[3], width: '100%', alignItems: 'center' },
  textoBannerPausado: { color: '#fff', fontWeight: 'bold', fontSize: 12, textAlign: 'center' },
  container: { flex: 1, padding: Spacing[5], alignItems: 'center' },
  fotoContainer: { marginBottom: Spacing[4], position: 'relative' },
  foto: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.neutral[200] },
  fotoVacia: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.neutral[200], justifyContent: 'center', alignItems: 'center' },
  textoFotoVacia: { color: Colors.text.secondary, fontWeight: 'bold' },
  
  circuloVerificado: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    backgroundColor: Colors.primary[600],
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.neutral[50],
  },

  nombreContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  nombreTexto: { ...Typography.styles.h2, color: Colors.text.primary, textAlign: 'center', fontWeight: '800' },
  
  etiquetaVerificacion: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, marginBottom: Spacing[5] },
  textoEtiqueta: { color: '#fff', fontWeight: '700', fontSize: 11, textTransform: 'uppercase' },
  
  datosCard: { width: '100%', backgroundColor: '#fff', padding: Spacing[5], borderRadius: Radius.lg, ...Shadow.md, marginBottom: Spacing[5], borderWidth: 1, borderColor: Colors.border.default },
  datoTitulo: { ...Typography.styles.overline, color: Colors.text.disabled, marginTop: 10, letterSpacing: 0.5 },
  datoValor: { ...Typography.styles.body, color: Colors.text.primary, marginBottom: 5, fontWeight: '500' },
  
  mapaContenedor: { width: '100%', backgroundColor: '#fff', padding: Spacing[5], borderRadius: Radius.lg, ...Shadow.md, marginBottom: Spacing[5], borderWidth: 1, borderColor: Colors.border.default },
  mapaPequeno: { height: 150, width: '100%', borderRadius: Radius.md, overflow: 'hidden', marginTop: 15 },
  mapaPlaceholder: { width: '100%', height: 100, backgroundColor: Colors.neutral[100], borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing[5], borderWidth: 2, borderColor: Colors.border.default, borderStyle: 'dashed' },
  textoMapa: { color: Colors.text.secondary, fontWeight: 'bold', fontSize: 14 },
  etiquetaAbrirMapa: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  textoAbrirMapa: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  
  portafolioContenedor: { width: '100%', marginBottom: Spacing[5] },
  tituloSeccion: { ...Typography.styles.h4, color: Colors.primary[700], marginBottom: Spacing[3], alignSelf: 'flex-start', fontWeight: '700' },
  carrusel: { flexDirection: 'row' },
  fotoTrabajo: { width: 120, height: 120, borderRadius: Radius.md, marginRight: Spacing[4], backgroundColor: Colors.neutral[200], borderWidth: 1, borderColor: Colors.border.default },
  contenedorBotones: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: Spacing[3], marginBottom: Spacing[6] },
  botonPrimario: { flex: 1, backgroundColor: Colors.primary[600], paddingVertical: Spacing[4], borderRadius: Radius.md, alignItems: 'center', ...Shadow.brand },
  botonSecundario: { flex: 1, backgroundColor: Colors.neutral[100], paddingVertical: Spacing[4], borderRadius: Radius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border.default },
  textoBoton: { ...Typography.styles.btn, color: '#fff', fontWeight: '700' },
  textoBotonSecundario: { ...Typography.styles.btn, color: Colors.text.primary, fontWeight: '700' },
  modalFondoOscuro: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.95)', justifyContent: 'center', alignItems: 'center' },
  botonCerrarModal: { position: 'absolute', top: 50, right: 20, padding: 10, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: Radius.button, zIndex: 10 },
  textoCerrarModal: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  fotoGigante: { width: '90%', height: '80%' }
});