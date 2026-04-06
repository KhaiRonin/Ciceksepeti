'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Package,
  Clock,
  AlertTriangle,
  ArrowRight,
  Tag,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsCard } from '@/components/admin/StatsCard';
import { RevenueChart, OrdersChart } from '@/components/admin/Charts';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import { dashboardService, adminOrderService, adminProductService } from '@/services/dashboard.service';
import { formatDate, formatPrice, formatPriceFromApi } from '@/lib/utils';
import { AdminOrder, ChartPeriod } from '@/types/admin';
import Link from 'next/link';

function getOrderTotalValue(order: AdminOrder): unknown {
  const legacy = order as unknown as { totalAmount?: unknown; total_price?: unknown };
  return order.totalPrice ?? legacy.totalAmount ?? legacy.total_price ?? null;
}

function getOrderCreatedAt(order: AdminOrder): string | null {
  const legacy = order as unknown as { created_at?: string; orderDate?: string; order_date?: string };
  return order.createdAt ?? legacy.created_at ?? legacy.orderDate ?? legacy.order_date ?? null;
}

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<ChartPeriod>('weekly');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard', period],
    queryFn: () => dashboardService.getDashboard(period),
  });

  const { data: recentOrdersData } = useQuery({
    queryKey: ['admin-orders-recent'],
    queryFn: () => adminOrderService.getAll({ limit: 6, page: 1 }),
    staleTime: 30_000,
  });

  const { data: productsData } = useQuery({
    queryKey: ['admin-products-all'],
    queryFn: () => adminProductService.getAll({ limit: 100 }),
    staleTime: 60_000,
  });

  const stats = data?.stats;
  const revenueChart = data?.revenueChart ?? [];
  const recentOrders = recentOrdersData?.data ?? [];
  const allProducts = productsData?.data ?? [];
  const lowStockProducts = allProducts.filter((p) => p.stock < 10 && p.stock > 0).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kıbrısçiçeksepetim satış özeti
          </p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as ChartPeriod)}>
          <TabsList className="h-8">
            <TabsTrigger value="daily" className="text-xs px-3">Günlük</TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs px-3">Haftalık</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs px-3">Aylık</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Toplam Gelir"
          value={stats ? formatPrice(stats.totalRevenue) : '...'}
          change={stats?.revenueGrowth}
          description="geçen döneme göre"
          icon={TrendingUp}
          iconColor="text-emerald-600"
          loading={isLoading}
        />
        <StatsCard
          title="Toplam Sipariş"
          value={stats?.totalOrders ?? '...'}
          change={stats?.ordersGrowth}
          description="geçen döneme göre"
          icon={ShoppingBag}
          iconColor="text-blue-600"
          loading={isLoading}
        />
        <StatsCard
          title="Müşteriler"
          value={stats?.totalCustomers ?? '...'}
          change={stats?.customersGrowth}
          description="yeni kayıt"
          icon={Users}
          iconColor="text-violet-600"
          loading={isLoading}
        />
        <StatsCard
          title="Ürünler"
          value={stats?.totalProducts ?? '...'}
          icon={Package}
          iconColor="text-orange-600"
          loading={isLoading}
        />
      </div>

      {/* Alert row */}
      {(stats?.pendingOrders ?? 0) > 0 || (stats?.lowStockProducts ?? 0) > 0 || (stats?.soonEndingDiscounts ?? 0) > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(stats?.pendingOrders ?? 0) > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/20 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                  <Clock className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                    {stats?.pendingOrders} bekleyen sipariş
                  </p>
                  <p className="text-xs text-amber-700/70 dark:text-amber-400/70">
                    İncelemeniz gerekiyor
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                <Link href="/admin/orders?status=pending">Görüntüle</Link>
              </Button>
            </div>
          )}
          {(stats?.lowStockProducts ?? 0) > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-950/20 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                  <AlertTriangle className="h-4 w-4 text-red-700 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-900 dark:text-red-200">
                    {stats?.lowStockProducts} düşük stok uyarısı
                  </p>
                  <p className="text-xs text-red-700/70 dark:text-red-400/70">
                    Stok yenilemesi gerekiyor
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                <Link href="/admin/products">Görüntüle</Link>
              </Button>
            </div>
          )}
          {(stats?.soonEndingDiscounts ?? 0) > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-950/20 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                  <Tag className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
                    {stats?.soonEndingDiscounts} indirim 3 gün içinde bitiyor
                  </p>
                  <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70">
                    Kampanya takibi önerilir
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                <Link href="/admin/products">Görüntüle</Link>
              </Button>
            </div>
          )}
        </div>
      ) : null}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Gelir Grafiği</CardTitle>
                <CardDescription className="text-xs">
                  {period === 'daily' ? 'Son 7 gün' : period === 'weekly' ? 'Son 12 hafta' : 'Son 12 ay'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[220px] w-full rounded-lg" />
            ) : (
              <div className="h-[220px]">
                <RevenueChart data={revenueChart} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Siparişler</CardTitle>
            <CardDescription className="text-xs">Aynı dönem</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[220px] w-full rounded-lg" />
            ) : (
              <div className="h-[220px]">
                <OrdersChart data={revenueChart} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent orders */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Son Siparişler</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
                <Link href="/admin/orders">
                  Tümü <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <ShoppingBag className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">Henüz sipariş yok</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {recentOrders.slice(0, 5).map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{order.user.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(getOrderCreatedAt(order))}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-3 shrink-0">
                      <AdminStatusBadge status={order.status} />
                      <span className="text-sm font-semibold tabular-nums">
                        {formatPriceFromApi(getOrderTotalValue(order))}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low stock */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Düşük Stok Uyarıları</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
                <Link href="/admin/products">
                  Tümü <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {lowStockProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Package className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">Tüm ürünler yeterli stokta</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {product.category?.name}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        product.stock <= 3 ? 'text-red-600' : 'text-amber-600'
                      }`}
                    >
                      {product.stock} adet
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
