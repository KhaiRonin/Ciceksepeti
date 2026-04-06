import { api } from '@/lib/api';
import { AuthUser, Order, Product } from '@/types';

export const adminService = {
  // Users
  async getUsers(): Promise<AuthUser[]> {
    const { data } = await api.get<AuthUser[]>('/admin/users');
    return data;
  },

  async updateUserRole(
    userId: string,
    role: 'user' | 'admin',
  ): Promise<AuthUser> {
    const { data } = await api.patch<AuthUser>(`/admin/users/${userId}/role`, {
      role,
    });
    return data;
  },

  async deleteUser(userId: string): Promise<void> {
    await api.delete(`/admin/users/${userId}`);
  },

  // Orders
  async getAllOrders(): Promise<Order[]> {
    const { data } = await api.get<Order[]>('/admin/orders');
    return data;
  },

  async updateOrderStatus(
    orderId: string,
    status: string,
  ): Promise<Order> {
    const { data } = await api.patch<Order>(
      `/admin/orders/${orderId}/status`,
      { status },
    );
    return data;
  },

  // Products
  async getAllProducts(): Promise<Product[]> {
    const { data } = await api.get<Product[]>('/admin/products');
    return data;
  },
};
