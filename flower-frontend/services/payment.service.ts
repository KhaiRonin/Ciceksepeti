import { api } from '@/lib/api';
import { PaymentSession } from '@/types';

export const paymentService = {
  async createSession(orderId: string): Promise<PaymentSession> {
    const { data } = await api.post<PaymentSession>(`/payments/orders/${orderId}/session`);
    return {
      ...data,
      amount: Number(data.amount ?? 0),
    };
  },

  async createPaytrSession(orderId: string): Promise<PaymentSession> {
    return this.createSession(orderId);
  },
};
