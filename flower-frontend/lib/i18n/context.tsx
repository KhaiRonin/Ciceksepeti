'use client';

import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getDirection,
  getIntlLocale,
  LOCALE_COOKIE_NAME,
  LOCALE_STORAGE_KEY,
  normalizeLocale,
  type LocaleCode,
} from './config';
import { messages, translate } from './messages';

type I18nContextValue = {
  locale: LocaleCode;
  dir: 'ltr' | 'rtl';
  intlLocale: string;
  setLocale: (locale: LocaleCode) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: LocaleCode;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [locale, setLocaleState] = useState<LocaleCode>(normalizeLocale(initialLocale));

  const setLocale = useCallback(
    (nextLocale: LocaleCode) => {
      const normalized = normalizeLocale(nextLocale);
      if (normalized === locale) return;

      setLocaleState(normalized);
      Cookies.set(LOCALE_COOKIE_NAME, normalized, { expires: 365, sameSite: 'Lax' });
      window.localStorage.setItem(LOCALE_STORAGE_KEY, normalized);
      queryClient.invalidateQueries();
      router.refresh();
    },
    [locale, queryClient, router],
  );

  useEffect(() => {
    const normalized = normalizeLocale(initialLocale);
    setLocaleState(normalized);
  }, [initialLocale]);

  useEffect(() => {
    Cookies.set(LOCALE_COOKIE_NAME, locale, { expires: 365, sameSite: 'Lax' });
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    }

    document.documentElement.lang = locale;
    document.documentElement.dir = getDirection(locale);
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dir: getDirection(locale),
      intlLocale: getIntlLocale(locale),
      setLocale,
      t: (path, params) => translate(locale, path, params),
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

export function getMessages(locale: LocaleCode) {
  return messages[normalizeLocale(locale)];
}
