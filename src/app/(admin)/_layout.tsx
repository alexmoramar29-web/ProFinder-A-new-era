import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';

const ADMIN_EMAIL = 'alexitojaja111@gmail.com';

export default function AdminLayout() {
  const [verificando, setVerificando] = useState(true);
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) {
        // Redirigir de inmediato si no es el administrador
        router.replace('/(cliente)');
        return;
      }
      setVerificando(false);
    };
    checkAdmin();
  }, []);

  if (verificando) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background.app || colors.neutral[50], justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary[700]} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
