#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const argv = process.argv.slice(2);

const getArg = (name, fallback = '') => {
  const prefix = `--${name}=`;
  const item = argv.find((x) => x.startsWith(prefix));
  return item ? item.slice(prefix.length) : fallback;
};

const inputPath = getArg('in', './tmp/opencart-products-raw.json');
const outputPath = getArg('out', './tmp/opencart-products-clean.json');
const rejectedPath = getArg('rejected', './tmp/opencart-products-rejected.json');

const normalize = (v) => String(v ?? '').trim();

const CATEGORY_SLUG_BLOCKLIST = [
  'cok-satanlar',
  'meyveler',
  'yilbasi-cicek-ve-hediyeleri',
  'cicekler',
  'guller',
  'pastalar',
  'celenkler',
  'saksi-bitkileri',
  'orkideler',
  'hediye-setleri',
  'blog-yazilari',
];

const isLikelyNonProduct = (p) => {
  const url = normalize(p.sourceUrl).toLowerCase();
  const name = normalize(p.name).toLowerCase();
  const stockStatus = normalize(p.stockStatus);
  const sourceProductId = normalize(p.sourceProductId);
  const hasPrice = Number(p.price) > 0;
  const hasStockSignal = /stokta|tukendi|tükendi|stok yok/i.test(stockStatus);
  const hasProductRouteSignal = /route=product\/product|product_id=/i.test(url);
  const hasStrongProductSignal = Boolean(sourceProductId) || hasProductRouteSignal;
  const images = Array.isArray(p.images) ? p.images.map((x) => normalize(x).toLowerCase()) : [];

  const hasBlogUrlMarker = [
    '/blog',
    'journal3/blog',
    'hakkimizda',
    'mesafeli-satis-sozlesmesi',
    'cerez-politasi',
    'siparis-ve-teslimat',
    'cicek-bakimi',
    'ciceklerin-anlam',
    'cicek-esliginde-notlar',
    'cicekler-ve-burclar',
    'mevsimlere-gore-cicekler',
    'sikca-sorulan-sorular',
  ].some((m) => url.includes(m));

  const hasBlogImageMarker = images.some((img) => img.includes('/blog%20resimleri/') || img.includes('/blog%2520resimleri/'));
  const hasCategorySlug = CATEGORY_SLUG_BLOCKLIST.some((slug) => url.includes(`/${slug}`));

  const looksLikeArticleTitle =
    name.includes('nasil') ||
    name.includes('hakkinda') ||
    name.includes('fikirleri') ||
    name.includes('bakimi') ||
    name.includes('adimda') ||
    name.includes('?');

  const isProbablyListingPage = hasCategorySlug && !hasStrongProductSignal;

  if (hasBlogUrlMarker) return true;
  if (isProbablyListingPage) return true;
  if (!stockStatus && !sourceProductId && hasBlogImageMarker) return true;
  if (!stockStatus && looksLikeArticleTitle) return true;
  if (!hasPrice) return true;
  if (!hasStockSignal) return true;

  return false;
};

const main = async () => {
  const absIn = resolve(process.cwd(), inputPath);
  const raw = JSON.parse(await readFile(absIn, 'utf8'));

  const products = Array.isArray(raw.products) ? raw.products : [];

  const cleaned = [];
  const rejected = [];

  for (const p of products) {
    if (isLikelyNonProduct(p)) {
      rejected.push(p);
      continue;
    }

    cleaned.push(p);
  }

  const absOut = resolve(process.cwd(), outputPath);
  const absRejected = resolve(process.cwd(), rejectedPath);

  await mkdir(resolve(absOut, '..'), { recursive: true });
  await mkdir(resolve(absRejected, '..'), { recursive: true });

  await writeFile(absOut, JSON.stringify({ ...raw, products: cleaned }, null, 2), 'utf8');
  await writeFile(
    absRejected,
    JSON.stringify(
      {
        site: raw.site,
        exportedAt: new Date().toISOString(),
        totalRejected: rejected.length,
        rejected,
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log('Temizleme tamamlandi.');
  console.log(`Girdi urun: ${products.length}`);
  console.log(`Kalan urun: ${cleaned.length}`);
  console.log(`Reddedilen: ${rejected.length}`);
  console.log(`Temiz cikti: ${absOut}`);
  console.log(`Reddedilen listesi: ${absRejected}`);
};

main().catch((err) => {
  console.error('Hazirlama hatasi:', err);
  process.exitCode = 1;
});
