/** Coerce JSON / form values for class-validator (strings, commas, float noise). */

export function toOptionalPrice(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n =
    typeof value === 'number'
      ? value
      : parseFloat(String(value).trim().replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(n)) return undefined;
  return Math.round(n * 100) / 100;
}

export function toRequiredPrice(value: unknown): number {
  const n =
    typeof value === 'number'
      ? value
      : parseFloat(String(value).trim().replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(n)) return Number.NaN;
  return Math.round(n * 100) / 100;
}

export function toOptionalInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = typeof value === 'number' ? value : parseInt(String(value).trim(), 10);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

export function toRequiredInt(value: unknown): number {
  const n = typeof value === 'number' ? value : parseInt(String(value).trim(), 10);
  if (!Number.isFinite(n)) return Number.NaN;
  return n;
}
