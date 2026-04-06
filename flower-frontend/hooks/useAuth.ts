'use client';

import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { LoginPayload, RegisterPayload } from '@/types';
import { setTokens, clearTokens } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

export function useAuth() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user, isAuthenticated, setAuth, setUser, clearAuth } = useAuthStore();

  async function login(payload: LoginPayload) {
    const tokens = await authService.login(payload);
    setTokens(tokens.accessToken, tokens.refreshToken);
    const me = await authService.getMe();
    setAuth(me, tokens.accessToken, tokens.refreshToken);
    qc.clear();
    router.push('/');
    toast.success('Hoş geldiniz!');
  }

  async function register(payload: RegisterPayload) {
    const tokens = await authService.register(payload);
    setTokens(tokens.accessToken, tokens.refreshToken);
    const me = await authService.getMe();
    setAuth(me, tokens.accessToken, tokens.refreshToken);
    qc.clear();
    router.push('/');
    toast.success('Hesabınız oluşturuldu!');
  }

  async function logout() {
    const refresh = Cookies.get('refresh_token') ?? '';
    try {
      if (refresh) await authService.logout(refresh);
    } catch {
      // ignore
    }
    clearAuth();
    clearTokens();
    qc.clear();
    router.push('/login');
    toast.info('Çıkış yapıldı.');
  }

  async function refreshUser() {
    try {
      const me = await authService.getMe();
      setUser(me);
    } catch {
      clearAuth();
    }
  }

  return { user, isAuthenticated, login, register, logout, refreshUser };
}
