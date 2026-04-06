#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const argv = process.argv.slice(2);

const getArg = (name, fallback = '') => {
  const prefix = `--${name}=`;
  const match = argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
};

const hasFlag = (name) => argv.includes(`--${name}`);

const baseUrl = getArg('site', 'https://kibrisciceksepetim.com');
const outFile = getArg('out', './tmp/opencart-products.json');
const limit = Number(getArg('limit', '0')) || 0;
const concurrency = Math.max(1, Number(getArg('concurrency', '5')) || 5);
const includeNonProductUrls = hasFlag('include-non-product');

const normalizeUrl = (url) => {
  const u = new URL(url, baseUrl);
  u.hash = '';
  if (u.pathname.endsWith('/')) u.pathname = u.pathname.slice(0, -1);
  return u.toString();
};

const unique = (arr) => [...new Set(arr)];

const decodeHtml = (value = '') => value
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/\s+/g, ' ')
  .trim();

const stripTags = (html = '') => decodeHtml(html.replace(/<[^>]+>/g, ' '));

const moneyToNumber = (text = '') => {
  const cleaned = text
    .replace(/\./g, '')
    .replace(/,/g, '.')
    .replace(/[^\d.-]/g, '')
    .trim();

  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

const fetchText = async (url) => {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ProductMigrationBot/1.0)',
      Accept: 'text/html,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }

  return res.text();
};

const getSitemapUrl = async () => {
  const robotsUrl = new URL('/robots.txt', baseUrl).toString();
  const robots = await fetchText(robotsUrl);
  const lines = robots.split(/\r?\n/).map((x) => x.trim());
  const sitemapLine = lines.find((line) => /^sitemap\s*:/i.test(line));
  if (!sitemapLine) {
    return new URL('/index.php?route=extension/feed/google_sitemap', baseUrl).toString();
  }

  const sitemap = sitemapLine.split(':').slice(1).join(':').trim();
  return sitemap || new URL('/index.php?route=extension/feed/google_sitemap', baseUrl).toString();
};

const extractLocs = (xml) => {
  const out = [];
  const re = /<loc>(.*?)<\/loc>/gims;
  let m;
  while ((m = re.exec(xml)) !== null) {
    out.push(decodeHtml(m[1]));
  }
  return out;
};

const isLikelyProductUrl = (url) => {
  if (url.includes('route=product/product')) return true;
  if (url.includes('/index.php?route=product/product')) return true;
  if (url.includes('/blog') || url.includes('route=information/') || url.includes('route=account/')) return false;
  if (url.includes('?route=product/category')) return false;
  return true;
};

const extractFirst = (html, regex, group = 1) => {
  const match = regex.exec(html);
  return match ? decodeHtml(match[group] || '') : '';
};

const extractAll = (html, regex, group = 1) => {
  const out = [];
  let m;
  while ((m = regex.exec(html)) !== null) {
    out.push(decodeHtml(m[group] || ''));
  }
  return out;
};

