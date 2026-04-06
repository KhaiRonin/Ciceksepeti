import { api } from '@/lib/api';
import {
  AuthTokens,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from '@/types';

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthTokens> {
    const { data } = await api.post<AuthTokens>('/auth/register', payload);
    return data;
  },

  async login(payload: LoginPayload): Promise<AuthTokens> {
    const { data } = await api.post<AuthTokens>('/auth/login', payload);
    return data;
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const { data } = await api.post<AuthTokens>('/auth/refresh', {
      refreshToken,
    });
    return data;
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post('/auth/logout', { refreshToken });
  },

  async getMe(): Promise<AuthUser> {
    const { data } = await api.get<AuthUser>('/user/me');
    return data;
  },

  async updateMe(payload: { name: string }): Promise<AuthUser> {
    const { data } = await api.put<AuthUser>('/user/me', payload);
    return data;
  },

  async changePassword(payload: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ success: boolean }> {
    const { data } = await api.post<{ success: boolean }>('/auth/change-password', payload);
    return data;
  },
};
