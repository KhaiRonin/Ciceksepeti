import { api } from '@/lib/api';
import {
  AdminProduct,
  AdminCategory,
  AdminOrder,
  AdminUser,
  AdminListResponse,
  CreateProductPayload,
  UpdateProductPayload,
  CreateCategoryPayload,
  UpdateOrderStatusPayload,
  DashboardData,
  ChartPeriod,
  OrderStatus,
  AdminCoupon,
  CreateCouponPayload,
  AdminReview,
  AdminBanner,
  CreateBannerPayload,
  AdminReturn,
  ReturnStatus,
  AdminReport,
  AdminZReport,
  AdminGiftNoteTemplate,
  CreateGiftNoteTemplatePayload,
  AdminLogEntry,
} from '@/types/admin';

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardService = {
  async getDashboard(period: ChartPeriod = 'weekly'): Promise<DashboardData> {
    const { data } = await api.get(`/admin/dashboard?period=${period}`);
    // Backend returns flat object with revenueChart included
    return {
      stats: {
        totalRevenue: data.totalRevenue ?? 0,
        totalOrders: data.totalOrders ?? 0,
        totalCustomers: data.totalCustomers ?? 0,
        totalProducts: data.totalProducts ?? 0,
        activeVisitors: data.activeVisitors ?? 0,
        pendingOrders: data.pendingOrders ?? 0,
        lowStockProducts: data.lowStockProducts ?? 0,
        soonEndingDiscounts: data.soonEndingDiscounts ?? 0,
      },
      revenueChart: data.revenueChart ?? [],
      recentOrders: [],
      topProducts: [],
      lowStockProducts: [],
    };
  },
};

// ─── Products ────────────────────────────────────────────────────────────────
export const adminProductService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    status?: string;
    discounted?: boolean;
  }): Promise<AdminListResponse<AdminProduct>> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.categoryId) query.set('categoryId', params.categoryId);
    if (typeof params?.discounted === 'boolean') query.set('discounted', String(params.discounted));
    const { data } = await api.get(`/admin/products?${query}`);
    // Normalise: backend may return array or paginated
    if (Array.isArray(data)) {
      return { data, meta: { total: data.length, page: 1, limit: data.length, totalPages: 1 } };
    }
    return data;
  },

  async getOne(id: string): Promise<AdminProduct> {
    const { data } = await api.get(`/products/${id}`);
    return data;
  },

  async create(payload: CreateProductPayload): Promise<AdminProduct> {
    const { data } = await api.post('/products', payload);
    return data;
  },

  async update(id: string, payload: UpdateProductPayload): Promise<AdminProduct> {
    const { data } = await api.put(`/products/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/products/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.url;
  },
};

// ─── Categories ──────────────────────────────────────────────────────────────
export const adminCategoryService = {
  async getAll(): Promise<AdminCategory[]> {
    const { data } = await api.get('/categories');
    return data;
  },

  async create(payload: CreateCategoryPayload): Promise<AdminCategory> {
    const { data } = await api.post('/categories', payload);
    return data;
  },

  async update(id: string, payload: Partial<CreateCategoryPayload>): Promise<AdminCategory> {
    const { data } = await api.patch(`/categories/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  },

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/categories/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.url;
  },
};

export const adminCatalogService = {
  async syncTranslations(): Promise<{
    success: boolean;
    totals: { categories: number; products: number };
    updated: { categories: number; products: number };
  }> {
    try {
      const { data } = await api.post('/admin/catalog/translations/sync');
      return data;
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        throw error;
      }

      const { data } = await api.post('/admin/data_translations/sync');
      return data;
    }
  },
};

// ─── Orders ──────────────────────────────────────────────────────────────────
export const adminOrderService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    status?: OrderStatus | '';
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<AdminListResponse<AdminOrder>> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    const { data } = await api.get(`/admin/orders?${query}`);
    if (Array.isArray(data)) {
      return { data, meta: { total: data.length, page: 1, limit: data.length, totalPages: 1 } };
    }
    return data;
  },

  async getOne(id: string): Promise<AdminOrder> {
    const { data } = await api.get(`/admin/orders/${id}`);
    return data;
  },

  async updateStatus(id: string, payload: UpdateOrderStatusPayload): Promise<AdminOrder> {
    const { data } = await api.patch(`/admin/orders/${id}/status`, payload);
    return data;
  },
};

