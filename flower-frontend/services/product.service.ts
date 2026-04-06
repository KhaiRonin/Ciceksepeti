import { api } from '@/lib/api';
import { LOCALE_COOKIE_NAME, normalizeLocale } from '@/lib/i18n/config';
import { Product, ProductsResponse, CreateProductPayload } from '@/types';
import Cookies from 'js-cookie';

function getCurrentLocale(): string {
  return normalizeLocale(Cookies.get(LOCALE_COOKIE_NAME));
}

export const productService = {
  async getProducts(params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    search?: string;
    sort?: 'newest' | 'best-selling';
    discounted?: boolean;
    occasion?: string;
  }): Promise<ProductsResponse> {
    const { data } = await api.get<ProductsResponse | Product[]>('/products', {
      params: {
        ...params,
        locale: getCurrentLocale(),
      },
    });

    if (Array.isArray(data)) {
      return {
        data,
        total: data.length,
        page: params?.page ?? 1,
        limit: params?.limit ?? data.length,
      };
    }

    return {
      data: Array.isArray(data?.data) ? data.data : [],
      total: typeof data?.total === 'number' ? data.total : (Array.isArray(data?.data) ? data.data.length : 0),
      page: typeof data?.page === 'number' ? data.page : (params?.page ?? 1),
      limit: typeof data?.limit === 'number' ? data.limit : (params?.limit ?? 24),
    };
  },

  async getProduct(id: string): Promise<Product> {
    const { data } = await api.get<Product>(`/products/${id}`, {
      params: { locale: getCurrentLocale() },
    });
    return data;
  },

  async createProduct(payload: CreateProductPayload): Promise<Product> {
    const { data } = await api.post<Product>('/products', payload);
    return data;
  },

  async updateProduct(
    id: string,
    payload: Partial<CreateProductPayload>,
  ): Promise<Product> {
    const { data } = await api.patch<Product>(`/products/${id}`, payload);
    return data;
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },
};
