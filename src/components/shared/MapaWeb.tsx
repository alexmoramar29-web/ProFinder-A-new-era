import React, { useEffect, useState, useRef } from 'react';
import { Platform, StyleSheet, View, Text } from 'react-native';

// Si no estamos en web, usamos WebView
let WebView: any = null;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

let MapContainer: any, TileLayer: any, Marker: any, useMapEvents: any, useMap: any, L: any;
let iconoCorregido: any = null;

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const RL = require('react-leaflet');
  MapContainer = RL.MapContainer;
  TileLayer = RL.TileLayer;
  Marker = RL.Marker;
  useMapEvents = RL.useMapEvents;
  useMap = RL.useMap;
  L = require('leaflet');
  
  const style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = `@import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');`;
  document.head.appendChild(style);

  iconoCorregido = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
}

interface MapaWebProps {
  coordenadas: { latitude: number; longitude: number };
  onLocationSelect?: (lat: number, lon: number) => void;
  height?: number;
  readOnly?: boolean;
}

// Componente dedicado SOLO a mover la cámara del mapa cuando las coordenadas cambian desde afuera
const ChangeView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  const prevRef = useRef(center);

  // Solo movemos la cámara cuando las coordenadas REALMENTE cambiaron (no en cada re-render)
  if (center[0] !== prevRef.current[0] || center[1] !== prevRef.current[1]) {
    prevRef.current = center;
    map.setView(center, 19); // Zoom 19 = máximo nivel de calle, se ven casas individuales
  }

  return null;
};

// Componente dedicado SOLO a escuchar clicks del usuario en el mapa
const ClickHandler = ({ onSelect }: { onSelect: any }) => {
  useMapEvents({
    click(e: any) {
      if (onSelect) {
        onSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

export default function MapaWeb({ coordenadas, onLocationSelect, height = 350, readOnly = false }: MapaWebProps) {
  const [mounted, setMounted] = useState(false);
  const webviewRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ====== LOGICA PARA MOVILES (WEBVIEW) ======
  if (Platform.OS !== 'web') {
    if (!WebView) {
      return (
        <View style={[styles.mapa, { height, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e9ecef' }]}>
           <Text>Cargando mapas del sistema...</Text>
        </View>
      );
    }

    // HTML inyectado en el WebView para los celulares
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { padding: 0; margin: 0; }
          html, body, #map { height: 100%; width: 100%; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', {
            zoomControl: false,
            dragging: ${!readOnly},
            scrollWheelZoom: ${!readOnly},
            doubleClickZoom: ${!readOnly},
            touchZoom: ${!readOnly}
          }).setView([${coordenadas.latitude}, ${coordenadas.longitude}], 15);
          
          L.tileLayer('https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
            maxZoom: 19,
          }).addTo(map);
          
          var markerIcon = new L.Icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          });

          var marker = L.marker([${coordenadas.latitude}, ${coordenadas.longitude}], { icon: markerIcon }).addTo(map);

          ${!readOnly ? `
          map.on('click', function(e) {
            marker.setLatLng(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
            window.ReactNativeWebView.postMessage(JSON.stringify({ lat: e.latlng.lat, lon: e.latlng.lng }));
          });
          ` : ''}
          
          // Escuchar cambios de coordenadas desde React Native
          var handleRNMessage = function(event) {
            try {
              var data = JSON.parse(event.data);
              if(data.lat && data.lon) {
                var newLatLng = new L.LatLng(data.lat, data.lon);
                marker.setLatLng(newLatLng);
                map.flyTo(newLatLng, map.getZoom());
              }
            } catch(e){}
          };
          window.addEventListener("message", handleRNMessage);
          document.addEventListener("message", handleRNMessage);
        </script>
      </body>
      </html>
    `;

    // Cuando recibimos un mensaje del WebView (clic en el mapa)
    const handleMessage = (event: any) => {
      if (onLocationSelect && !readOnly) {
        try {
          const data = JSON.parse(event.nativeEvent.data);
          onLocationSelect(data.lat, data.lon);
        } catch (e) {
          console.log('Error parseando mensaje del WebView:', e);
        }
      }
    };

    // Cuando cambian las coordenadas desde afuera (ej. buscar dirección), enviamos mensaje al WebView
    useEffect(() => {
      if (webviewRef.current) {
        webviewRef.current.postMessage(JSON.stringify({ lat: coordenadas.latitude, lon: coordenadas.longitude }));
      }
    }, [coordenadas.latitude, coordenadas.longitude]);

    return (
      <View style={[styles.mapa, { height }]}>
        <WebView 
          ref={webviewRef}
          originWhitelist={['*']}
          source={{ html: htmlContent }} 
          onMessage={handleMessage}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    );
  }

  // ====== LOGICA ORIGINAL PARA LA WEB ======
  if (!mounted || !MapContainer) {
    return (
      <View style={[styles.mapa, { height, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e9ecef' }]}>
         <Text>Cargando mapa interactivo...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.mapa, { height }]}>
      <MapContainer
        center={[coordenadas.latitude, coordenadas.longitude]}
        zoom={15}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        dragging={!readOnly}
        scrollWheelZoom={!readOnly}
        doubleClickZoom={!readOnly}
        touchZoom={!readOnly}
        zoomControl={!readOnly}
      >
        <TileLayer
          attribution='&copy; CartoDB'
          url="https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
        />
        {/* Este componente mueve la cámara cuando las coordenadas cambian desde afuera */}
        <ChangeView center={[coordenadas.latitude, coordenadas.longitude]} />
        {/* Este componente escucha clicks del usuario */}
        {!readOnly && <ClickHandler onSelect={onLocationSelect} />}
        {/* El pin rojo */}
        <Marker position={[coordenadas.latitude, coordenadas.longitude]} icon={iconoCorregido} />
      </MapContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  mapa: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff'
  },
});
