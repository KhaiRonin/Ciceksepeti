'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import OrderStatusBadge from '@/components/common/OrderStatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { useI18n } from '@/lib/i18n/context';
import { orderService } from '@/services/order.service';
import { useAuthStore } from '@/store/auth.store';
import { formatPrice, formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OrdersPage() {
  const { isAuthenticated } = useAuthStore();
  const { locale, t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', locale],
    queryFn: orderService.getMyOrders,
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-10 space-y-4 max-w-2xl">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 max-w-3xl">
      <div className="mb-8">
        <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">{t('orders.account')}</p>
        <h1 className="font-serif text-3xl font-bold">{t('orders.title')}</h1>
      </div>

      {!orders || orders.length === 0 ? (
        <EmptyState
          title={t('orders.emptyTitle')}
          description={t('orders.emptyDescription')}
          icon={<Package className="h-10 w-10" />}
          actionLabel={t('orders.startShopping')}
          actionHref="/products"
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const total = Number((order as unknown as { totalAmount?: number; totalPrice?: number | string }).totalAmount
              ?? (order as unknown as { totalAmount?: number; totalPrice?: number | string }).totalPrice
              ?? 0);

            return (
              <div
                key={order.id}
                className="rounded-2xl border border-border/60 bg-card p-5 flex flex-wrap items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">
                      {t('orders.orderNumber')} #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(order.createdAt, locale)} · {t('orders.productsCount', { count: order.items.length })}
                  </p>
                  <p className="text-sm font-semibold text-primary mt-1">
                    {formatPrice(total, 'TRY', locale)}
                  </p>
                </div>
                <Button variant="ghost" size="sm" asChild className="gap-1 shrink-0">
                  <Link href={`/orders/${order.id}`}>
                    {t('orders.detail')} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
