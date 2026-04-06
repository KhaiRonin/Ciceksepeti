import { api } from '@/lib/api';
import { Cart } from '@/types';

export const cartService = {
  async getCart(): Promise<Cart> {
    const { data } = await api.get<Cart>('/cart');
    return data;
  },

  async addItem(productId: string, quantity: number): Promise<Cart> {
    const { data } = await api.post<Cart>('/cart/add', {
      productId,
      quantity,
    });
    return data;
  },

  async removeItem(productId: string): Promise<Cart> {
    const { data } = await api.post<Cart>('/cart/remove', { productId });
    return data;
  },

  async clearCart(): Promise<void> {
    const cart = await this.getCart();
    await Promise.all((cart.items ?? []).map((item) => this.removeItem(item.productId)));
  },
};
