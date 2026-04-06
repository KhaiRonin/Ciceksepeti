import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Address, Product } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = 'TRY', locale: string = 'tr-TR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string | null | undefined, locale: string = 'tr-TR'): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export function formatCalendarDate(dateStr: string | null | undefined, locale: string = 'tr-TR'): string {
  if (!dateStr) return '—';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return formatDate(dateStr, locale);

  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatDateTimeKKTC(dateStr: string | null | undefined, locale: string = 'tr-TR'): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'Asia/Nicosia',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatCompactNumber(value: number, locale: string = 'tr-TR'): string {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat(locale, {
    notation: Math.abs(value) >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value);
}

export function parseApiDecimal(value: unknown): number {
  if (value == null || value === '') return NaN;
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  if (typeof value === 'string') {
    const n = Number(value.replace(',', '.'));
    return Number.isFinite(n) ? n : NaN;
  }
  if (typeof value === 'object') {
    const rec = value as Record<string, unknown>;
    if (typeof rec.$numberDecimal === 'string') {
      return parseApiDecimal(rec.$numberDecimal);
    }
    if (typeof rec.value === 'string' || typeof rec.value === 'number') {
      return parseApiDecimal(rec.value);
    }
  }
  return NaN;
}

export function formatPriceFromApi(value: unknown, currency = 'TRY'): string {
  const n = parseApiDecimal(value);
  if (!Number.isFinite(n)) return '—';
  return formatPrice(n, currency);
}

export const FREE_SHIPPING_THRESHOLD = 250;
export const DEFAULT_SHIPPING_FEE = 29.9;

export function calculateShipping(subtotal: number): number {
  if (!Number.isFinite(subtotal) || subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE;
}

export function calculateOrderSubtotal(items: Array<{ quantity: number; price?: number; unitPrice?: number }>): number {
  return items.reduce((sum, item) => {
    const price = Number(item.price ?? item.unitPrice ?? 0);
    return sum + (Number.isFinite(price) ? price : 0) * Number(item.quantity || 0);
  }, 0);
}

export function calculateOrderShipping(
  items: Array<{ quantity: number; price?: number; unitPrice?: number }>,
  totalPrice: number,
): number {
  const subtotal = calculateOrderSubtotal(items);
  const shipping = Number(totalPrice) - subtotal;
  return shipping > 0 ? Number(shipping.toFixed(2)) : 0;
}

export function formatAddress(address?: Address | null): string {
  if (!address) return '—';

  const rec = address as unknown as Record<string, unknown>;

  const pickString = (key: string): string | undefined => {
    const value = rec[key];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  };

  const legacy = [
    pickString('addressLine'),
    pickString('city'),
    pickString('country'),
  ].filter(Boolean);

  if (legacy.length > 0) return legacy.join(', ');

  return [
    pickString('neighbourhood'),
    pickString('street'),
    pickString('buildingNo'),
    pickString('flat'),
    pickString('district'),
    pickString('city'),
    pickString('postalCode'),
  ]
    .filter(Boolean)
    .join(' ');
}

export function getDeliveryRegionLabel(region?: string | null): string {
  if (region === 'GIRNE') return 'Girne';
  if (region === 'LEFKOSA') return 'Lefkosa';
  if (region === 'GAZIMAGUSA') return 'Gazimagusa';
  return '—';
}

function getUploadsOrigin(): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';
  return base.replace(/\/api\/?$/, '');
}

function normalizeImagePath(raw: string): string {
  const trimmed = raw.trim();

  // Skip known placeholder URLs that should not render as real product images.
  if (trimmed.includes('example.com/')) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Bare filename coming from DB: 1774653770453-1dog6n6n.png
  if (/^\d{10,}-[a-z0-9]+\.(?:png|jpe?g|webp|gif)$/i.test(trimmed)) {
    return `/uploads/products/${trimmed}`;
  }

  // Legacy malformed path support: /172....png -> /uploads/products/172....png
  const legacyRootFile = /^\/(\d{10,}-[a-z0-9]+\.(?:png|jpe?g|webp|gif))$/i.exec(trimmed);
  if (legacyRootFile) {
    return `/uploads/products/${legacyRootFile[1]}`;
  }

  if (trimmed.startsWith('/uploads/')) {
    return trimmed;
  }

  if (trimmed.startsWith('uploads/')) {
    return `/${trimmed}`;
  }

  return trimmed;
}

export function getSafeImageUrl(image?: string | null | unknown): string | undefined {
  if (typeof image !== 'string' || !image.trim()) return undefined;

  const normalized = normalizeImagePath(image);
  if (!normalized) return undefined;

  if (normalized.startsWith('/uploads/')) {
    return normalized;
  }

  return normalized;
}

export function publicUploadSrc(safePath?: string | null): string | undefined {
  if (!safePath) return undefined;

  const proxify = (target: string) => `/api/image-proxy?url=${encodeURIComponent(target)}`;

  if (safePath.startsWith('/uploads/')) {
    return proxify(`${getUploadsOrigin()}${safePath}`);
  }

  if (/^https?:\/\//i.test(safePath)) {
    return proxify(safePath);
  }

  return safePath;
}

export function getProductImage(product?: Product | null): string | undefined {
  const candidate = (product as unknown as { images?: unknown; imageUrl?: string } | null | undefined);
  const firstArrayImage = Array.isArray(candidate?.images) ? candidate?.images[0] : undefined;
  const raw = (typeof firstArrayImage === 'string' ? firstArrayImage : undefined) || candidate?.imageUrl || '';

  if (!raw || typeof raw !== 'string') return undefined;

  return publicUploadSrc(getSafeImageUrl(raw));
}

export function shouldBypassImageOptimization(src?: string | null): boolean {
  if (!src) return false;
  if (src.startsWith('/api/image-proxy')) return true;
  if (src.startsWith('data:') || src.startsWith('blob:')) return true;

  try {
    const u = new URL(src);
    const host = u.hostname.toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  } catch {
    return src.startsWith('/uploads/');
  }
}
