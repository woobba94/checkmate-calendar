import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

type Locale = 'ko' | 'en';

interface Translations {
  [key: string]: string;
}

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const loadTranslations = async (locale: Locale): Promise<Translations> => {
  try {
    const translations = await import(`../locales/${locale}.json`);
    return translations.default;
  } catch (error) {
    console.error(`Failed to load translations for ${locale}:`, error);
    return {};
  }
};

const getInitialLocale = (): Locale => {
  const savedLocale = localStorage.getItem('checkmate-locale') as Locale;
  if (savedLocale && ['ko', 'en'].includes(savedLocale)) {
    return savedLocale;
  }

  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith('ko') ? 'ko' : 'en';
};

interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);
  const [translations, setTranslations] = useState<Translations>({});

  useEffect(() => {
    const loadLocaleData = async () => {
      const newTranslations = await loadTranslations(locale);
      setTranslations(newTranslations);
    };

    loadLocaleData();
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('checkmate-locale', newLocale);
  };

  const t = (key: string): string => {
    return translations[key] || key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
