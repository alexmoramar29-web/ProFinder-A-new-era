import { ScrollViewStyleReset } from 'expo-router/html';
import React from 'react';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        
        <ScrollViewStyleReset />
        
        <style dangerouslySetInnerHTML={{ __html: `
          /* 1. LAS TIJERAS MAGICAS: Esto corta el menú invisible para que no ensanche la pantalla */
          html, body {
            width: 100%;
            max-width: 100vw;
            overflow-x: hidden; /* Esconde todo lo que se salga por los lados */
            margin: 0;
            padding: 0;
          }

          /* 2. EL CANDADO DE MOVIMIENTO: Bloquea tirones raros y el zoom nativo */
          body {
            touch-action: pan-y; /* Solo permite deslizar el dedo de arriba hacia abajo */
            overscroll-behavior: none;
          }
        ` }} />

        {/* 3. TU INTERCEPTOR DE DEDOS: Se queda igual para bloquear pellizcos */ }
        <script dangerouslySetInnerHTML={{ __html: `
          document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
          document.addEventListener('touchmove', function(e) {
            if (e.touches.length > 1) { e.preventDefault(); }
          }, { passive: false });
        ` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}