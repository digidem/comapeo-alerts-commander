
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import pt from './locales/pt.json';
import es from './locales/es.json';
import fr from './locales/fr.json';

const resources = {
  en: {
    translation: en
  },
  pt: {
    translation: pt
  },
  es: {
    translation: es
  },
  fr: {
    translation: fr
  }
};

// Get saved language from localStorage or default to 'en'
const savedLanguage = localStorage.getItem('coMapeoAlert_language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

// Save language changes to localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('coMapeoAlert_language', lng);
});

export default i18n;
