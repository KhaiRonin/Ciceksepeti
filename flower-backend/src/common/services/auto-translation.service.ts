import { Injectable } from '@nestjs/common';
import translate from 'google-translate-api-x';
import {
  AppLocale,
  CategoryTranslationFields,
  DEFAULT_LOCALE,
  ProductTranslationFields,
  SUPPORTED_LOCALES,
  TranslationMap,
} from '../utils/locale.util';
import { AppLoggerService } from './logger.service';

type NonDefaultLocale = Exclude<AppLocale, typeof DEFAULT_LOCALE>;

type TranslationResponseMap = Record<string, { text?: string } | null | undefined>;

const TARGET_LOCALES = SUPPORTED_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE) as NonDefaultLocale[];

@Injectable()
export class AutoTranslationService {
  constructor(private readonly logger: AppLoggerService) {}

  async buildProductTranslations(params: {
    name: string;
    description: string;
    existing?: unknown;
    overrides?: unknown;
  }): Promise<TranslationMap<ProductTranslationFields>> {
    const generated = await this.translateFields<ProductTranslationFields>({
      name: params.name,
      description: params.description,
    });
    return this.mergeTranslations<ProductTranslationFields>({
      existing: params.existing,
      overrides: params.overrides,
      generated,
    });
  }

  async buildCategoryTranslations(params: {
    name: string;
    existing?: unknown;
    overrides?: unknown;
  }): Promise<TranslationMap<CategoryTranslationFields>> {
    const generated = await this.translateFields<CategoryTranslationFields>({
      name: params.name,
    });
    return this.mergeTranslations<CategoryTranslationFields>({
      existing: params.existing,
      overrides: params.overrides,
      generated,
    });
  }

  private async translateFields<T extends Record<string, string>>(fields: T): Promise<TranslationMap<Partial<T>>> {
    const entries = Object.entries(fields)
      .map(([key, value]) => [key, value.trim()] as const)
      .filter(([, value]) => value.length > 0);

    if (entries.length === 0) {
      return {};
    }

    const payload = Object.fromEntries(entries);

    const translatedEntries = await Promise.all(
      TARGET_LOCALES.map(async (locale) => {
        try {
          const result = await translate(payload, {
            from: DEFAULT_LOCALE,
            to: locale,
            forceFrom: true,
            rejectOnPartialFail: false,
          });

          const translatedFields: Partial<T> = {};

          for (const [fieldKey] of entries) {
            const translatedValue = (result as TranslationResponseMap)[fieldKey]?.text?.trim();
            if (translatedValue) {
              translatedFields[fieldKey as keyof T] = translatedValue as T[keyof T];
            }
          }

          return [locale, translatedFields] as const;
        } catch (error) {
          this.logger.warn(
            `Automatic translation failed for locale "${locale}": ${error instanceof Error ? error.message : String(error)}`,
            AutoTranslationService.name,
          );
          return [locale, {} as Partial<T>] as const;
        }
      }),
    );

    return Object.fromEntries(translatedEntries) as TranslationMap<Partial<T>>;
  }

  private mergeTranslations<T extends Record<string, string | undefined>>(params: {
    existing?: unknown;
    overrides?: unknown;
    generated: TranslationMap<Partial<T>>;
  }): TranslationMap<T> {
    const existing = this.readTranslationMap<T>(params.existing);
    const overrides = this.readTranslationMap<T>(params.overrides);
    const merged: Record<string, T> = {};

    for (const locale of TARGET_LOCALES) {
      const localeValues = this.mergeLocaleValues<T>(
        existing[locale],
        params.generated[locale],
        overrides[locale],
      );

      const filteredEntries = Object.entries(localeValues).filter(([, value]) => typeof value === 'string' && value.trim().length > 0);
      if (filteredEntries.length > 0) {
        merged[locale] = Object.fromEntries(filteredEntries) as T;
      }
    }

    return merged;
  }

  private readTranslationMap<T>(value: unknown): TranslationMap<T> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    return value as TranslationMap<T>;
  }

  private mergeLocaleValues<T extends Record<string, string | undefined>>(
    ...parts: Array<Partial<T> | null | undefined>
  ): Partial<T> {
    const merged: Partial<T> = {};

    for (const part of parts) {
      if (!part || typeof part !== 'object') continue;
      Object.assign(merged, part);
    }

    return merged;
  }
}
