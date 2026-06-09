import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" options={{ title: 'Iniciar Sesión' }} />
      <Stack.Screen name="sign-up" options={{ title: 'Registro', headerShown: true }} />
    </Stack>
  );
}