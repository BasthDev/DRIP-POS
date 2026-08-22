import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import id from './locales/id.json';
import { SupportedLocale, TranslationResources } from './types';

const resources: Record<SupportedLocale, { translation: TranslationResources }> = {
  en: { translation: en },
  id: { translation: id },
};

const getDeviceLocale = (): SupportedLocale => {
  const deviceLocale = getLocales()[0]?.languageCode?.split('-')[0] as string;
  
  const validLocale: SupportedLocale = (deviceLocale === 'id' || deviceLocale === 'en') 
    ? deviceLocale as SupportedLocale 
    : 'en';
  
  return validLocale;
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDeviceLocale(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
export type { SupportedLocale, TranslationResources };
