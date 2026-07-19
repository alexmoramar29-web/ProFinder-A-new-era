import React from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../../theme/Typography';
import { useTheme } from '../../../context/ThemeContext';

export default function TerminosScreen() {
  const { isDark, colors } = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.neutral[0]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Términos y Condiciones</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>1. Introducción</Text>
        <Text style={styles.paragraph}>
          Bienvenido a ProFinder. Al acceder y utilizar esta aplicación, aceptas cumplir con los siguientes términos y condiciones. Si no estás de acuerdo con alguna parte, por favor no utilices la plataforma.
        </Text>

        <Text style={styles.sectionTitle}>2. Uso del Servicio</Text>
        <Text style={styles.paragraph}>
          Nuestra aplicación conecta a clientes con profesionistas independientes. No somos empleadores directos de los profesionistas ni garantizamos resultados específicos, aunque nos esforzamos por mantener altos estándares de calidad y seguridad.
        </Text>

        <Text style={styles.sectionTitle}>3. Responsabilidades del Cliente</Text>
        <Text style={styles.paragraph}>
          - Proveer información verídica y actualizada.{'\n'}
          - Tratar con respeto a los profesionistas.{'\n'}
          - Cumplir con los pagos acordados según las tarifas estipuladas por cada profesionista.
        </Text>

        <Text style={styles.sectionTitle}>4. Cancelaciones y Reembolsos</Text>
        <Text style={styles.paragraph}>
          Las citas pueden ser canceladas tanto por el cliente como por el profesionista con anticipación. Las políticas de reembolso, en caso de aplicar un pago adelantado, están sujetas a los acuerdos individuales con el profesionista contratado.
        </Text>

        <Text style={styles.sectionTitle}>5. Privacidad y Datos</Text>
        <Text style={styles.paragraph}>
          Nos tomamos muy en serio la seguridad de tu información. Tus datos personales son procesados y almacenados de forma segura, y no los compartimos con terceros sin tu consentimiento, salvo por lo estrictamente necesario para brindar el servicio.
        </Text>

        <Text style={styles.sectionTitle}>6. Modificaciones</Text>
        <Text style={styles.paragraph}>
          Nos reservamos el derecho de modificar estos términos en cualquier momento. Se te notificará de los cambios importantes y tu uso continuo de la aplicación constituirá la aceptación de los mismos.
        </Text>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  header: {
    height: 70,
    backgroundColor: '#5c4b8a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.neutral[0],
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    ...Typography.styles.h5,
    color: colors.text.primary,
    marginTop: 20,
    marginBottom: 8,
  },
  paragraph: {
    ...Typography.styles.body,
    color: '#3A3A3C',
    lineHeight: 24,
  },
});
