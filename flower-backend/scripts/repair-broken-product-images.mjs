#!/usr/bin/env node

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const argv = process.argv.slice(2);
const getArg = (name, fallback = '') => {
  const p = `--${name}=`;
  const f = argv.find((x) => x.startsWith(p));
  return f ? f.slice(p.length) : fallback;
};

const inputPath = getArg('in', './tmp/opencart-products-clean.json');
const timeoutMs = Number(getArg('timeout-ms', '20000')) || 20000;

const uploadsDir = resolve(process.cwd(), 'uploads', 'products', 'imported');

const slug = (s) => String(s ?? '')
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 60) || 'urun';

const normName = (s) => String(s ?? '')
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const extFromContentType = (ct) => {
  const c = String(ct || '').toLowerCase();
  if (c.includes('jpeg')) return '.jpg';
  if (c.includes('png')) return '.png';
  if (c.includes('webp')) return '.webp';
  if (c.includes('gif')) return '.gif';
  return '.jpg';
};

const fetchText = async (url) => {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: c.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ProductImageRepair/1.0)',
        Accept: 'text/html,*/*;q=0.8',
      },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.text();
  } finally {
    clearTimeout(t);
  }
};

const fetchImage = async (url) => {
  const safeUrl = encodeURI(url);
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeoutMs);
  try {
    const res = await fetch(safeUrl, {
      signal: c.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ProductImageRepair/1.0)',
        Accept: 'image/*,*/*;q=0.8',
      },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const ct = res.headers.get('content-type') || '';
    if (!ct.toLowerCase().includes('image')) throw new Error(`not-image: ${ct}`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    return { bytes, ct };
  } finally {
    clearTimeout(t);
  }
};

const getOgImage = (html) => {
  const m = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i.exec(html);
  return m?.[1]?.trim() || '';
};

const findFallbackImage = (html, sourceProductId) => {
  const urls = [...new Set((html.match(/https?:\/\/[^\s"<>]+/g) || []))];
  const candidates = urls
    .filter((u) => u.includes('/image/'))
    .filter((u) => /\.(jpe?g|png|webp|gif)(\?|$)/i.test(u));

  if (!candidates.length) return '';

  if (sourceProductId) {
    const idMatch = candidates.find((u) => u.includes(`/${sourceProductId}/`));
    if (idMatch) return idMatch;
  }

  const mainMatch = candidates.find((u) => u.includes('/main/'));
  if (mainMatch) return mainMatch;

  return candidates[0] || '';
};

const hasBrokenRemoteUrl = (images) => {
  const first = String(images?.[0] || '');
  if (!first.startsWith('http')) return false;
  return !/\.(jpe?g|png|webp|gif)(\?|$)/i.test(first);
};

const isImageUrl = (url) => /\.(jpe?g|png|webp|gif)(\?|$)/i.test(String(url || ''));

const buildImageVariants = (url) => {
  const base = String(url || '').trim();
  if (!base) return [];
  const variants = new Set([base]);

  if (base.includes('600x315w')) {
    variants.add(base.replace('600x315w', '550x550h'));
    variants.add(base.replace('600x315w', '550x550w'));
    variants.add(base.replace('600x315w', '600x315h'));
  }
  if (base.includes('600x315h')) {
    variants.add(base.replace('600x315h', '550x550h'));
    variants.add(base.replace('600x315h', '550x550w'));
    variants.add(base.replace('600x315h', '600x315w'));
  }

  return [...variants];
};

const main = async () => {
  await mkdir(uploadsDir, { recursive: true });

  const raw = JSON.parse(await readFile(resolve(process.cwd(), inputPath), 'utf8'));
  const sourceRows = (raw.products || []).map((p) => ({
    name: String(p.name || '').trim(),
    norm: normName(p.name || ''),
    sourceUrl: String(p.sourceUrl || '').trim(),
    sourceProductId: String(p.sourceProductId || '').trim(),
  })).filter((x) => x.name && x.sourceUrl);

  const sourceMap = new Map(sourceRows.map((r) => [r.norm, r]));

  const candidates = await prisma.product.findMany({
    select: { id: true, name: true, images: true },
  });

  const broken = candidates.filter((p) => hasBrokenRemoteUrl(p.images));

  let repaired = 0;
  let deleted = 0;
  let failed = 0;

  for (const p of broken) {
    try {
      if (p.name.startsWith('Smoke Product')) {
        await prisma.product.delete({ where: { id: p.id } });
        deleted += 1;
        continue;
      }

      let source = sourceMap.get(normName(p.name));
      if (!source) {
        const n = normName(p.name);
        const found = sourceRows.find((r) => r.norm.includes(n) || n.includes(r.norm));
        source = found;
      }
      const src = source?.sourceUrl || '';
      if (!src) throw new Error('sourceUrl not found');

      const html = await fetchText(src);
      const ogImage = getOgImage(html);
      const fallbackImage = findFallbackImage(html, source?.sourceProductId || '');
      const imageUrl = isImageUrl(ogImage) ? ogImage : fallbackImage;
      if (!imageUrl) throw new Error('image url missing');

      let imageData = null;
      const variants = buildImageVariants(imageUrl);
      for (const candidate of variants) {
        try {
          imageData = await fetchImage(candidate);
          break;
        } catch {
          // try next variant
        }
      }
      if (!imageData) throw new Error('all image variants failed');

      const { bytes, ct } = imageData;
      const hash = crypto.createHash('sha1').update(bytes).digest('hex').slice(0, 10);
      const filename = `${slug(p.name)}-${p.id.slice(0, 8)}-repair-${hash}${extFromContentType(ct)}`;
      const abs = join(uploadsDir, filename);
      await writeFile(abs, bytes);

      await prisma.product.update({
        where: { id: p.id },
        data: { images: [`/uploads/products/imported/${filename}`] },
      });

      repaired += 1;
    } catch (err) {
      console.log('repair-fail', p.name, String(err?.message || err));
      failed += 1;
    }
  }

  console.log({ totalBroken: broken.length, repaired, deleted, failed });
};

main()
  .catch((e) => {
    console.error('repair failed', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
