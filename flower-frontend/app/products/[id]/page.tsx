'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, notFound } from 'next/navigation';
import Image from 'next/image';
import { ShoppingCart, ArrowLeft, Minus, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import PageLoader from '@/components/common/PageLoader';
import { productService } from '@/services/product.service';
import { useCart } from '@/hooks/useCart';
import { useAuthStore } from '@/store/auth.store';
import { getProductImage, shouldBypassImageOptimization } from '@/lib/utils';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem, isAdding } = useCart();
  const { isAuthenticated } = useAuthStore();

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProduct(id),
    enabled: !!id,
  });

  if (isLoading) return <PageLoader />;
  if (isError || !product) return notFound();

  const imageSrc = getProductImage(product);
  const unoptimizedImage = shouldBypassImageOptimization(imageSrc);
  const formattedPrice = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(product.price);
  const [liraPart, kurusPart = '00'] = formattedPrice.split(',');

  function handleAddToCart() {
    if (!isAuthenticated) { router.push('/login'); return; }
    addItem({ productId: product!.id, quantity: qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const isOutOfStock = product.stock === 0;

  return (
    <div className="container mx-auto px-4 md:px-6 py-10">
      {/* Breadcrumb */}
      <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2 gap-1 text-muted-foreground">
        <Link href="/products"><ArrowLeft className="h-4 w-4" /> Ürünlere Dön</Link>
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        {/* Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-accent/30">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              unoptimized={unoptimizedImage}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[120px] select-none">🌹</span>
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <Badge variant="secondary" className="text-base px-4 py-1.5">Tükendi</Badge>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          {product.category && (
            <Badge variant="secondary" className="w-fit mb-3">
              {product.category.name}
            </Badge>
          )}
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
            {product.name}
          </h1>
          <p className="inline-flex items-end gap-0 tabular-nums text-primary mb-6 leading-none">
            <span className="font-sans text-4xl font-extrabold tracking-tight">{liraPart}</span>
            <span className="mb-[3px] text-lg font-bold">,{kurusPart}</span>
            <span className="-ml-[1px] text-xl font-semibold">TL</span>
          </p>
          <p className="text-muted-foreground leading-relaxed mb-6">
            {product.description}
          </p>

          <Separator className="mb-6" />

          {/* Stock */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`h-2.5 w-2.5 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-destructive'}`} />
            <span className="text-sm text-muted-foreground">
              {product.stock > 0 ? `${product.stock} adet stokta` : 'Stok tükendi'}
            </span>
          </div>

          {/* Quantity selector */}
          {!isOutOfStock && (
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-medium text-foreground">Adet:</span>
              <div className="flex items-center gap-2 border border-border rounded-lg">
                <button
                  className="px-3 py-2 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                <button
                  className="px-3 py-2 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  disabled={qty >= product.stock}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Add to cart */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              className="flex-1 gap-2"
              disabled={isOutOfStock || isAdding}
              onClick={handleAddToCart}
            >
              {added ? (
                <><Check className="h-5 w-5" /> Sepete Eklendi</>
              ) : (
                <><ShoppingCart className="h-5 w-5" /> Sepete Ekle</>
              )}
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/cart">Sepete Git</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
