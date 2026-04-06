import { Prisma } from '@prisma/client';

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

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'tr';
export const RTL_LOCALES: AppLocale[] = ['ar', 'ur'];

export type ProductTranslationFields = {
  name?: string;
  description?: string;
};

export type CategoryTranslationFields = {
  name?: string;
};

export type TranslationMap<T> = Partial<Record<AppLocale, T>>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeLocale(value?: string | null): AppLocale {
  if (!value) return DEFAULT_LOCALE;
  const normalized = value.toLowerCase().trim();
  return (SUPPORTED_LOCALES as readonly string[]).includes(normalized)
    ? (normalized as AppLocale)
    : DEFAULT_LOCALE;
}

export function isRtlLocale(locale: AppLocale): boolean {
  return RTL_LOCALES.includes(locale);
}

export function sanitizeProductTranslations(input: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (!isRecord(input)) return undefined;

  const sanitized: TranslationMap<ProductTranslationFields> = {};

  for (const locale of SUPPORTED_LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;

    const value = input[locale];
    if (!isRecord(value)) continue;

    const name = typeof value.name === 'string' ? value.name.trim() : '';
    const description = typeof value.description === 'string' ? value.description.trim() : '';

    if (!name && !description) continue;

    sanitized[locale] = {
      ...(name ? { name } : {}),
      ...(description ? { description } : {}),
    };
  }

  return Object.keys(sanitized).length > 0 ? (sanitized as Prisma.InputJsonValue) : Prisma.JsonNull;
}

export function sanitizeCategoryTranslations(input: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (!isRecord(input)) return undefined;

  const sanitized: TranslationMap<CategoryTranslationFields> = {};

  for (const locale of SUPPORTED_LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;

    const value = input[locale];
    if (!isRecord(value)) continue;

    const name = typeof value.name === 'string' ? value.name.trim() : '';
    if (!name) continue;

    sanitized[locale] = { name };
  }

  return Object.keys(sanitized).length > 0 ? (sanitized as Prisma.InputJsonValue) : Prisma.JsonNull;
}

function readTranslationMap<T>(value: unknown): TranslationMap<T> {
  return isRecord(value) ? (value as TranslationMap<T>) : {};
}

export function localizeCategory<T extends { name: string; translations?: unknown }>(
  category: T,
  locale: AppLocale,
): T {
  const translations = readTranslationMap<CategoryTranslationFields>(category.translations);
  const localizedName = translations[locale]?.name?.trim();

  return {
    ...category,
    name: localizedName || category.name,
  };
}

export function localizeProduct<
  T extends {
    name: string;
    description: string;
    translations?: unknown;
    category?: { name: string; translations?: unknown } | null;
  },
>(product: T, locale: AppLocale): T {
  const translations = readTranslationMap<ProductTranslationFields>(product.translations);
  const localizedName = translations[locale]?.name?.trim();
  const localizedDescription = translations[locale]?.description?.trim();

  return {
    ...product,
    name: localizedName || product.name,
    description: localizedDescription || product.description,
    ...(product.category
      ? {
          category: localizeCategory(product.category, locale),
        }
      : {}),
  };
}
