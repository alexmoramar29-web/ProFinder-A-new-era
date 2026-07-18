import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from '@/context/AuthProvider';
import { NotificationProvider } from '@/context/NotificationContext';
import { Slot } from 'expo-router';
import Head from 'expo-router/head';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import i18n from '../i18n';

export default function LayoutPrincipal() {
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem('user-language');
        if (savedLang) {
          i18n.changeLanguage(savedLang);
        }
      } catch (error) {
        console.error('Error loading language', error);
      }
    };
    loadLanguage();
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>

      <AuthProvider>
        <NotificationProvider>
          {/* Envolvemos la app en una caja que NO puede crecer más allá de la pantalla */}
          <View style={styles.cajaEstricta}>
            <Slot />
          </View>
        </NotificationProvider>
      </AuthProvider>
    </>
  );
}

// Creamos los estilos aquí abajo
const styles = StyleSheet.create({
  cajaEstricta: {
    flex: 1,
    width: '100%',
    overflow: 'hidden' // La tijera final en React Native
  }
});