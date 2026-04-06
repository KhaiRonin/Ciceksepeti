'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/common/ProductCard';
import EmptyState from '@/components/common/EmptyState';
import { productService } from '@/services/product.service';
import { categoryService } from '@/services/category.service';
import { ShoppingBag } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { OCCASIONS } from '@/lib/occasions';
import { useI18n } from '@/lib/i18n/context';

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const lastAutoLoadAtRef = useRef(0);
  const autoLoadInFlightRef = useRef(false);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string>(searchParams.get('categoryId') ?? 'all');
  const [sort, setSort] = useState<'newest' | 'best-selling'>(
    searchParams.get('sort') === 'best-selling' ? 'best-selling' : 'newest',
  );
  const [discounted, setDiscounted] = useState<boolean>(searchParams.get('discounted') === 'true');
  const [occasion, setOccasion] = useState<string>(searchParams.get('occasion') ?? 'all');
  const { locale, t } = useI18n();
  const isTr = locale === 'tr';
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    const nextCategoryId = searchParams.get('categoryId') ?? 'all';
    setCategoryId(nextCategoryId);
    setSort(searchParams.get('sort') === 'best-selling' ? 'best-selling' : 'newest');
    setDiscounted(searchParams.get('discounted') === 'true');
    setOccasion(searchParams.get('occasion') ?? 'all');
  }, [searchParams]);

  const { data: categories } = useQuery({
    queryKey: ['categories', locale],
    queryFn: categoryService.getCategories,
  });

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['products', locale, debouncedSearch, categoryId, sort, discounted, occasion],
    queryFn: ({ pageParam = 1 }) =>
      productService.getProducts({
        search: debouncedSearch || undefined,
        categoryId: categoryId === 'all' ? undefined : categoryId,
        sort,
        discounted,
        occasion: occasion === 'all' ? undefined : occasion,
        page: pageParam,
        limit: 24,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((sum, page) => sum + page.data.length, 0);
      if (loadedCount >= lastPage.total) return undefined;
      return allPages.length + 1;
    },
  });

  const clearFilters = useCallback(() => {
    setSearch('');
    setCategoryId('all');
    setSort('newest');
    setDiscounted(false);
    setOccasion('all');
  }, []);

  const products = data?.pages.flatMap((page) => page.data) ?? [];
  const totalProducts = data?.pages?.[0]?.total ?? 0;
  const hasActiveFilters = search.length > 0 || categoryId !== 'all' || sort !== 'newest' || discounted || occasion !== 'all';

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasNextPage || isFetchingNextPage) return;

    autoLoadInFlightRef.current = false;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;

        const now = Date.now();
        const isCoolingDown = now - lastAutoLoadAtRef.current < 700;
        if (isCoolingDown || autoLoadInFlightRef.current) return;

        autoLoadInFlightRef.current = true;
        lastAutoLoadAtRef.current = now;

        void fetchNextPage().finally(() => {
          autoLoadInFlightRef.current = false;
        });
      },
      {
        root: null,
        rootMargin: '220px 0px',
        threshold: 0,
      },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="container mx-auto px-4 md:px-6 py-10">
      {/* Page header */}
      <div className="mb-8">
        <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">
          {t('products.collection')}
        </p>
        <h1 className="font-serif text-4xl font-bold text-foreground">{t('products.title')}</h1>
        {data && (
          <p className="text-muted-foreground mt-2">
            {t('home.productsCount', { count: totalProducts })}
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 mb-8">
        {/* Search */}
        <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('products.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category filter */}
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            <SelectValue placeholder={t('products.categoryPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('products.allCategories')}</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={occasion} onValueChange={setOccasion}>
          <SelectTrigger className="w-full sm:w-[210px]">
            <SelectValue placeholder={isTr ? 'Özel Gün' : 'Occasion'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isTr ? 'Tüm Özel Günler' : 'All Occasions'}</SelectItem>
            {OCCASIONS.map((o) => (
              <SelectItem key={o.key} value={o.key}>{locale === 'en' ? occasionTitleEn(o.key) : o.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
            <X className="h-3.5 w-3.5" />
            {t('products.clearFilters')}
          </Button>
        )}

        {/* Active filter badges */}
        {categoryId !== 'all' && categories && (
          <Badge variant="secondary" className="gap-1">
            {categories.find((c) => c.id === categoryId)?.name}
            <button onClick={() => setCategoryId('all')}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {occasion !== 'all' && (
          <Badge variant="secondary" className="gap-1">
            {locale === 'en'
              ? occasionTitleEn(occasion)
              : (OCCASIONS.find((o) => o.key === occasion)?.title ?? 'Özel Gün')}
            <button onClick={() => setOccasion('all')}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 min-[460px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          title={locale === 'tr' ? 'Ürünler yüklenemedi' : 'Products could not be loaded'}
          description={locale === 'tr'
            ? 'Sunucuya bağlanılamadı. Lütfen bağlantınızı kontrol edip tekrar deneyin.'
            : 'Cannot connect to the server. Please check your connection and try again.'}
          icon={<ShoppingBag className="h-10 w-10" />}
          actionLabel={locale === 'tr' ? 'Tekrar Dene' : 'Try Again'}
          actionHref="/products"
        />
      ) : products.length === 0 ? (
        <EmptyState
          title={t('products.emptyTitle')}
          description={t('products.emptyDescription')}
          icon={<ShoppingBag className="h-10 w-10" />}
          actionLabel={t('products.clearFilters')}
          actionHref="/products"
        />
      ) : (
        <div>
          <div className="grid grid-cols-1 min-[460px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {hasNextPage && <div ref={loadMoreRef} className="h-8" />}

          {isFetchingNextPage && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {locale === 'tr' ? 'Daha fazla ürün yükleniyor...' : 'Loading more products...'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function occasionTitleEn(key: string): string {
  if (key === 'valentines-day') return "Valentine's Day";
  if (key === 'mothers-day') return "Mother's Day";
  if (key === 'womens-day') return "Women's Day";
  if (key === 'fathers-day') return "Father's Day";
  if (key === 'teachers-day') return "Teachers' Day";
  if (key === 'anniversary') return 'Anniversary';
  if (key === 'birthday') return 'Birthday';
  if (key === 'new-baby') return 'New Baby';
  if (key === 'congratulations') return 'Congratulations';
  if (key === 'get-well') return 'Get Well Soon';
  if (key === 'sympathy') return 'Sympathy';
  return key;
}
