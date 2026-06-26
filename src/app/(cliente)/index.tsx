import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function ClienteDashboard() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/sign-in');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('bienvenidoCliente')}</Text>
      <Text style={styles.subtitle}>{t('espacioCliente')}</Text>
      <Button title={t('cerrarSesion')} onPress={handleLogout} color="red" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30, textAlign: 'center' }
});