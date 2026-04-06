import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Resolves `flower-backend/uploads` whether the process cwd is the package root or not.
 */
export function getUploadsRoot(): string {
  const fromCwd = join(process.cwd(), 'uploads');
  if (existsSync(fromCwd)) {
    return fromCwd;
  }
  // e.g. dist/common/utils → ../../../uploads
  return join(__dirname, '..', '..', '..', 'uploads');
}

export function getProductUploadsDir(): string {
  return join(getUploadsRoot(), 'products');
}

export function ensureProductUploadsDir(): string {
  const dir = getProductUploadsDir();
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function getCategoryUploadsDir(): string {
  return join(getUploadsRoot(), 'categories');
}

export function ensureCategoryUploadsDir(): string {
  const dir = getCategoryUploadsDir();
  mkdirSync(dir, { recursive: true });
  return dir;
}
