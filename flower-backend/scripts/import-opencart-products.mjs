#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

const argv = process.argv.slice(2);

const getArg = (name, fallback = '') => {
  const prefix = `--${name}=`;
  const found = argv.find((x) => x.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
};

const hasFlag = (name) => argv.includes(`--${name}`);

const inputPath = getArg('in', './tmp/opencart-products-raw.json');
const dryRun = hasFlag('dry-run');
const defaultCategoryName = getArg('default-category', 'Eski Site Aktarimi');
const defaultStock = Math.max(1, Number(getArg('default-stock', '50')) || 50);

const prisma = new PrismaClient();

const normalizeText = (value) => String(value ?? '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const uniq = (arr) => [...new Set(arr)];

const inferCategoryName = (name) => {
  const n = normalizeText(name).toLowerCase();

  const rules = [
    { key: 'orkide', category: 'Orkideler' },
    { key: 'gül', category: 'Guller' },
    { key: 'gul', category: 'Guller' },
    { key: 'papatya', category: 'Papatyalar' },
    { key: 'lily', category: 'Lilyumlar' },
    { key: 'lilyum', category: 'Lilyumlar' },
    { key: 'çelenk', category: 'Celenkler' },
    { key: 'celenk', category: 'Celenkler' },
    { key: 'çikolata', category: 'Cikolatali Urunler' },
    { key: 'cikolata', category: 'Cikolatali Urunler' },
    { key: 'pasta', category: 'Pastalar' },
    { key: 'bonsai', category: 'Saksi Bitkileri' },
    { key: 'saksı', category: 'Saksi Bitkileri' },
    { key: 'saksi', category: 'Saksi Bitkileri' },
    { key: 'teraryum', category: 'Teraryumlar' },
    { key: 'buket', category: 'Buketler' },
    { key: 'vazo', category: 'Vazoda Cicekler' },
    { key: 'aranjman', category: 'Aranjmanlar' },
  ];

  const matched = rules.find((r) => n.includes(r.key));
  return matched ? matched.category : defaultCategoryName;
};

const pickImages = (product) => {
  const srcId = String(product.sourceProductId || '').trim();
  const all = uniq((product.images || [])
    .map((x) => String(x || '').trim())
    .filter(Boolean)
    .filter((x) => x.startsWith('http'))
    .filter((x) => x.includes('/image/')));

  const badParts = [
    'placeholder',
    '/logo/',
    '120x120',
    '150x150',
    '190x190',
    '70x70',
    '80x80',
    '32fill',
    '500x107',
    '250x250',
    '300x300',
  ];

  let filtered = all.filter((u) => !badParts.some((p) => u.includes(p)));

  if (srcId) {
    const idBased = filtered.filter((u) => u.includes(`/${srcId}/`));
    if (idBased.length) filtered = idBased;
  }

  const mainFirst = filtered.sort((a, b) => {
    const score = (u) => {
      if (u.includes('/main/')) return 0;
      if (u.includes('/additional/')) return 1;
      if (u.includes('550x550')) return 2;
      return 3;
    };
    return score(a) - score(b);
  });

  const result = mainFirst.slice(0, 5);
  if (result.length) return result;

  return all.slice(0, 1);
};

const parsePrice = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const main = async () => {
  const absolutePath = resolve(process.cwd(), inputPath);
  const raw = await readFile(absolutePath, 'utf8');
  const parsed = JSON.parse(raw);
  const sourceProducts = Array.isArray(parsed.products) ? parsed.products : [];

  const byName = new Map();
  for (const p of sourceProducts) {
    const name = normalizeText(p.name);
    if (!name) continue;
    if (!byName.has(name)) byName.set(name, p);
  }

  const products = [...byName.values()];

  console.log(`Toplam kaynak: ${sourceProducts.length}, benzersiz ad: ${products.length}`);
  console.log(`Mod: ${dryRun ? 'DRY-RUN' : 'WRITE'}`);

  const categoryCache = new Map();
  const ensureCategory = async (name) => {
    const key = normalizeText(name) || defaultCategoryName;
    if (categoryCache.has(key)) return categoryCache.get(key);

    let category = await prisma.category.findUnique({ where: { name: key } });
    if (!category && !dryRun) {
      category = await prisma.category.create({ data: { name: key } });
    }

    const id = category?.id || `dry-${key}`;
    categoryCache.set(key, id);
    return id;
  };

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of products) {
    try {
      const name = normalizeText(item.name);
      const description = normalizeText(item.description) || name;
      const price = parsePrice(item.price);
      if (!name || !price) {
        skipped += 1;
        continue;
      }

      const images = pickImages(item);
      const stock = String(item.stockStatus || '').toLowerCase().includes('yok') ? 0 : defaultStock;
      const categoryName = inferCategoryName(name);
      const categoryId = await ensureCategory(categoryName);

      if (dryRun) {
        continue;
      }

      const existing = await prisma.product.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } },
        select: { id: true },
      });

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            description,
            price,
            stock,
            images,
            categoryId,
          },
        });
        updated += 1;
      } else {
        await prisma.product.create({
          data: {
            name,
            description,
            price,
            stock,
            images,
            categoryId,
          },
        });
        created += 1;
      }
    } catch (error) {
      failed += 1;
      console.error('Urun aktarim hatasi:', normalizeText(item?.name), String(error?.message || error));
    }
  }

  console.log('--- Aktarim Ozeti ---');
  console.log(`Olusturulan: ${created}`);
  console.log(`Guncellenen: ${updated}`);
  console.log(`Atlanan: ${skipped}`);
  console.log(`Hatali: ${failed}`);
};

main()
  .catch((err) => {
    console.error('Import basarisiz:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
