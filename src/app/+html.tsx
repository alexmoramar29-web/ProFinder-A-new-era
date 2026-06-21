import { ScrollViewStyleReset } from 'expo-router/html';
import React from 'react';

// Este archivo SOLAMENTE se ejecuta cuando alguien abre tu app en la web (como en Render)
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        
        {/* CANDADO 1: La regla estricta para el navegador */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        
        <ScrollViewStyleReset />
        
        {/* CANDADO 2: La magia oscura (CSS). 
            touch-action: pan-x pan-y -> Solo permite deslizar arriba/abajo e izquierda/derecha.
            Bloquea por completo el gesto de pellizcar para hacer zoom. */}
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            touch-action: pan-x pan-y;
            overscroll-behavior: none;
          }
        ` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}