const parseProductPage = (url, html) => {
  const canonical = extractFirst(html, /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  const h1Name = stripTags(extractFirst(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i));
  const ogTitle = extractFirst(html, /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const name = h1Name || ogTitle;

  const ogPrice = extractFirst(html, /<meta[^>]*property=["']product:price:amount["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const ogCurrency = extractFirst(html, /<meta[^>]*property=["']product:price:currency["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const oldPrice = extractFirst(html, /<span[^>]*class=["'][^"']*price-old[^"']*["'][^>]*>([^<]+)<\/span>/i);
  const newPrice = extractFirst(html, /<span[^>]*class=["'][^"']*price-new[^"']*["'][^>]*>([^<]+)<\/span>/i);
  const singlePrice = extractFirst(html, /<li[^>]*>\s*([\d]{1,3}(?:\.[\d]{3})*,\d{2})\s*TL\s*<\/li>/i);

  const rawPrices = extractAll(
    html,
    /([\d]{1,3}(?:\.[\d]{3})*,\d{2})\s*TL/gi,
    1,
  );

  const priceCandidates = unique([
    newPrice,
    singlePrice,
    ...rawPrices,
    ogPrice,
  ].filter(Boolean));

  const parsedNumbers = priceCandidates
    .map((p) => moneyToNumber(p))
    .filter((n) => n !== null)
    .sort((a, b) => a - b);

  const metaPrice = moneyToNumber(ogPrice);
  const price = metaPrice ?? (parsedNumbers.length ? parsedNumbers[0] : null);
  const compareAtPrice = moneyToNumber(oldPrice) ?? (parsedNumbers.length > 1 ? parsedNumbers[parsedNumbers.length - 1] : null);

  const stockText = extractFirst(html, /STOKTA\s*VAR|STOKTA\s*YOK|TUKENDI|TÜKENDİ/i, 0);

  const ogImage = extractFirst(html, /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const galleryImages = unique(
    extractAll(html, /(?:data-image|href)=["']([^"']+\/image\/[^"']+)["']/gi)
      .map((src) => {
        try {
          return new URL(src, url).toString();
        } catch {
          return '';
        }
      })
      .filter(Boolean),
  );

  const imageUrls = unique([
    ogImage ? new URL(ogImage, url).toString() : '',
    ...galleryImages,
  ].filter((src) => src && src.includes('/image/') && !src.includes('logo') && !src.includes('placeholder'))).slice(0, 12);

  const descriptionHtml = extractFirst(
    html,
    /id=["']product_tabs[^"']*["'][\s\S]*?<div[^>]*>([\s\S]*?)<\/div>[\s\S]*?(?:id=["']tab-review|<\/section>)/i,
  );
  const fallbackDescription = extractFirst(html, /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);

  const breadcrumbHtml = extractFirst(html, /<ul[^>]*class=["'][^"']*breadcrumb[^"']*["'][^>]*>([\s\S]*?)<\/ul>/i);
  const categoryLinks = unique(
    extractAll(breadcrumbHtml, /<a[^>]*>([\s\S]*?)<\/a>/gi, 1)
      .map((text) => stripTags(text))
      .filter((text) => text && text.length < 60)
      .filter((text) => {
        const lower = text.toLowerCase();
        return !['anasayfa', 'home'].includes(lower);
      }),
  );

  const productId = (() => {
    const idFromQuery = (() => {
      try {
        const parsed = new URL(url);
        return parsed.searchParams.get('product_id') || '';
      } catch {
        return '';
      }
    })();

    if (idFromQuery) return idFromQuery;
    const idFromCanonical = canonical.match(/product_id=(\d+)/i)?.[1] || '';
    if (idFromCanonical) return idFromCanonical;
    return '';
  })();

  return {
    sourceUrl: url,
    canonicalUrl: canonical || url,
    sourceProductId: productId || null,
    name,
    description: stripTags(descriptionHtml) || fallbackDescription || '',
    price,
    compareAtPrice,
    currency: ogCurrency || 'TRY',
    stockStatus: stockText || null,
    images: imageUrls,
    categories: categoryLinks.slice(0, 8),
    extractedAt: new Date().toISOString(),
  };
};

const runPool = async (items, worker, poolSize) => {
  const results = [];
  let idx = 0;

  const runners = Array.from({ length: poolSize }, async () => {
    while (idx < items.length) {
      const current = idx++;
      results[current] = await worker(items[current], current);
    }
  });

  await Promise.all(runners);
  return results;
};

const main = async () => {
  console.log(`[1/4] Sitemap tespit ediliyor: ${baseUrl}`);
  const sitemapUrl = await getSitemapUrl();

  console.log(`[2/4] Sitemap indiriliyor: ${sitemapUrl}`);
  const sitemapXml = await fetchText(sitemapUrl);
  const allUrls = unique(extractLocs(sitemapXml).map((u) => normalizeUrl(u)));

  const candidateUrls = includeNonProductUrls
    ? allUrls
    : allUrls.filter((u) => isLikelyProductUrl(u));

  const productUrls = limit > 0 ? candidateUrls.slice(0, limit) : candidateUrls;
  console.log(`Toplam URL: ${allUrls.length}, urun adayi: ${candidateUrls.length}, islenecek: ${productUrls.length}`);

  console.log(`[3/4] Urunler cekiliyor (concurrency=${concurrency})...`);
  let ok = 0;
  let fail = 0;

  const records = await runPool(
    productUrls,
    async (url, i) => {
      try {
        const html = await fetchText(url);
        const parsed = parseProductPage(url, html);
        if (!parsed.name || parsed.name.length < 2) {
          throw new Error('Urun adi bulunamadi');
        }

        ok += 1;
        if ((i + 1) % 20 === 0) {
          console.log(`  - ${i + 1}/${productUrls.length} tamamlandi (ok=${ok}, fail=${fail})`);
        }

        return { ok: true, data: parsed };
      } catch (error) {
        fail += 1;
        return {
          ok: false,
          error: String(error?.message || error),
          url,
        };
      }
    },
    concurrency,
  );

  const products = records.filter((r) => r?.ok).map((r) => r.data);
  const errors = records.filter((r) => !r?.ok);

  console.log(`[4/4] Dosyaya yaziliyor: ${outFile}`);
  const absoluteOut = resolve(process.cwd(), outFile);
  await mkdir(resolve(absoluteOut, '..'), { recursive: true });
  await writeFile(
    absoluteOut,
    JSON.stringify(
      {
        site: baseUrl,
        sitemapUrl,
        exportedAt: new Date().toISOString(),
        totals: {
          allUrls: allUrls.length,
          candidateUrls: candidateUrls.length,
          requested: productUrls.length,
          success: products.length,
          failed: errors.length,
        },
        products,
        errors,
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log(`Tamamlandi. Basarili: ${products.length}, Hata: ${errors.length}`);
  console.log(`Cikti: ${absoluteOut}`);
};

main().catch((err) => {
  console.error('Export basarisiz:', err);
  process.exitCode = 1;
});
