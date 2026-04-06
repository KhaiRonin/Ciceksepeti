import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

function resolveApiBaseUrl(): string {
  if (typeof window === 'undefined') return BASE_URL;

  try {
    const configured = new URL(BASE_URL);
    const isLocalConfigured = ['localhost', '127.0.0.1', '::1'].includes(configured.hostname);
    const isLocalCurrent = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

    // When opening the app from another device (LAN/mobile), localhost must point to the host machine.
    if (isLocalConfigured && !isLocalCurrent) {
      return `${window.location.protocol}//${window.location.hostname}:3000/api`;
    }
  } catch {
    return BASE_URL;
  }

  return BASE_URL;
}

export const API_BASE_URL = BASE_URL;

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: attach access token ────────────────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.baseURL = resolveApiBaseUrl();
  const token = Cookies.get('access_token') ?? '';
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

// ── Response: silent refresh on 401 ─────────────────────────────────────────
let isRefreshing = false;
let waitQueue: Array<(token: string) => void> = [];

function flushQueue(token: string) {
  waitQueue.forEach((cb) => cb(token));
  waitQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          waitQueue.push((token: string) => {
            original.headers.set('Authorization', `Bearer ${token}`);
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;
      const refreshToken = Cookies.get('refresh_token');

      if (!refreshToken) {
        isRefreshing = false;
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${resolveApiBaseUrl()}/auth/refresh`, {
          refreshToken,
        });
        const { accessToken, refreshToken: newRefresh } = data;
        setTokens(accessToken, newRefresh);
        flushQueue(accessToken);
        original.headers.set('Authorization', `Bearer ${accessToken}`);
        return api(original);
      } catch {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export function setTokens(access: string, refresh: string) {
  Cookies.set('access_token', access, { expires: 1 / 96, sameSite: 'Strict' }); // 15 min
  Cookies.set('refresh_token', refresh, { expires: 7, sameSite: 'Strict' });
}

export function clearTokens() {
  Cookies.remove('access_token');
  Cookies.remove('refresh_token');
}
