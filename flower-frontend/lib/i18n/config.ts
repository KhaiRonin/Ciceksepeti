export const SUPPORTED_LOCALES = [
  'tr',
  'en',
  'ru',
  'ar',
  'az',
  'tk',
  'hi',
  'ko',
  'ur',
  'el',
] as const;

export type LocaleCode = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: LocaleCode = 'tr';
export const LOCALE_COOKIE_NAME = 'site_locale';
export const LOCALE_STORAGE_KEY = 'site_locale';

export const RTL_LOCALES: LocaleCode[] = ['ar', 'ur'];

export const LOCALE_LABELS: Record<LocaleCode, { native: string; short: string }> = {
  tr: { native: 'Turkce', short: 'TR' },
  en: { native: 'English', short: 'EN' },
  ru: { native: 'Russkiy', short: 'RU' },
  ar: { native: 'Al Arabiya', short: 'AR' },
  az: { native: 'Azerbaycan Turkcesi', short: 'AZ' },
  tk: { native: 'Turkmence', short: 'TK' },
  hi: { native: 'Hindi', short: 'HI' },
  ko: { native: 'Hangugeo', short: 'KO' },
  ur: { native: 'Urdu', short: 'UR' },
  el: { native: 'Ellinika', short: 'EL' },
};

export const INTL_LOCALES: Record<LocaleCode, string> = {
  tr: 'tr-TR',
  en: 'en-US',
  ru: 'ru-RU',
  ar: 'ar-SA',
  az: 'az-Latn-AZ',
  tk: 'tk-TM',
  hi: 'hi-IN',
  ko: 'ko-KR',
  ur: 'ur-PK',
  el: 'el-GR',
};

export function normalizeLocale(value?: string | null): LocaleCode {
  if (!value) return DEFAULT_LOCALE;
  const normalized = value.toLowerCase().trim();
  return (SUPPORTED_LOCALES as readonly string[]).includes(normalized)
    ? (normalized as LocaleCode)
    : DEFAULT_LOCALE;
}

export function getDirection(locale: LocaleCode): 'ltr' | 'rtl' {
  return RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';
}

export function getIntlLocale(locale?: string | null): string {
  return INTL_LOCALES[normalizeLocale(locale)] ?? INTL_LOCALES[DEFAULT_LOCALE];
}
