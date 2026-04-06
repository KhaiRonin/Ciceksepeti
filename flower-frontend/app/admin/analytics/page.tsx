'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, ShoppingCart, Users, PackageCheck } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

import { StatsCard } from '@/components/admin/StatsCard';
import { RevenueChart, OrdersChart } from '@/components/admin/Charts';
import { dashboardService } from '@/services/dashboard.service';
import { ChartPeriod } from '@/types/admin';
import { formatPrice } from '@/lib/utils';

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<ChartPeriod>('monthly');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard', period],
    queryFn: () => dashboardService.getDashboard(period),
  });

  const stats = data?.stats;
  const revenue = data?.revenueChart ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Analitik</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Detaylı satış ve büyüme istatistikleri</p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as ChartPeriod)}>
          <TabsList className="h-8">
            <TabsTrigger value="daily" className="text-xs h-6 px-3">Günlük</TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs h-6 px-3">Haftalık</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs h-6 px-3">Aylık</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Toplam Gelir"
          value={stats ? formatPrice(stats.totalRevenue) : '—'}
          change={stats?.revenueGrowth}
          icon={TrendingUp}
          iconColor="text-emerald-600"
          loading={isLoading}
        />
        <StatsCard
          title="Toplam Sipariş"
          value={stats ? String(stats.totalOrders) : '—'}
          change={stats?.ordersGrowth}
          icon={ShoppingCart}
          iconColor="text-blue-600"
          loading={isLoading}
        />
        <StatsCard
          title="Müşteriler"
          value={stats ? String(stats.totalCustomers) : '—'}
          change={stats?.customersGrowth}
          icon={Users}
          iconColor="text-violet-600"
          loading={isLoading}
        />
        <StatsCard
          title="Toplam Ürün"
          value={stats ? String(stats.totalProducts) : '—'}
          icon={PackageCheck}
          iconColor="text-orange-600"
          loading={isLoading}
        />
      </div>

      {/* Charts */}
      <div className="space-y-5">
        {isLoading ? (
          <Skeleton className="h-72 w-full rounded-xl" />
        ) : (
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Gelir Grafiği ({period === 'daily' ? 'Günlük' : period === 'weekly' ? 'Haftalık' : 'Aylık'})</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart data={revenue} type="area" />
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <Skeleton className="h-72 w-full rounded-xl" />
        ) : (
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Sipariş Hacmi</CardTitle>
            </CardHeader>
            <CardContent>
              <OrdersChart data={revenue} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top products */}
      {data?.topProducts && data.topProducts.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">En Çok Satan Ürünler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topProducts.map((product, i) => (
                <div key={product.id ?? i} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-muted-foreground tabular-nums">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-sm font-semibold tabular-nums ml-4">{formatPrice(product.revenue)}</p>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${Math.round((product.revenue / (data.topProducts[0].revenue || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
