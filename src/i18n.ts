import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Importamos nuestros diccionarios
import ingles from '../locales/en.json';
import espanol from '../locales/es.json';

const recursos = {
  en: { translation: ingles.traduccion },
  es: { translation: espanol.traduccion }
};

i18n
  .use(initReactI18next)
  .init({
    resources: recursos,
    lng: Localization.getLocales()[0].languageCode ?? 'es', 
    fallbackLng: 'es', // Si el celular está en un idioma raro, usa español por defecto
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;