import { api } from '@/lib/api';
import { Order, CreateOrderPayload } from '@/types';

export const orderService = {
  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const { data } = await api.post<Order>('/orders', payload);
    return data;
  },

  async getMyOrders(): Promise<Order[]> {
    const { data } = await api.get<Order[]>('/orders/my');
    return data;
  },

  async getOrder(id: string): Promise<Order> {
    const { data } = await api.get<Order>(`/orders/${id}`);
    return data;
  },
};
