import { api } from '@/lib/api';
import { LOCALE_COOKIE_NAME, normalizeLocale } from '@/lib/i18n/config';
import { Category } from '@/types';
import Cookies from 'js-cookie';

function getCurrentLocale(): string {
  return normalizeLocale(Cookies.get(LOCALE_COOKIE_NAME));
}

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    const { data } = await api.get<Category[]>('/categories', {
      params: { locale: getCurrentLocale() },
    });
    return data;
  },

  async createCategory(payload: {
    name: string;
    description?: string;
    imageUrl?: string;
  }): Promise<Category> {
    const { data } = await api.post<Category>('/categories', payload);
    return data;
  },
};
