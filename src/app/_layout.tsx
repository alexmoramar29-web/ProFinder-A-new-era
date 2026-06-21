import { AuthProvider } from '@/context/AuthProvider';
import { Slot } from 'expo-router';
import Head from 'expo-router/head';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function LayoutPrincipal() {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>

      <AuthProvider>
        {/* Envolvemos la app en una caja que NO puede crecer más allá de la pantalla */}
        <View style={styles.cajaEstricta}>
          <Slot />
        </View>
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