'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Product } from '@/types';
import { useCart } from '@/hooks/useCart';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { getProductImage, shouldBypassImageOptimization } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/context';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export default function ProductCard({ product, className }: ProductCardProps) {
  const { addItem, isAdding } = useCart();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const { locale, t } = useI18n();

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    addItem({ productId: product.id, quantity: 1 });
  }

  const isOutOfStock = product.stock === 0;
  const imageSrc = getProductImage(product);
  const unoptimizedImage = shouldBypassImageOptimization(imageSrc);
  const formattedPrice = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(product.price);

  return (
    <Card
      className={cn(
        'group overflow-hidden border-border/60 card-hover cursor-pointer p-0',
        className,
      )}
    >
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-white">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              className="object-cover object-[center_62%]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              unoptimized={unoptimizedImage}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-accent/40">
              <span className="text-5xl select-none">🌸</span>
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <Badge variant="secondary" className="text-sm font-medium">{t('products.outOfStock')}</Badge>
            </div>
          )}
          {product.category && (
            <Badge className="absolute top-2.5 left-2.5 text-[11px]" variant="secondary">
              {product.category.name}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background hover:text-primary"
            onClick={(e) => e.preventDefault()}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </Link>

      <CardContent className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </Link>
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-0 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-end gap-0 tabular-nums text-primary leading-none font-sans text-2xl font-extrabold tracking-tight">
          {formattedPrice}
        </span>
        <Button
          size="sm"
          className="gap-1.5 text-xs w-full sm:w-auto"
          disabled={isOutOfStock || isAdding}
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          {t('products.addToCart')}
        </Button>
      </CardFooter>
    </Card>
  );
}
