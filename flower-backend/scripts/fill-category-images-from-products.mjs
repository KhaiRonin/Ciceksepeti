#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const argv = process.argv.slice(2);
const hasFlag = (name) => argv.includes(`--${name}`);
const dryRun = hasFlag('dry-run');

const pickImage = (images) => {
  const list = (images || []).map((x) => String(x || '').trim()).filter(Boolean);
  if (!list.length) return '';

  const preferred = list.find((img) => img.startsWith('/uploads/products/imported/'));
  if (preferred) return preferred;

  const local = list.find((img) => img.startsWith('/uploads/'));
  if (local) return local;

  const remote = list.find((img) => img.startsWith('http://') || img.startsWith('https://'));
  return remote || '';
};

const main = async () => {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, imageUrl: true },
    orderBy: { createdAt: 'asc' },
  });

  let updated = 0;
  let skipped = 0;

  for (const category of categories) {
    if (category.imageUrl && category.imageUrl.trim()) {
      skipped += 1;
      continue;
    }

    const product = await prisma.product.findFirst({
      where: { categoryId: category.id },
      select: { images: true },
      orderBy: { createdAt: 'desc' },
    });

    const image = pickImage(product?.images || []);
    if (!image) {
      skipped += 1;
      continue;
    }

    if (!dryRun) {
      await prisma.category.update({
        where: { id: category.id },
        data: { imageUrl: image },
      });
    }

    updated += 1;
  }

  console.log({ mode: dryRun ? 'dry-run' : 'write', total: categories.length, updated, skipped });
};

main()
  .catch((err) => {
    console.error('Kategori gorsel doldurma hatasi:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
