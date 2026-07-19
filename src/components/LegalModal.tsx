import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../theme/Colors';
import { Radius, Shadow, Spacing } from '../theme/Spacing';
import { Typography } from '../theme/Typography';

interface LegalModalProps {
  visible: boolean;
  titulo: string;
  contenido: string;
  onClose: () => void;
}

export default function LegalModal({ visible, titulo, contenido, onClose }: LegalModalProps) {
  const { t } = useTranslation();
  if (!visible) return null;

  return (
    <View style={styles.modalFondo}>
      <View style={styles.modalCaja}>
        <View style={styles.modalCabecera}>
          <Text style={styles.modalTitulo}>{titulo}</Text>
          <TouchableOpacity onPress={onClose} style={styles.btnCerrarX}>
            <Ionicons name="close" size={24} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContenido} indicatorStyle="black">
          <Text style={styles.textoLegal}>{contenido}</Text>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.btnAceptar} onPress={onClose}>
            <Text style={styles.btnAceptarTxt}>{t('entendido', 'Entendido')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalFondo: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: Spacing[4]
  },
  modalCaja: {
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    overflow: 'hidden'
  },
  modalCabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing[5],
    paddingBottom: Spacing[3],
  },
  modalTitulo: {
    ...Typography.styles.h4,
    color: Colors.neutral[900],
    flex: 1
  },
  btnCerrarX: {
    padding: 4
  },
  scrollContenido: {
    paddingHorizontal: Spacing[5],
    marginBottom: Spacing[2]
  },
  textoLegal: {
    ...Typography.styles.body,
    color: Colors.neutral[700],
    lineHeight: 22,
    textAlign: 'justify'
  },
  modalFooter: {
    padding: Spacing[5],
    paddingTop: Spacing[3],
    alignItems: 'flex-end',
  },
  btnAceptar: {
    backgroundColor: Colors.primary[600],
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: Radius.button,
    ...Shadow.sm
  },
  btnAceptarTxt: {
    ...Typography.styles.btn,
    color: '#fff'
  }
});
