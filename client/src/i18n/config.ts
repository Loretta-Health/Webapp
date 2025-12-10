import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonEn from './locales/en/common.json';
import commonDe from './locales/de/common.json';
import commonTr from './locales/tr/common.json';

import dashboardEn from './locales/en/dashboard.json';
import dashboardDe from './locales/de/dashboard.json';
import dashboardTr from './locales/tr/dashboard.json';

export const defaultNS = 'common';
export const resources = {
  en: {
    common: commonEn,
    dashboard: dashboardEn,
  },
  de: {
    common: commonDe,
    dashboard: dashboardDe,
  },
  tr: {
    common: commonTr,
    dashboard: dashboardTr,
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    defaultNS,
    resources: {
      en: {
        common: commonEn,
        dashboard: dashboardEn,
      },
      de: {
        common: commonDe,
        dashboard: dashboardDe,
      },
      tr: {
        common: commonTr,
        dashboard: dashboardTr,
      },
    },
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'loretta_language',
    },
    react: {
      useSuspense: true,
    },
  });

export default i18n;
