import React, { useEffect, useState, useRef } from 'react';
import { Platform, StyleSheet, View, Text } from 'react-native';

// Si no estamos en web, usamos WebView
let WebView: any = null;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

let MapContainer: any, TileLayer: any, Marker: any, Popup: any, Tooltip: any, useMapEvents: any, useMap: any, L: any;
let iconoMorado: any = null;
let iconoPlateado: any = null;

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const RL = require('react-leaflet');
  MapContainer = RL.MapContainer;
  TileLayer = RL.TileLayer;
  Marker = RL.Marker;
  Popup = RL.Popup;
  Tooltip = RL.Tooltip;
  useMapEvents = RL.useMapEvents;
  useMap = RL.useMap;
  L = require('leaflet');
  
  const style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = `@import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');`;
  document.head.appendChild(style);

  iconoMorado = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
    iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
  });

  iconoPlateado = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
    iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
  });
}

export interface Marcador {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  color?: 'morado' | 'plateado';
}

interface MapaWebProps {
  coordenadas: { latitude: number; longitude: number };
  marcadores?: Marcador[];
  onLocationSelect?: (lat: number, lon: number) => void;
  onMarkerPress?: (id: string) => void;
  height?: number | string;
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

export default function MapaWeb({ coordenadas, marcadores = [], onLocationSelect, onMarkerPress, height = 350, readOnly = false }: MapaWebProps) {
  const [mounted, setMounted] = useState(false);
  const webviewRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ====== LOGICA PARA MOVILES (WEBVIEW) ======
  if (Platform.OS !== 'web') {
    if (!WebView) {
      return (
        <View style={[styles.mapa, { height: height as any, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e9ecef' }]}>
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
          
          var iconVioletUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png';
          var iconVioletRetina = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png';
          var iconGreyUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png';
          var iconGreyRetina = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png';
          var shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png';

          function getIcon(color) {
            var url = color === 'plateado' ? iconGreyUrl : iconVioletUrl;
            var retina = color === 'plateado' ? iconGreyRetina : iconVioletRetina;
            return new L.Icon({
              iconUrl: url, iconRetinaUrl: retina, shadowUrl: shadowUrl,
              iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
            });
          }

          var marcadores = ${JSON.stringify(marcadores)};
          if (marcadores && marcadores.length > 0) {
            marcadores.forEach(function(m) {
              var mkr = L.marker([m.latitude, m.longitude], { icon: getIcon(m.color) }).addTo(map);
              if (m.title) mkr.bindTooltip(m.title, { direction: 'top', offset: [0, -30] });
              mkr.on('click', function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'marker_click', id: m.id }));
              });
            });
          } else {
            var marker = L.marker([${coordenadas.latitude}, ${coordenadas.longitude}], { icon: getIcon('morado') }).addTo(map);

            ${!readOnly ? `
            map.on('click', function(e) {
              marker.setLatLng(e.latlng);
              map.flyTo(e.latlng, map.getZoom());
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'map_click', lat: e.latlng.lat, lon: e.latlng.lng }));
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
          }
          
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
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'marker_click' && onMarkerPress) {
          onMarkerPress(data.id);
        } else if (data.type === 'map_click' && onLocationSelect && !readOnly) {
          onLocationSelect(data.lat, data.lon);
        } else if (data.lat && data.lon && onLocationSelect && !readOnly) {
          onLocationSelect(data.lat, data.lon);
        }
      } catch (e) {
        console.log('Error parseando mensaje del WebView:', e);
      }
    };

    // Cuando cambian las coordenadas desde afuera (ej. buscar dirección), enviamos mensaje al WebView
    useEffect(() => {
      if (webviewRef.current) {
        webviewRef.current.postMessage(JSON.stringify({ lat: coordenadas.latitude, lon: coordenadas.longitude }));
      }
    }, [coordenadas.latitude, coordenadas.longitude]);

    return (
      <View style={[styles.mapa, { height: height as any }]}>
        <WebView 
          ref={webviewRef}
          originWhitelist={['*']}
          source={{ html: htmlContent }} 
          onMessage={handleMessage}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1, backgroundColor: 'transparent' }}
        />
      </View>
    );
  }

  // ====== LOGICA ORIGINAL PARA LA WEB ======
  if (!mounted || !MapContainer) {
    return (
      <View style={[styles.mapa, { height: height as any, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e9ecef' }]}>
         <Text>Cargando mapa interactivo...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.mapa, { height: height as any }]}>
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
        {marcadores && marcadores.length > 0 ? (
          marcadores.map(m => (
            <Marker 
              key={m.id} 
              position={[m.latitude, m.longitude]} 
              icon={m.color === 'plateado' ? iconoPlateado : iconoMorado}
              eventHandlers={{
                click: () => onMarkerPress && onMarkerPress(m.id)
              }}
            >
              {m.title && <Tooltip direction="top" offset={[0, -30]}>{m.title}</Tooltip>}
            </Marker>
          ))
        ) : (
          <Marker position={[coordenadas.latitude, coordenadas.longitude]} icon={iconoMorado} />
        )}
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
