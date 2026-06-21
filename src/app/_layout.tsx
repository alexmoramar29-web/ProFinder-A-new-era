import { AuthProvider } from '@/context/AuthProvider'; // ¡Le regresamos sus llaves!
import { Slot } from 'expo-router';
import Head from 'expo-router/head';
import React from 'react';
// Aquí declaramos a nuestro único Director Principal del archivo
export default function LayoutPrincipal() {
  return (
    <>
      {/* EL CANDADO MAGICO: Bloquea el zoom en celulares cuando se ve en internet */}
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>

      {/* Envolvemos tu app con tu sistema de sesiones (Auth) */}
      <AuthProvider>
        
        {/* Slot se encarga de mostrar la pantalla correcta (auth, profesionista, etc.) automáticamente */}
        <Slot />
        
      </AuthProvider>
    </>
  );
}