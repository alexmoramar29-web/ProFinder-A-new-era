import * as Linking from 'expo-linking';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AuthLayout() {
  const router = useRouter();

  useEffect(() => {
    // 1. La antena normal: Escucha si la señal llega en el momento exacto
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/(auth)/reset-password');
      }
    });

    // 2. El detector de respaldo: Lee el enlace por si la señal llegó antes de tiempo
    const revisarEnlaceManualmente = async () => {
      const enlaceDeEntrada = await Linking.getInitialURL();
      
      // Si el enlace existe y trae la palabra secreta "type=recovery", lo dejamos pasar
      if (enlaceDeEntrada && enlaceDeEntrada.includes('type=recovery')) {
        router.replace('/(auth)/reset-password');
      }
    };

    revisarEnlaceManualmente();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" options={{ title: 'Iniciar Sesion' }} />
      <Stack.Screen name="sign-up" options={{ title: 'Registro', headerShown: false }} />
      <Stack.Screen name="reset-password" options={{ title: 'Nueva Contrasena', headerShown: true }} />
    </Stack>
  );
}