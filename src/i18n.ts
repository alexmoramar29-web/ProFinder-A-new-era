import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Importamos nuestros diccionarios
import ingles from './locales/en/translation.json';
import espanol from './locales/es/translation.json';

const recursos = {
  en: { translation: ingles },
  es: { translation: espanol }
};

i18n
  .use(initReactI18next)
  .init({
    resources: recursos,
    lng: Localization.getLocales()[0].languageCode ?? 'es', 
    fallbackLng: 'es', // Si el celular está en un idioma raro, usa español por defecto
    keySeparator: false,
    nsSeparator: false,
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;