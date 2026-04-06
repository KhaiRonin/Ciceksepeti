import { api } from '@/lib/api';
import { Address, CreateAddressPayload } from '@/types';

export const addressService = {
  async getAddresses(): Promise<Address[]> {
    const { data } = await api.get<Address[]>('/address');
    return data;
  },

  async createAddress(payload: CreateAddressPayload): Promise<Address> {
    const { data } = await api.post<Address>('/address', payload);
    return data;
  },

  async deleteAddress(id: string): Promise<void> {
    await api.delete(`/address/${id}`);
  },
};
