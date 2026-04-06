'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Trash2, ShoppingBag, ArrowRight, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/common/EmptyState';
import { useCart } from '@/hooks/useCart';
import { useAuthStore } from '@/store/auth.store';
import { formatPrice, getProductImage, shouldBypassImageOptimization } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '@/services/cart.service';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n/context';

export default function CartPage() {
  const { cart, isLoading, cartTotal } = useCart();
  const { isAuthenticated } = useAuthStore();
  const qc = useQueryClient();
  const { locale, t } = useI18n();
  const isTr = locale === 'tr';
  const tx = {
    loginAction: isTr ? 'Giriş Yap' : 'Log In',
    itemWord: isTr ? 'ürün' : 'products',
    completeOrder: isTr ? 'Siparişi Tamamla' : 'Complete Order',
  };

  const removeMutation = useMutation({
    mutationFn: (productId: string) => cartService.removeItem(productId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] });
      toast.success(t('cart.itemRemoved'));
    },
  });

  const addMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartService.addItem(productId, quantity),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });

  const decreaseMutation = useMutation({
    mutationFn: async ({ productId, nextQuantity }: { productId: string; nextQuantity: number }) => {
      await cartService.removeItem(productId);
      if (nextQuantity > 0) {
        return cartService.addItem(productId, nextQuantity);
      }
      return cartService.getCart();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });

  if (!isAuthenticated) {
    return (
      <EmptyState
        title={t('cart.loginTitle')}
        description={t('cart.loginDescription')}
        icon={<ShoppingBag className="h-10 w-10" />}
        actionLabel={tx.loginAction}
        actionHref="/login"
        className="py-24"
      />
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-10">
        <div className="space-y-4 max-w-2xl">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-24 w-24 rounded-xl" />
              <div className="flex-1 space-y-2 py-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        title={t('cart.emptyTitle')}
        description={t('cart.emptyDescription')}
        icon={<ShoppingBag className="h-10 w-10" />}
        actionLabel={t('cart.discoverFlowers')}
        actionHref="/products"
        className="py-24"
      />
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">{t('cart.title')}</p>
        <h1 className="font-serif text-3xl font-bold">{cart.items.length} {tx.itemWord}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => {
            const productImage = getProductImage(item.product);

            return (
              <div
                key={item.id}
                className="flex gap-4 p-4 rounded-2xl border border-border/60 bg-card"
              >
                <Link href={`/products/${item.product.id}`} className="shrink-0">
                  <div className="relative h-24 w-24 rounded-xl overflow-hidden bg-accent/30">
                    {productImage ? (
                      <Image
                        src={productImage}
                        alt={item.product.name}
                        fill
                        unoptimized={shouldBypassImageOptimization(productImage)}
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-2xl">
                        🌸
                      </div>
                    )}
                  </div>
                </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.product.id}`}>
                  <h3 className="font-medium text-sm leading-snug hover:text-primary transition-colors line-clamp-2">
                    {item.product.name}
                  </h3>
                </Link>
                <p className="text-primary font-semibold mt-1">
                  {formatPrice(item.product.price, 'TRY', locale)}
                </p>
                {/* Qty controls */}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1 border border-border rounded-lg">
                    <button
                      className="px-2.5 py-1.5 text-muted-foreground hover:text-foreground disabled:opacity-40"
                      disabled={item.quantity <= 1}
                      onClick={() =>
                        decreaseMutation.mutate({
                          productId: item.productId,
                          nextQuantity: item.quantity - 1,
                        })
                      }
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      className="px-2.5 py-1.5 text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        addMutation.mutate({
                          productId: item.product.id,
                          quantity: 1,
                        })
                      }
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    className="ml-auto text-muted-foreground hover:text-destructive transition-colors p-1"
                    onClick={() => removeMutation.mutate(item.productId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-sm">
                  {formatPrice(item.product.price * item.quantity, 'TRY', locale)}
                </p>
              </div>
              </div>
            );
          })}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-border/60 bg-card p-6 sticky top-24">
            <h2 className="font-serif font-semibold text-lg mb-5">{t('cart.orderSummary')}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{t('cart.subtotal')}</span>
                <span>{formatPrice(cartTotal, 'TRY', locale)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t('cart.shipping')}</span>
                <span className={cartTotal >= 250 ? 'text-green-600 font-medium' : ''}>
                  {cartTotal >= 250 ? t('common.free') : formatPrice(29.9, 'TRY', locale)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-base pt-1">
                <span>{t('cart.total')}</span>
                <span className="text-primary font-bold">
                  {formatPrice(cartTotal >= 250 ? cartTotal : cartTotal + 29.9, 'TRY', locale)}
                </span>
              </div>
            </div>
            <Button className="w-full mt-6 gap-2" size="lg" asChild>
              <Link href="/checkout">
                {tx.completeOrder} <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="ghost" className="w-full mt-2 text-muted-foreground" asChild>
              <Link href="/products">{t('cart.continueShopping')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
