import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './fr.json';
import en from './en.json';
import es from './es.json';

const storedLanguage =
  typeof window !== 'undefined' && window.localStorage
    ? window.localStorage.getItem('culina_lang')
    : 'fr';

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
    es: { translation: es },
  },
  lng: storedLanguage || 'fr',
  fallbackLng: 'fr',
  supportedLngs: ['fr', 'en', 'es'],
  interpolation: { escapeValue: false },
});

export default i18n;
