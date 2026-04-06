#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve, extname } from 'node:path';
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const argv = process.argv.slice(2);
const getArg = (name, fallback = '') => {
  const prefix = `--${name}=`;
  const found = argv.find((x) => x.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
};

const toInt = (v, d) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : d;
};

const limit = toInt(getArg('limit', '0'), 0);
const concurrency = Math.max(1, toInt(getArg('concurrency', '6'), 6));
const maxImagesPerProduct = Math.max(1, toInt(getArg('max-images', '3'), 3));
const requestTimeoutMs = Math.max(3000, toInt(getArg('timeout-ms', '15000'), 15000));

const uploadsDir = resolve(process.cwd(), 'uploads', 'products', 'imported');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const sanitizeSlug = (text) => String(text ?? '')
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 60) || 'urun';

const pickExt = (url, contentType) => {
  const ct = String(contentType ?? '').toLowerCase();
  if (ct.includes('image/jpeg')) return '.jpg';
  if (ct.includes('image/png')) return '.png';
  if (ct.includes('image/webp')) return '.webp';
  if (ct.includes('image/gif')) return '.gif';

  const e = extname(new URL(url).pathname || '').toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(e)) return e === '.jpeg' ? '.jpg' : e;
  return '.jpg';
};

const fetchImage = async (url) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ProductImageMigrator/1.0)',
        Accept: 'image/*,*/*;q=0.8',
      },
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('image')) {
      throw new Error(`Not an image content-type: ${contentType}`);
    }

    const arr = new Uint8Array(await res.arrayBuffer());
    return { bytes: arr, contentType };
  } finally {
    clearTimeout(timer);
  }
};

const processProduct = async (product) => {
  const remoteUrls = (product.images || [])
    .map((x) => String(x || '').trim())
    .filter(Boolean)
    .filter((x) => x.startsWith('http://') || x.startsWith('https://'))
    .slice(0, maxImagesPerProduct);

  if (!remoteUrls.length) {
    return { status: 'skip', reason: 'no-remote-image', id: product.id };
  }

  const localExisting = (product.images || [])
    .map((x) => String(x || '').trim())
    .filter((x) => x.startsWith('/uploads/'));

  const saved = [];
  for (let i = 0; i < remoteUrls.length; i += 1) {
    const url = remoteUrls[i];
    try {
      const { bytes, contentType } = await fetchImage(url);
      const hash = crypto.createHash('sha1').update(bytes).digest('hex').slice(0, 10);
      const ext = pickExt(url, contentType);
      const base = `${sanitizeSlug(product.name)}-${product.id.slice(0, 8)}-${i + 1}-${hash}${ext}`;
      const absFile = join(uploadsDir, base);
      await writeFile(absFile, bytes);
      saved.push(`/uploads/products/imported/${base}`);
    } catch (err) {
      // continue with next image
    }
  }

  const nextImages = [...saved, ...localExisting].slice(0, maxImagesPerProduct);
  if (!nextImages.length) {
    return { status: 'fail', reason: 'all-image-downloads-failed', id: product.id };
  }

  await prisma.product.update({
    where: { id: product.id },
    data: { images: nextImages },
  });

  return { status: 'ok', id: product.id, count: nextImages.length };
};

const runPool = async (items, size, worker) => {
  let cursor = 0;
  const results = new Array(items.length);

  const runners = Array.from({ length: size }, async () => {
    while (cursor < items.length) {
      const idx = cursor;
      cursor += 1;
      results[idx] = await worker(items[idx], idx);
    }
  });

  await Promise.all(runners);
  return results;
};

const main = async () => {
  await mkdir(uploadsDir, { recursive: true });

  const products = await prisma.product.findMany({
    where: {
      images: {
        isEmpty: false,
      },
    },
    select: { id: true, name: true, images: true },
    orderBy: { createdAt: 'desc' },
  });

  const target = products.filter((p) => (p.images || []).some((x) => String(x).startsWith('http')));
  const selected = limit > 0 ? target.slice(0, limit) : target;

  console.log(`Toplam remote img urun: ${target.length}, islenecek: ${selected.length}`);

  let ok = 0;
  let skip = 0;
  let fail = 0;

  const results = await runPool(selected, concurrency, async (product, i) => {
    const res = await processProduct(product);
    if (res.status === 'ok') ok += 1;
    else if (res.status === 'skip') skip += 1;
    else fail += 1;

    if ((i + 1) % 25 === 0) {
      console.log(`  - ${i + 1}/${selected.length} tamamlandi (ok=${ok}, fail=${fail}, skip=${skip})`);
    }

    await sleep(50);
    return res;
  });

  console.log('--- Gorsel Aktarim Ozeti ---');
  console.log(`Basarili: ${ok}`);
  console.log(`Atlandi: ${skip}`);
  console.log(`Basarisiz: ${fail}`);

  const failedItems = results.filter((r) => r?.status === 'fail');
  if (failedItems.length) {
    console.log('Ilk 10 basarisiz urun id:');
    console.log(failedItems.slice(0, 10).map((x) => x.id));
  }
};

main()
  .catch((err) => {
    console.error('Gorsel aktarim hatasi:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
