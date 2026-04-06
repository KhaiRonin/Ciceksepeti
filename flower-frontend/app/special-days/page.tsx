'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarHeart, Sparkles } from 'lucide-react';
import ProductCard from '@/components/common/ProductCard';
import { productService } from '@/services/product.service';
import { OCCASIONS, OCCASION_CURATION_RULES } from '@/lib/occasions';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';

const PRODUCTS_PER_SECTION = 8;

function scoreProductForOccasion(product: Product, occasionKey: (typeof OCCASIONS)[number]['key']): number {
  const rule = OCCASION_CURATION_RULES[occasionKey];
  const text = `${product.name ?? ''} ${product.description ?? ''}`.toLowerCase();

  const includeHits = (rule.include ?? []).reduce((sum, keyword) => (
    sum + (text.includes(keyword.toLowerCase()) ? 1 : 0)
  ), 0);

  const fallbackHits = (rule.fallback ?? []).reduce((sum, keyword) => (
    sum + (text.includes(keyword.toLowerCase()) ? 1 : 0)
  ), 0);

  const avoidHits = (rule.avoid ?? []).reduce((sum, keyword) => (
    sum + (text.includes(keyword.toLowerCase()) ? 1 : 0)
  ), 0);

  return includeHits * 10 + fallbackHits * 4 - avoidHits * 6;
}

function compareByRecency(a: Product, b: Product): number {
  const aTime = new Date(a.createdAt ?? 0).getTime();
  const bTime = new Date(b.createdAt ?? 0).getTime();
  return bTime - aTime;
}

export default function SpecialDaysPage() {
  const allProductsQuery = useQuery({
    queryKey: ['products', 'special-days-pool'],
    queryFn: () =>
      productService.getProducts({
        limit: 100,
        sort: 'newest',
      }),
    staleTime: 1000 * 60 * 10,
  });

  const sectionProducts = useMemo(() => {
    const pool = [...(allProductsQuery.data?.data ?? [])];
    const usedProductIds = new Set<string>();

    return OCCASIONS.map((occasion) => {
      const scored = pool
        .filter((product) => !usedProductIds.has(product.id))
        .map((product) => ({
          product,
          score: scoreProductForOccasion(product, occasion.key),
        }))
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return compareByRecency(a.product, b.product);
        });

      const strongMatches = scored
        .filter((item) => item.score > 0)
        .slice(0, PRODUCTS_PER_SECTION)
        .map((item) => item.product);

      if (strongMatches.length < PRODUCTS_PER_SECTION) {
        const needed = PRODUCTS_PER_SECTION - strongMatches.length;
        const fill = scored
          .filter((item) => !strongMatches.some((p) => p.id === item.product.id))
          .slice(0, needed)
          .map((item) => item.product);
        strongMatches.push(...fill);
      }

      strongMatches.forEach((product) => usedProductIds.add(product.id));
      return strongMatches;
    });
  }, [allProductsQuery.data?.data]);

  const isLoading = allProductsQuery.isLoading;

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 md:py-12">
      <div className="mb-10">
        <p className="inline-flex items-center gap-2 text-xs tracking-widest uppercase font-semibold text-primary">
          <CalendarHeart className="h-4 w-4" />
          Özel Gün Rehberi
        </p>
        <h1 className="font-serif text-4xl md:text-5xl font-bold mt-2">Özel Günlere Göre Çiçek Seçimi</h1>
        <p className="text-muted-foreground mt-3 max-w-3xl">
          Çiçekçilik standartları ve gönderim alışkanlıklarına göre her özel gün için uygun çiçekleri listeledik.
          Her bölümde seçili günün temasına uygun ürünleri görebilirsin.
        </p>
      </div>

      <div className="space-y-10">
        {OCCASIONS.map((occasion, index) => {
          const products = sectionProducts[index];

          return (
            <section key={occasion.key} className="rounded-2xl border border-border/60 bg-card/70 p-5 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    {occasion.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">{occasion.subtitle}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/products?occasion=${occasion.key}`}>
                    Tümünü Gör <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 min-[460px]:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-square rounded-xl" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                  Bu özel gün için uygun ürün bulunamadı. Farklı bir gün seçimi yapabilir veya Tüm Çiçekler sayfasından devam edebilirsin.
                </div>
              ) : (
                <div className="grid grid-cols-1 min-[460px]:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {products.map((product) => (
                    <ProductCard key={`${occasion.key}-${product.id}`} product={product} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
