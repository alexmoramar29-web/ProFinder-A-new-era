import { Platform } from 'react-native';
import * as Location from 'expo-location';

export interface Direccion {
  calle: string;
  numExt: string;
  colonia: string;
  cp: string;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  intentoUsado: string;
}

export const NominatimService = {
  ultimaPeticion: 0,

  async obtenerDireccion(lat: number, lon: number): Promise<Direccion | null> {
    const ahora = Date.now();
    if (Platform.OS === 'web' && ahora - this.ultimaPeticion < 2000) {
      console.log('[ProFinder] Esperando cooldown de Nominatim...');
      return null;
    }
    this.ultimaPeticion = ahora;

    try {
      if (Platform.OS === 'web') {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&email=alexmoramar29@gmail.com`;
        const response = await fetch(url);
        const data = await response.json();

        if (data && data.address) {
          const a = data.address;
          let calle = a.road || a.pedestrian || a.street || '';
          let numExt = a.house_number || '';
          let colonia = a.neighbourhood || a.suburb || a.quarter || a.city_district || a.hamlet || a.village || a.town || '';
          let cp = a.postcode || '';

          if (!colonia && data.display_name) {
            const partes = data.display_name.split(',').map((p: string) => p.trim());
            if (partes.length >= 3) colonia = partes[1] || '';
          }
          if (!cp && data.display_name) {
            const matchCP = data.display_name.match(/\b(\d{5})\b/);
            if (matchCP) cp = matchCP[1];
          }

          return { calle, numExt, colonia, cp };
        }
      } else {
        const ubicaciones = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        if (ubicaciones && ubicaciones.length > 0) {
          const u = ubicaciones[0];
          return {
            calle: u.street || '',
            numExt: u.streetNumber || '',
            colonia: u.district || u.city || u.subregion || '',
            cp: u.postalCode || ''
          };
        }
      }
    } catch (error) {
      console.log('Error al traducir las coordenadas:', error);
    }
    return null;
  },

  async buscarCoordenadas(calle: string, numExt: string, colonia: string, cp: string): Promise<GeocodeResult | null> {
    try {
      if (Platform.OS === 'web') {
        let calleClean = calle.trim();
        let numClean = numExt.trim();
        if (numClean && calleClean.includes(numClean)) numClean = '';

        // INTENTO 1
        const streetParam = numClean ? `${numClean} ${calleClean}` : calleClean;
        const res1 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&street=${encodeURIComponent(streetParam)}&postalcode=${encodeURIComponent(cp || '')}&country=Mexico&limit=1&addressdetails=1&email=alexmoramar29@gmail.com`);
        if (res1.status !== 429) {
          const data1 = await res1.json();
          if (data1 && data1.length > 0) return { latitude: parseFloat(data1[0].lat), longitude: parseFloat(data1[0].lon), intentoUsado: 'estructurada' };
        }

        // INTENTO 2
        const query2 = `${calleClean} ${numClean}, ${colonia}, ${cp || ''}, México`;
        const res2 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query2)}&limit=1&countrycodes=mx&email=alexmoramar29@gmail.com`);
        if (res2.status !== 429) {
          const data2 = await res2.json();
          if (data2 && data2.length > 0) return { latitude: parseFloat(data2[0].lat), longitude: parseFloat(data2[0].lon), intentoUsado: 'libre' };
        }

        // INTENTO 3
        const query3 = `${calleClean}, ${cp || ''}, México`;
        const res3 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query3)}&limit=1&countrycodes=mx&email=alexmoramar29@gmail.com`);
        if (res3.status !== 429) {
          const data3 = await res3.json();
          if (data3 && data3.length > 0) return { latitude: parseFloat(data3[0].lat), longitude: parseFloat(data3[0].lon), intentoUsado: 'calle_cp' };
        }

        // INTENTO 4
        const query4 = `${colonia}, ${cp || ''}, México`;
        const res4 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query4)}&limit=1&countrycodes=mx&email=alexmoramar29@gmail.com`);
        if (res4.status !== 429) {
          const data4 = await res4.json();
          if (data4 && data4.length > 0) return { latitude: parseFloat(data4[0].lat), longitude: parseFloat(data4[0].lon), intentoUsado: 'solo_colonia' };
        }

      } else {
        await Location.requestForegroundPermissionsAsync();
        const direccionCompleta = `${calle} ${numExt ? numExt : ''}, ${colonia}${cp ? `, ${cp}` : ''}, México`;
        const resultados = await Location.geocodeAsync(direccionCompleta);
        
        if (resultados && resultados.length > 0) {
          return { latitude: resultados[0].latitude, longitude: resultados[0].longitude, intentoUsado: 'nativa_exacta' };
        } else {
          const fallback = `${calle}, ${colonia}, México`;
          const res2 = await Location.geocodeAsync(fallback);
          if (res2 && res2.length > 0) {
            return { latitude: res2[0].latitude, longitude: res2[0].longitude, intentoUsado: 'nativa_aprox' };
          }
        }
      }
    } catch (error) {
      console.log('Error al buscar dirección:', error);
    }
    return null;
  }
};
