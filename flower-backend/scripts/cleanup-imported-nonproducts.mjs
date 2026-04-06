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

const rejectedPath = getArg('rejected', './tmp/opencart-products-rejected.json');
const prisma = new PrismaClient();

const main = async () => {
  const absRejected = resolve(process.cwd(), rejectedPath);
  const rejected = JSON.parse(await readFile(absRejected, 'utf8'));
  const names = [...new Set((rejected.rejected || []).map((r) => String(r.name || '').trim()).filter(Boolean))];

  if (!names.length) {
    console.log('Silinecek non-product isim bulunamadi.');
    return;
  }

  const result = await prisma.product.deleteMany({
    where: {
      name: {
        in: names,
      },
    },
  });

  console.log(`Silinen non-product kayit: ${result.count}`);
};

main()
  .catch((err) => {
    console.error('Cleanup hatasi:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
