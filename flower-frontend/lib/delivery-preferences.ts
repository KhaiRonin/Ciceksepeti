export type DeliveryRegion = 'GIRNE' | 'LEFKOSA' | 'GAZIMAGUSA';

export const DELIVERY_REGION_OPTIONS: Array<{ value: DeliveryRegion; label: string }> = [
  { value: 'GIRNE', label: 'Girne' },
  { value: 'LEFKOSA', label: 'Lefkosa' },
  { value: 'GAZIMAGUSA', label: 'Magusa' },
];

const STORAGE_KEYS = {
  region: 'checkout_delivery_region',
  date: 'checkout_delivery_date',
  time: 'checkout_delivery_time',
} as const;

function canUseStorage(): boolean {
  return typeof window !== 'undefined';
}

export function readDeliveryRegionPreference(): DeliveryRegion | '' {
  if (!canUseStorage()) return '';

  const raw = window.localStorage.getItem(STORAGE_KEYS.region);
  if (!raw) return '';

  if (raw === 'GIRNE' || raw === 'LEFKOSA' || raw === 'GAZIMAGUSA') {
    return raw;
  }

  return '';
}

export function writeDeliveryRegionPreference(region: DeliveryRegion): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEYS.region, region);
}

export function readDeliveryDatePreference(): string {
  if (!canUseStorage()) return '';
  return window.localStorage.getItem(STORAGE_KEYS.date) ?? '';
}

export function writeDeliveryDatePreference(date: string): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEYS.date, date);
}

export function readDeliveryTimePreference(): string {
  if (!canUseStorage()) return '';
  return window.localStorage.getItem(STORAGE_KEYS.time) ?? '';
}

export function writeDeliveryTimePreference(time: string): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEYS.time, time);
}
