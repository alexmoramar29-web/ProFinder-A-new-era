import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function ClienteLayout() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const verificarRol = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace('/(auth)/sign-in');
          return;
        }

        // Verificamos si existe en la tabla de clientes
        const { data: cliente } = await supabase
          .from('users')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!cliente) {
          // Si no es cliente, lo mandamos a su portal real
          router.replace('/(profesionista)');
        }
      } catch (error) {
        console.log(error);
      } finally {
        setCargando(false);
      }
    };

    verificarRol();
  }, []);

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}