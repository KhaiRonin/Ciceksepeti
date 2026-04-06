/**
 * Single source of truth for where the Nest API lives.
 * Prevents broken setups: empty env, relative "/api", or mistakenly using the Next.js port (3001).
 */
export const DEFAULT_API_BASE = 'http://localhost:3000/api';

export function resolveApiBaseUrl(): string {
  const rawEnv = process.env.NEXT_PUBLIC_API_URL;
  const fallback = DEFAULT_API_BASE;

  if (rawEnv == null || rawEnv.trim() === '') {
    return fallback;
  }

  let raw = rawEnv.trim().replace(/\/+$/, '');
  if (raw === '' || raw.startsWith('/')) {
    return fallback;
  }

  if (!/^https?:\/\//i.test(raw)) {
    return fallback;
  }

  let base = raw.endsWith('/api') ? raw : `${raw}/api`;

  try {
    const u = new URL(base);
    const port = u.port || (u.protocol === 'https:' ? '443' : '80');
    // Next dev server is usually 3001 — API must not target it
    if (port === '3001') {
      u.port = '3000';
      base = `${u.origin}/api`;
    }
  } catch {
    return fallback;
  }

  return base;
}

export function resolveUploadsBackendOrigin(): string {
  return resolveApiBaseUrl().replace(/\/api\/?$/, '');
}
