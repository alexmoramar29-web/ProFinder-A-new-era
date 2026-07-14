import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { Colors } from '../theme/Colors';

export default function Index() {
  const router = useRouter();
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // Sin sesión → landing
          router.replace('/(auth)/landing');
          return;
        }

        const userId = session.user.id;

        // ¿Es cliente?
        const { data: cliente } = await supabase
          .from('users')
          .select('user_id')
          .eq('user_id', userId)
          .maybeSingle();

        if (cliente) {
          router.replace('/(cliente)');
          return;
        }

        // ¿Es profesionista?
        const { data: prof } = await supabase
          .from('professionals')
          .select('prof_id')
          .eq('prof_id', userId)
          .maybeSingle();

        if (prof) {
          router.replace('/(profesionista)');
          return;
        }

        // Sesión pero sin perfil → sign-in para que lo complete
        router.replace('/(auth)/sign-in');

      } catch (error) {
        router.replace('/(auth)/landing');
      } finally {
        setVerificando(false);
      }
    };

    verificarSesion();
  }, []);

  // Pantalla de carga mientras verifica
  if (verificando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary[50] }}>
        <ActivityIndicator size="large" color={Colors.primary[600]} />
      </View>
    );
  }

  return null;
}
