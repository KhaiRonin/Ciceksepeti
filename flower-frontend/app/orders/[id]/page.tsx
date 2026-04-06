'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import OrderStatusBadge from '@/components/common/OrderStatusBadge';
import { orderService } from '@/services/order.service';
import { formatAddress, formatPrice, formatDate, getProductImage, shouldBypassImageOptimization } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/context';

export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { locale, t } = useI18n();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getOrder(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-10 max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-60 rounded-xl" />
      </div>
    );
  }

  if (!order) return null;

  const giftNoteRaw = (order as unknown as { giftNote?: unknown }).giftNote;
  const giftNote = typeof giftNoteRaw === 'string' ? giftNoteRaw.trim() : '';
  const orderTotal = Number((order as unknown as { totalAmount?: number; totalPrice?: string | number }).totalAmount
    ?? (order as unknown as { totalAmount?: number; totalPrice?: string | number }).totalPrice
    ?? 0);

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 max-w-2xl">
      <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2 gap-1 text-muted-foreground">
        <Link href="/orders"><ArrowLeft className="h-4 w-4" /> {t('orders.backToOrders')}</Link>
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl font-bold">
            {t('orders.orderNumber')} #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{formatDate(order.createdAt, locale)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Items */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden mb-5">
        <div className="p-4 border-b border-border/60">
          <h2 className="font-semibold text-sm">{t('orders.orderItems')}</h2>
        </div>
        <div className="divide-y divide-border/60">
          {order.items.map((item) => {
            const productImage = getProductImage(item.product);
            const unitPrice = Number((item as unknown as { unitPrice?: number; price?: number }).unitPrice
              ?? (item as unknown as { unitPrice?: number; price?: number }).price
              ?? 0);

            return (
              <div key={item.id} className="flex gap-4 p-4">
                <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-accent/30 shrink-0">
                  {productImage ? (
                    <Image
                      src={productImage}
                      alt={item.product?.name ?? t('products.title')}
                      fill
                      sizes="64px"
                      className="object-cover"
                      unoptimized={shouldBypassImageOptimization(productImage)}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xl">🌸</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{item.product?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(unitPrice, 'TRY', locale)} × {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-semibold shrink-0">
                  {formatPrice(unitPrice * item.quantity, 'TRY', locale)}
                </p>
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t border-border/60 bg-secondary/20">
          <div className="flex justify-between font-bold">
            <span>{t('cart.total')}</span>
            <span className="text-primary">{formatPrice(orderTotal, 'TRY', locale)}</span>
          </div>
        </div>
      </div>

      {/* Address */}
      {order.address && (
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <h2 className="font-semibold text-sm flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-primary" /> {t('orders.deliveryAddress')}
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed">
            <p className="font-medium text-foreground">{order.address.fullName}</p>
            <p>{formatAddress(order.address)}</p>
            {order.address.phone && <p>{order.address.phone}</p>}
          </div>
        </div>
      )}

      {giftNote && (
        <div className="rounded-2xl border border-border/60 bg-card p-5 mt-5 space-y-3">
          <h2 className="font-semibold text-sm">{t('orders.giftNote')}</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{giftNote}</p>
        </div>
      )}
    </div>
  );
}
