'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  TrendingUp, Users, ShoppingBag, Package, Award,
  Printer,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { adminReportService } from '@/services/dashboard.service';
import { formatDate, formatPrice } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/context';

const PERIODS = [
  { key: 'weekly' },
  { key: 'monthly' },
  { key: 'yearly' },
] as const;

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  PAID: '#3b82f6',
  PROCESSING: '#8b5cf6',
  SHIPPED: '#06b6d4',
  DELIVERED: '#10b981',
  CANCELED: '#ef4444',
};

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
const Z_PERIODS = [
  { key: 'daily' },
  { key: 'weekly' },
  { key: 'monthly' },
] as const;

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

export default function ReportsPage() {
  const { locale } = useI18n();
  const isTr = locale === 'tr';
  const tx = {
    pageTitle: isTr ? 'Raporlar' : 'Reports',
    pageSubtitle: isTr ? 'Satış ve müşteri analizleri' : 'Sales and customer analytics',
    periodWeekly: isTr ? 'Bu Hafta' : 'This Week',
    periodMonthly: isTr ? 'Bu Ay' : 'This Month',
    periodYearly: isTr ? 'Bu Yıl' : 'This Year',
    totalRevenue: isTr ? 'Toplam Gelir' : 'Total Revenue',
    orderCount: isTr ? 'Sipariş Sayısı' : 'Order Count',
    customerCount: isTr ? 'Müşteri Sayısı' : 'Customer Count',
    avgOrder: isTr ? 'Ortalama Sipariş' : 'Average Order',
    topProducts: isTr ? 'En Çok Satan Ürünler' : 'Top Selling Products',
    noData: isTr ? 'Veri yok' : 'No data',
    soldUnit: isTr ? 'adet satıldı' : 'sold',
    statusDistribution: isTr ? 'Sipariş Durumu Dağılımı' : 'Order Status Distribution',
    bestCustomers: isTr ? 'En İyi Müşteriler' : 'Top Customers',
    loading: isTr ? 'Yükleniyor...' : 'Loading...',
    customer: isTr ? 'Müşteri' : 'Customer',
    email: isTr ? 'E-posta' : 'Email',
    orderCountCol: isTr ? 'Sipariş Sayısı' : 'Order Count',
    totalSpend: isTr ? 'Toplam Harcama' : 'Total Spending',
    zReport: isTr ? 'Kasa Z Raporu' : 'Cash Z Report',
    print: isTr ? 'Yazdır' : 'Print',
    totalOrders: isTr ? 'Toplam Sipariş' : 'Total Orders',
    successfulOrders: isTr ? 'Başarılı Sipariş' : 'Successful Orders',
    canceledOrders: isTr ? 'İptal Sipariş' : 'Canceled Orders',
    avgBasket: isTr ? 'Ortalama Sepet' : 'Average Basket',
    grossRevenue: isTr ? 'Brüt Ciro' : 'Gross Revenue',
    canceledAmount: isTr ? 'İptal Tutar' : 'Canceled Amount',
    netRevenue: isTr ? 'Net Ciro' : 'Net Revenue',
    hourlySales: isTr ? 'Saatlik Satis' : 'Hourly Sales',
    dailySales: isTr ? 'Gunluk Satis' : 'Daily Sales',
    topSellers: isTr ? 'En Çok Satanlar' : 'Top Sellers',
    orderWord: isTr ? 'sipariş' : 'orders',
    unitWord: isTr ? 'adet' : 'pcs',
    periodDaily: isTr ? 'Gunluk' : 'Daily',
    periodWeeklyShort: isTr ? 'Haftalik' : 'Weekly',
    periodMonthlyShort: isTr ? 'Aylik' : 'Monthly',
    printPopupBlocked: isTr
      ? 'Yazdirma penceresi engellendi. Lutfen popup engelini kapatip tekrar deneyin.'
      : 'Print window blocked. Please allow pop-ups and try again.',
    reportPeriod: isTr ? 'Donem' : 'Period',
    reportDate: isTr ? 'Rapor Tarihi' : 'Report Date',
    generatedAt: isTr ? 'Uretim' : 'Generated At',
    product: isTr ? 'Ürün' : 'Product',
    quantity: isTr ? 'Adet' : 'Quantity',
    revenue: isTr ? 'Ciro' : 'Revenue',
  };

  const zPeriodLabels: Record<'daily' | 'weekly' | 'monthly', string> = {
    daily: tx.periodDaily,
    weekly: tx.periodWeeklyShort,
    monthly: tx.periodMonthlyShort,
  };

  const periodLabelByKey: Record<'weekly' | 'monthly' | 'yearly', string> = {
    weekly: tx.periodWeekly,
    monthly: tx.periodMonthly,
    yearly: tx.periodYearly,
  };

  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [zPeriod, setZPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [zDate, setZDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', period],
    queryFn: () => adminReportService.get(period),
  });

  const { data: zReport, isLoading: isZLoading } = useQuery({
    queryKey: ['admin-z-report', zDate, zPeriod],
    queryFn: () => adminReportService.getZ(zDate, zPeriod),
  });

  const handlePrintZReport = () => {
    if (!zReport) return;

    const rows = zReport.topProducts
      .map(
        (p, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(p.name)}</td>
            <td>${p.quantity}</td>
            <td>${formatPrice(p.revenue)}</td>
          </tr>
        `,
      )
      .join('');

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${tx.zReport} - ${zPeriodLabels[zPeriod]}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h1 { margin: 0 0 6px; }
            .muted { color: #555; font-size: 12px; margin-bottom: 20px; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 24px; margin-bottom: 16px; }
            .k { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
            th { text-align: left; background: #f6f6f6; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <h1>${tx.zReport}</h1>
          <div class="muted">${tx.reportPeriod}: ${zPeriodLabels[zPeriod]} | ${tx.reportDate}: ${escapeHtml(zReport.reportDate)} | ${tx.generatedAt}: ${new Date(zReport.generatedAt).toLocaleString(locale)}</div>
          <div class="grid">
            <div><span class="k">${tx.totalOrders}:</span> ${zReport.totalOrders}</div>
            <div><span class="k">${tx.successfulOrders}:</span> ${zReport.successfulOrders}</div>
            <div><span class="k">${tx.canceledOrders}:</span> ${zReport.canceledOrders}</div>
            <div><span class="k">${tx.grossRevenue}:</span> ${formatPrice(zReport.grossRevenue, 'TRY', locale)}</div>
            <div><span class="k">${tx.canceledAmount}:</span> ${formatPrice(zReport.canceledRevenue, 'TRY', locale)}</div>
            <div><span class="k">${tx.netRevenue}:</span> ${formatPrice(zReport.netRevenue, 'TRY', locale)}</div>
          </div>
          <h3>${tx.topProducts}</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>${tx.product}</th>
                <th>${tx.quantity}</th>
                <th>${tx.revenue}</th>
              </tr>
            </thead>
            <tbody>
              ${rows || `<tr><td colspan="4">${tx.noData}</td></tr>`}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              setTimeout(function () {
                window.print();
              }, 120);
            };
          </script>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const printUrl = URL.createObjectURL(blob);
    const popup = window.open(printUrl, '_blank', 'width=960,height=800');

    if (!popup) {
      URL.revokeObjectURL(printUrl);
      alert(tx.printPopupBlocked);
      return;
    }

    popup.addEventListener('beforeunload', () => {
      URL.revokeObjectURL(printUrl);
    }, { once: true });
  };

  const byStatusData = data?.byStatus
    ? Object.entries(data.byStatus).map(([status, count]) => ({
        name: isTr
          ? ({
              PENDING: 'Bekliyor',
              PAID: 'Ödendi',
              PROCESSING: 'Hazırlanıyor',
              SHIPPED: 'Kargoda',
              DELIVERED: 'Teslim',
              CANCELED: 'İptal',
            } as Record<string, string>)[status] ?? status
          : tatusToEn(status),
        value: count as number,
        status,
      }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{tx.pageTitle}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{tx.pageSubtitle}</p>
        </div>
        <div className="flex flex-wrap gap-1 bg-muted rounded-lg p-1 w-full sm:w-fit">
          {PERIODS.map((p) => (
            <Button
              key={p.key}
              variant={period === p.key ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setPeriod(p.key)}
            >
              {periodLabelByKey[p.key]}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <p className="text-xs text-muted-foreground">{tx.totalRevenue}</p>
            </div>
            <p className="text-2xl font-bold">
              {isLoading ? '—' : formatPrice(data?.totalRevenue ?? 0, 'TRY', locale)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="h-4 w-4 text-blue-600" />
              <p className="text-xs text-muted-foreground">{tx.orderCount}</p>
            </div>
            <p className="text-2xl font-bold">{isLoading ? '—' : (data?.totalOrders ?? 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-violet-600" />
              <p className="text-xs text-muted-foreground">{tx.customerCount}</p>
            </div>
            <p className="text-2xl font-bold">{isLoading ? '—' : (data?.topCustomers?.length ?? 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-amber-600" />
              <p className="text-xs text-muted-foreground">{tx.avgOrder}</p>
            </div>
            <p className="text-2xl font-bold">
              {isLoading ? '—' : data?.totalOrders
                ? formatPrice((data.totalRevenue ?? 0) / data.totalOrders, 'TRY', locale)
                : formatPrice(0, 'TRY', locale)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" /> {tx.topProducts}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}
              </div>
            ) : !data?.topProducts?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">{tx.noData}</p>
            ) : (
              <div className="space-y-1">
                {data.topProducts.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-3 py-1.5">
                    <span className="w-5 text-xs text-muted-foreground font-mono">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.totalSold} {tx.soldUnit}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600">
                      {formatPrice(Number(p.revenue), 'TRY', locale)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Status Pie */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{tx.statusDistribution}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-48 bg-muted animate-pulse rounded" />
            ) : byStatusData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">{tx.noData}</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={byStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {byStatusData.map((entry, idx) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status] ?? CHART_COLORS[idx % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">{tx.bestCustomers}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">#</TableHead>
                <TableHead>{tx.customer}</TableHead>
                <TableHead>{tx.email}</TableHead>
                <TableHead className="text-right">{tx.orderCountCol}</TableHead>
                <TableHead className="text-right pr-4">{tx.totalSpend}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                    {tx.loading}
                  </TableCell>
                </TableRow>
              ) : !data?.topCustomers?.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                    {tx.noData}
                  </TableCell>
                </TableRow>
              ) : (
                data.topCustomers.map((c, idx) => (
                  <TableRow key={c.id}>
                    <TableCell className="pl-4 text-muted-foreground text-sm">{idx + 1}</TableCell>
                    <TableCell className="font-medium text-sm">{c.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.email}</TableCell>
                    <TableCell className="text-right text-sm">{c.orderCount}</TableCell>
                    <TableCell className="text-right pr-4 font-semibold text-emerald-600 text-sm">
                      {formatPrice(Number(c.totalSpent), 'TRY', locale)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-sm font-semibold">{tx.zReport}</CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={zPeriod}
                onChange={(e) => setZPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                {Z_PERIODS.map((p) => (
                  <option key={p.key} value={p.key}>{zPeriodLabels[p.key]}</option>
                ))}
              </select>
              <input
                type="date"
                value={zDate}
                onChange={(e) => setZDate(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              />
              <Button size="sm" variant="outline" onClick={handlePrintZReport} disabled={!zReport}>
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                {tx.print}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-md border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">{tx.totalOrders}</p>
              <p className="text-lg font-semibold mt-1">{isZLoading ? '—' : zReport?.totalOrders ?? 0}</p>
            </div>
            <div className="rounded-md border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">{tx.successfulOrders}</p>
              <p className="text-lg font-semibold mt-1">{isZLoading ? '—' : zReport?.successfulOrders ?? 0}</p>
            </div>
            <div className="rounded-md border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">{tx.canceledOrders}</p>
              <p className="text-lg font-semibold mt-1">{isZLoading ? '—' : zReport?.canceledOrders ?? 0}</p>
            </div>
            <div className="rounded-md border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">{tx.avgBasket}</p>
              <p className="text-lg font-semibold mt-1">{isZLoading ? '—' : formatPrice(zReport?.averageBasket ?? 0, 'TRY', locale)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-md border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">{tx.grossRevenue}</p>
              <p className="text-base font-semibold mt-1 text-emerald-600">
                {isZLoading ? '—' : formatPrice(zReport?.grossRevenue ?? 0, 'TRY', locale)}
              </p>
            </div>
            <div className="rounded-md border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">{tx.canceledAmount}</p>
              <p className="text-base font-semibold mt-1 text-rose-600">
                {isZLoading ? '—' : formatPrice(zReport?.canceledRevenue ?? 0, 'TRY', locale)}
              </p>
            </div>
            <div className="rounded-md border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">{tx.netRevenue}</p>
              <p className="text-base font-semibold mt-1 text-primary">
                {isZLoading ? '—' : formatPrice(zReport?.netRevenue ?? 0, 'TRY', locale)}
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="rounded-md border border-border/60 p-3">
              <p className="text-xs font-semibold mb-2">{zPeriod === 'daily' ? tx.hourlySales : tx.dailySales}</p>
              {!zReport?.hourlySales?.length ? (
                <p className="text-xs text-muted-foreground">{tx.noData}</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-auto">
                  {zReport.hourlySales.map((hour) => (
                    <div key={hour.hour} className="flex items-center justify-between text-xs">
                      <span>{hour.hour}</span>
                      <span className="text-muted-foreground">{hour.orderCount} {tx.orderWord}</span>
                      <span className="font-medium">{formatPrice(hour.total, 'TRY', locale)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-md border border-border/60 p-3">
              <p className="text-xs font-semibold mb-2">{tx.topSellers}</p>
              {!zReport?.topProducts?.length ? (
                <p className="text-xs text-muted-foreground">{tx.noData}</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-auto">
                  {zReport.topProducts.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between text-xs gap-2">
                      <span className="text-muted-foreground w-4">{index + 1}</span>
                      <span className="flex-1 truncate">{item.name}</span>
                      <span className="text-muted-foreground">{item.quantity} {tx.unitWord}</span>
                      <span className="font-medium">{formatPrice(item.revenue, 'TRY', locale)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function tatusToEn(status: string): string {
  if (status === 'PENDING') return 'Pending';
  if (status === 'PAID') return 'Paid';
  if (status === 'PROCESSING') return 'Processing';
  if (status === 'SHIPPED') return 'Shipped';
  if (status === 'DELIVERED') return 'Delivered';
  if (status === 'CANCELED') return 'Canceled';
  return status;
}
