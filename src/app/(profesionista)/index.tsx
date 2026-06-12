import { StyleSheet, Text, View } from 'react-native';

export default function DashboardProfesionista() {
  // armamos un contenedor basico para confirmar que el usuario llego a su panel
  // despues cambiaremos los textos por las tarjetas de metricas reales
  return (
    <View style={styles.container}>
      <Text style={styles.saludo}>Bienvenido a tu panel</Text>
      <Text style={styles.subtexto}>Aquí verás tus próximas citas y un resumen de tu trabajo.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  saludo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtexto: {
    fontSize: 16,
    color: '#666',
  }
});