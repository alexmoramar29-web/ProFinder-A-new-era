import { Redirect } from 'expo-router';

export default function Index() {
  // Por ahora, redirigimos directamente a la pantalla de inicio de sesión
  return <Redirect href="/(auth)/sign-in" />;
}