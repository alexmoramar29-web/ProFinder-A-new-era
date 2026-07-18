import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';
import NavbarCliente from '../../../components/NavbarCliente';
import { Colors } from '../../../theme/Colors';
import { Typography } from '../../../theme/Typography';
import { Radius, Shadow, Spacing } from '../../../theme/Spacing';

export default function PerfilScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [datos, setDatos] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase.from('users').select('*').eq('user_id', user.id).single();
      
      if (data) {
        setDatos({ ...data, email: user.email });
        setAvatarUrl(data.profile_picture || user.user_metadata?.avatar_url || user.user_metadata?.picture);
      } else {
        // Fallback: Si no está en la tabla, usa los datos de autenticación de Google
        setDatos({
          full_name: user.user_metadata?.full_name || t('Nuevo Usuario', 'Nuevo Usuario'),
          username: user.email?.split('@')[0],
          phone: '',
          email: user.email
        });
        setAvatarUrl(user.user_metadata?.avatar_url || user.user_metadata?.picture);
      }
    }
    setCargando(false);
  };

  useFocusEffect(useCallback(() => { cargarDatos(); }, []));

  const fotoPerfil = avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

  if (cargando) {
    return (
      <View style={styles.cargandoContainer}>
        <ActivityIndicator size="large" color={Colors.primary[600]} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.neutral[50] }}>
      <NavbarCliente />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        <View style={styles.container}>
          
          <View style={styles.fotoContainer}>
            <TouchableOpacity onPress={() => setFotoAmpliada(fotoPerfil)} activeOpacity={0.8}>
              {fotoPerfil ? (
                <Image source={{ uri: fotoPerfil }} style={styles.foto} />
              ) : (
                <View style={styles.fotoVacia}>
                  <Text style={styles.textoFotoVacia}>{t('sinFoto', 'Sin foto')}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.nombreContainer}>
            <Text style={styles.nombreTexto}>{datos?.full_name || t('nombreNoDisponible', 'Nombre no disponible')}</Text>
          </View>

          <View style={styles.datosCard}>
            <Text style={styles.datoTitulo}>{t('nombreUsuarioDato', 'USUARIO')}</Text>
            <Text style={styles.datoValor}>@{datos?.username}</Text>

            <Text style={styles.datoTitulo}>{t('correoDato', 'CORREO ELECTRÓNICO')}</Text>
            <Text style={styles.datoValor}>{datos?.email || t('sinCorreo', 'Sin correo')}</Text>

            <Text style={styles.datoTitulo}>{t('telefonoDato', 'TELÉFONO')}</Text>
            <Text style={styles.datoValor}>{datos?.phone || t('sinTelefono', 'Sin teléfono registrado')}</Text>
          </View>

          <View style={styles.contenedorBotones}>
            <TouchableOpacity style={styles.botonSecundario} onPress={() => router.push('/(cliente)/perfil/editar')}>
              <Text style={styles.textoBotonSecundario}>{t('Editar Perfil')}</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      {/* MODAL ZOOM FOTO */}
      <Modal visible={fotoAmpliada !== null} transparent={true} animationType="fade">
        <View style={styles.modalFondoOscuro}>
          <TouchableOpacity style={styles.botonCerrarModal} onPress={() => setFotoAmpliada(null)}>
            <Text style={styles.textoCerrarModal}>{t('cerrarModal', 'Cerrar')}</Text>
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
  container: { flex: 1, padding: Spacing[5], alignItems: 'center' },
  
  fotoContainer: { marginBottom: Spacing[4], position: 'relative' },
  foto: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.neutral[200] },
  fotoVacia: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.neutral[200], justifyContent: 'center', alignItems: 'center' },
  textoFotoVacia: { color: Colors.text.secondary, fontWeight: 'bold' },
  
  nombreContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[5] },
  nombreTexto: { ...Typography.styles.h2, color: Colors.text.primary, textAlign: 'center', fontWeight: '800' },
  
  datosCard: { width: '100%', backgroundColor: '#fff', padding: Spacing[5], borderRadius: Radius.lg, ...Shadow.md, marginBottom: Spacing[6], borderWidth: 1, borderColor: Colors.border.default },
  datoTitulo: { ...Typography.styles.overline, color: Colors.text.disabled, marginTop: 10, letterSpacing: 0.5 },
  datoValor: { ...Typography.styles.body, color: Colors.text.primary, marginBottom: 5, fontWeight: '500' },
  
  contenedorBotones: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: Spacing[3], marginBottom: Spacing[6] },
  botonSecundario: { flex: 1, backgroundColor: Colors.neutral[100], paddingVertical: Spacing[4], borderRadius: Radius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border.default },
  textoBotonSecundario: { ...Typography.styles.btn, color: Colors.text.primary, fontWeight: '700' },
  
  modalFondoOscuro: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.95)', justifyContent: 'center', alignItems: 'center' },
  botonCerrarModal: { position: 'absolute', top: 50, right: 20, padding: 10, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: Radius.button, zIndex: 10 },
  textoCerrarModal: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  fotoGigante: { width: '90%', height: '80%' }
});