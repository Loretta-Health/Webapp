import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonEn from './locales/en/common.json';
import commonDe from './locales/de/common.json';
import commonTr from './locales/tr/common.json';

import dashboardEn from './locales/en/dashboard.json';
import dashboardDe from './locales/de/dashboard.json';
import dashboardTr from './locales/tr/dashboard.json';

import authEn from './locales/en/auth.json';
import authDe from './locales/de/auth.json';
import authTr from './locales/tr/auth.json';

import pagesEn from './locales/en/pages.json';
import pagesDe from './locales/de/pages.json';
import pagesTr from './locales/tr/pages.json';

import profileEn from './locales/en/profile.json';
import profileDe from './locales/de/profile.json';
import profileTr from './locales/tr/profile.json';

export const defaultNS = 'common';
export const resources = {
  en: {
    common: commonEn,
    dashboard: dashboardEn,
    auth: authEn,
    pages: pagesEn,
    profile: profileEn,
  },
  de: {
    common: commonDe,
    dashboard: dashboardDe,
    auth: authDe,
    pages: pagesDe,
    profile: profileDe,
  },
  tr: {
    common: commonTr,
    dashboard: dashboardTr,
    auth: authTr,
    pages: pagesTr,
    profile: profileTr,
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    defaultNS,
    resources,
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
