import { ScrollViewStyleReset } from 'expo-router/html';
import React from 'react';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        
        {/* Candado Nivel 1: La regla básica */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        
        <ScrollViewStyleReset />
        
        {/* Candado Nivel 2: CSS */}
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            touch-action: pan-x pan-y;
            overscroll-behavior: none;
          }
        ` }} />

        {/* LA BOMBA NUCLEAR: Candado Nivel 3 (JavaScript) */}
        <script dangerouslySetInnerHTML={{ __html: `
        1. Bloquea el gesto de "pellizcar" exclusivo de los iPhone (Safari)
          document.addEventListener('gesturestart', function (e) {
            e.preventDefault();
          });

          // 2. Bloquea el uso de 2 o más dedos al mismo tiempo en cualquier celular (Android/iOS)
          document.addEventListener('touchmove', function(e) {
            if (e.touches.length > 1) {
              e.preventDefault();
            }
          }, { passive: false });

          // 3. Bloquea el molesto "Doble Toque" rápido que también hace zoom
          let lastTouchEnd = 0;
          document.addEventListener('touchend', function (e) {
            let now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
              e.preventDefault();
            }
            lastTouchEnd = now;
          }, false);
        ` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}