// ─── Customers (Users) ───────────────────────────────────────────────────────
export const adminCustomerService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }): Promise<AdminListResponse<AdminUser>> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    const { data } = await api.get(`/admin/users?${query}`);
    if (Array.isArray(data)) {
      return { data, meta: { total: data.length, page: 1, limit: data.length, totalPages: 1 } };
    }
    return data;
  },

  async getOne(id: string): Promise<AdminUser> {
    const { data } = await api.get(`/admin/users/${id}`);
    return data;
  },

  async updateRole(id: string, role: 'user' | 'admin'): Promise<AdminUser> {
    const { data } = await api.patch(`/admin/users/${id}/role`, { role });
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/admin/users/${id}`);
  },
};

// ─── Kuponlar ────────────────────────────────────────────────────────────────
export const adminCouponService = {
  async getAll(): Promise<AdminCoupon[]> {
    const { data } = await api.get('/admin/coupons');
    return data;
  },

  async create(payload: CreateCouponPayload): Promise<AdminCoupon> {
    const { data } = await api.post('/admin/coupons', payload);
    return data;
  },

  async update(id: string, payload: Partial<CreateCouponPayload>): Promise<AdminCoupon> {
    const { data } = await api.put(`/admin/coupons/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/admin/coupons/${id}`);
  },
};

// ─── Yorumlar ────────────────────────────────────────────────────────────────
export const adminReviewService = {
  async getAll(approved?: boolean): Promise<AdminReview[]> {
    const query = approved !== undefined ? `?approved=${approved}` : '';
    const { data } = await api.get(`/admin/reviews${query}`);
    return data;
  },

  async approve(id: string, approved: boolean): Promise<AdminReview> {
    const { data } = await api.patch(`/admin/reviews/${id}/approve`, { approved });
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/admin/reviews/${id}`);
  },
};

// ─── Bannerlar ───────────────────────────────────────────────────────────────
export const adminBannerService = {
  async getAll(): Promise<AdminBanner[]> {
    const { data } = await api.get('/admin/banners');
    return data;
  },

  async create(payload: CreateBannerPayload): Promise<AdminBanner> {
    const { data } = await api.post('/admin/banners', payload);
    return data;
  },

  async update(id: string, payload: Partial<CreateBannerPayload>): Promise<AdminBanner> {
    const { data } = await api.put(`/admin/banners/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/admin/banners/${id}`);
  },
};

// ─── Not Şablonları ─────────────────────────────────────────────────────────
export const adminGiftNoteTemplateService = {
  async getAll(params?: { recipientType?: string; isActive?: boolean }): Promise<AdminGiftNoteTemplate[]> {
    const query = new URLSearchParams();
    if (params?.recipientType) query.set('recipientType', params.recipientType);
    if (typeof params?.isActive === 'boolean') query.set('isActive', String(params.isActive));
    const queryString = query.toString();
    const { data } = await api.get(`/admin/note-templates${queryString ? `?${queryString}` : ''}`);
    return data;
  },

  async create(payload: CreateGiftNoteTemplatePayload): Promise<AdminGiftNoteTemplate> {
    const { data } = await api.post('/admin/note-templates', payload);
    return data;
  },

  async update(id: string, payload: Partial<CreateGiftNoteTemplatePayload>): Promise<AdminGiftNoteTemplate> {
    const { data } = await api.put(`/admin/note-templates/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/admin/note-templates/${id}`);
  },

  async seedDefaults(): Promise<{ created: number; skipped: number; total: number }> {
    const { data } = await api.post('/admin/note-templates/seed');
    return data;
  },
};

// ─── Loglar ──────────────────────────────────────────────────────────────────
export const adminLogService = {
  async getAll(limit = 200): Promise<AdminLogEntry[]> {
    const { data } = await api.get(`/admin/logs?limit=${limit}`);
    return data;
  },
};

// ─── İadeler ─────────────────────────────────────────────────────────────────
export const adminReturnService = {
  async getAll(): Promise<AdminReturn[]> {
    const { data } = await api.get('/admin/returns');
    return data;
  },

  async updateStatus(id: string, status: ReturnStatus, adminNote?: string): Promise<AdminReturn> {
    const { data } = await api.patch(`/admin/returns/${id}/status`, { status, adminNote });
    return data;
  },
};

// ─── Raporlar ────────────────────────────────────────────────────────────────
export const adminReportService = {
  async get(period: 'weekly' | 'monthly' | 'yearly' = 'monthly'): Promise<AdminReport> {
    const { data } = await api.get(`/admin/reports?period=${period}`);
    return data;
  },

  async getZ(date?: string, period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<AdminZReport> {
    const query = new URLSearchParams();
    if (date) query.set('date', date);
    if (period) query.set('period', period);
    const queryString = query.toString();
    const { data } = await api.get(`/admin/reports/z${queryString ? `?${queryString}` : ''}`);
    return data;
  },
};
