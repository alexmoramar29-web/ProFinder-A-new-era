import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, Platform, Linking } from 'react-native';

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
  style.innerHTML = `
    @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
    .leaflet-container { touch-action: none !important; }
  `;
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
  subtitle?: string;
  rating?: number;
  reviewCount?: number;
  color?: 'morado' | 'plateado';
}

interface MapaWebProps {
  coordenadas: { latitude: number; longitude: number };
  marcadores?: Marcador[];
  onLocationSelect?: (lat: number, lon: number) => void;
  onMarkerPress?: (id: string) => void;
  height?: number | string;
  readOnly?: boolean;
  requireConfirmToNavigate?: boolean;
}

// Componente dedicado SOLO a mover la cámara del mapa cuando las coordenadas cambian desde afuera
const ChangeView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  const prevRef = useRef(center);

  // Solo movemos la cámara cuando las coordenadas REALMENTE cambiaron (no en cada re-render)
  if (center[0] !== prevRef.current[0] || center[1] !== prevRef.current[1]) {
    prevRef.current = center;
    map.setView(center, 12); // Zoom 12 = nivel ciudad
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

export default function MapaWeb({ coordenadas, marcadores = [], onLocationSelect, onMarkerPress, height = 350, readOnly = false, requireConfirmToNavigate = false }: MapaWebProps) {
  const [mounted, setMounted] = useState(false);
  const webviewRef = useRef<any>(null);
  const webContainerRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && webContainerRef.current) {
      const stop = (e: any) => e.stopPropagation();
      const node = webContainerRef.current;
      node.addEventListener('touchstart', stop, { passive: false });
      node.addEventListener('touchmove', stop, { passive: false });
      node.addEventListener('wheel', stop, { passive: false });
      return () => {
        node.removeEventListener('touchstart', stop);
        node.removeEventListener('touchmove', stop);
        node.removeEventListener('wheel', stop);
      };
    }
  }, [mounted]);

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
          html, body { height: 100%; width: 100%; }
          #map { width: 100%; height: 100%; touch-action: none !important; }
          .leaflet-container { touch-action: none !important; }
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
          }).setView([${coordenadas.latitude}, ${coordenadas.longitude}], 12);
          
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
              if (${requireConfirmToNavigate}) {
                var popupHtml = '<div style="text-align: center; padding: 4px;">';
                if (m.title) popupHtml += '<div style="font-weight: bold; font-size: 14px; color: #111827; margin-bottom: 2px;">' + m.title + '</div>';
                if (m.subtitle) popupHtml += '<div style="font-size: 12px; color: #6B7280; margin-bottom: 4px;">' + m.subtitle + '</div>';
                if (typeof m.rating === 'number') {
                  var ratingTxt = m.rating > 0 ? '★ ' + m.rating + ' (' + m.reviewCount + ' reseñas)' : 'Nuevo (Sin reseñas)';
                  popupHtml += '<div style="font-size: 12px; color: #f59e0b; margin-bottom: 8px;">' + ratingTxt + '</div>';
                }
                if (m.id !== 'mi-ubicacion') {
                  popupHtml += '<div style="display: flex; gap: 8px;">';
                  popupHtml += '<button onclick="window.ReactNativeWebView.postMessage(JSON.stringify({ type: \\'open_maps\\', lat: ' + m.latitude + ', lon: ' + m.longitude + ' }))" style="background-color: #f3f4f6; color: #374151; border: 1px solid #d1d5db; padding: 6px 12px; border-radius: 999px; font-size: 12px; cursor: pointer; flex: 1;">Maps</button>';
                  popupHtml += '<button onclick="window.ReactNativeWebView.postMessage(JSON.stringify({ type: \\'marker_click\\', id: \\'' + m.id + '\\' }))" style="background-color: #5c4b8a; color: white; border: none; padding: 6px 12px; border-radius: 999px; font-size: 12px; cursor: pointer; flex: 1;">Perfil</button>';
                  popupHtml += '</div>';
                }
                popupHtml += '</div>';
                mkr.bindPopup(popupHtml);
              } else {
                if (m.title) mkr.bindTooltip(m.title, { direction: 'top', offset: [0, -30] });
                mkr.on('click', function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'marker_click', id: m.id }));
                });
              }
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
        } else if (data.type === 'open_maps') {
          Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${data.lat},${data.lon}`);
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
      <div ref={webContainerRef} style={{ height: '100%', width: '100%' }}>
        <MapContainer
        center={[coordenadas.latitude, coordenadas.longitude]}
        zoom={12}
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
          marcadores.map(m => 
            requireConfirmToNavigate ? (
              <Marker 
                key={m.id} 
                position={[m.latitude, m.longitude]} 
                icon={m.color === 'plateado' ? iconoPlateado : iconoMorado}
              >
                <Popup>
                  <div style={{ textAlign: 'center', padding: '4px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#111827', marginBottom: '2px' }}>{m.title}</div>
                    {m.subtitle && <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>{m.subtitle}</div>}
                    {typeof m.rating === 'number' && (
                      <div style={{ fontSize: '12px', color: '#f59e0b', marginBottom: '8px' }}>
                        {m.rating > 0 ? `★ ${m.rating} (${m.reviewCount} reseñas)` : 'Nuevo (Sin reseñas)'}
                      </div>
                    )}
                    {m.id !== 'mi-ubicacion' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/search/?api=1&query=${m.latitude},${m.longitude}`, '_blank'); }}
                          style={{ backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', cursor: 'pointer', flex: 1 }}
                        >
                          Maps
                        </button>
                        <button 
                          onClick={() => onMarkerPress && onMarkerPress(m.id)}
                          style={{ backgroundColor: '#5c4b8a', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', cursor: 'pointer', flex: 1 }}
                        >
                          Perfil
                        </button>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ) : (
              <Marker 
                key={m.id} 
                position={[m.latitude, m.longitude]} 
                icon={m.color === 'plateado' ? iconoPlateado : iconoMorado}
                eventHandlers={{
                  click: () => onMarkerPress && onMarkerPress(m.id)
                }}
              >
                {m.title ? <Tooltip direction="top" offset={[0, -30]}>{m.title}</Tooltip> : null}
              </Marker>
            )
          )
        ) : (
          <Marker position={[coordenadas.latitude, coordenadas.longitude]} icon={iconoMorado} />
        )}
      </MapContainer>
      </div>
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
