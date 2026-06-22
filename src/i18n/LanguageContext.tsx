import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ckb from './translations/ckb';
import ku from './translations/ku';
import ar from './translations/ar';
import en from './translations/en';

type Language = 'ckb' | 'ku' | 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
  getTranslatedName: (name: string, category?: string) => string;
}

const translations = {
  ckb,
  ku,
  ar,
  en,
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'ckb',
  setLanguage: async () => {},
  t: (key) => key,
  getTranslatedName: (name, category) => name,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('ckb');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('app_language');
      if (savedLanguage && (savedLanguage === 'ckb' || savedLanguage === 'ku' || savedLanguage === 'ar' || savedLanguage === 'en')) {
        setLanguageState(savedLanguage as Language);
      }
    } catch (e) {
      console.error('Failed to load language', e);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      setLanguageState(lang);
      await AsyncStorage.setItem('app_language', lang);
    } catch (e) {
      console.error('Failed to save language', e);
    }
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        return key; // Return the key if translation is not found
      }
    }
    
    return value as string;
  };

  const getTranslatedName = (name: string, category?: string): string => {
    if (!name) return name;
    let translated;
    if (category) {
      translated = t(`${category}.${name}`);
      if (translated !== `${category}.${name}`) return translated;
    }
    
    // Fallback across all common categories if category is 'default' or not found
    translated = t(`locations.${name}`);
    if (translated !== `locations.${name}`) return translated;
    translated = t(`brands.${name}`);
    if (translated !== `brands.${name}`) return translated;
    translated = t(`models.${name}`);
    if (translated !== `models.${name}`) return translated;
    translated = t(`importCountries.${name}`);
    if (translated !== `importCountries.${name}`) return translated;
    
    return name;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getTranslatedName }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
