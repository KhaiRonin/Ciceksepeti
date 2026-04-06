'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Package, MapPin, Clock,
  CheckCircle2, Truck, XCircle, Loader2,
  Printer, Copy,
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import { adminOrderService } from '@/services/dashboard.service';
import { OrderStatus } from '@/types/admin';
import { handoffNote } from '@/lib/note-handoff';
import {
  formatPrice,
  formatDate,
  formatCalendarDate,
  getDeliveryRegionLabel,
  getSafeImageUrl,
  publicUploadSrc,
  shouldBypassImageOptimization,
} from '@/lib/utils';
import { useI18n } from '@/lib/i18n/context';

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { locale, t } = useI18n();
  const isTr = locale === 'tr';

  const ORDER_STATUSES: { value: OrderStatus; label: string; icon: React.ElementType }[] = [
    { value: 'PENDING', label: t('status.PENDING'), icon: Clock },
    { value: 'PAID', label: t('status.PAID'), icon: CheckCircle2 },
    { value: 'PROCESSING', label: t('status.PROCESSING'), icon: Package },
    { value: 'SHIPPED', label: t('status.SHIPPED'), icon: Truck },
    { value: 'DELIVERED', label: t('status.DELIVERED'), icon: CheckCircle2 },
    { value: 'CANCELED', label: t('status.CANCELED'), icon: XCircle },
  ];

  const tx = {
    orderStatusUpdated: isTr ? 'Sipariş durumu güncellendi' : 'Order status updated',
    updateFailed: isTr ? 'Güncelleme başarısız' : 'Update failed',
    printBlocked: isTr ? 'Yazdırma penceresi açılamadı' : 'Print window could not be opened',
    noNote: isTr ? 'Bu siparişte aktarılacak not bulunamadı' : 'No note found to transfer',
    noteTransferFailed: isTr ? 'Not aktarımı başarısız oldu' : 'Note transfer failed',
    noteProtocol: isTr
      ? 'Not aktarım denemesi yapıldı (protokol tetiklendi).'
      : 'Note transfer attempted (protocol triggered).',
    noteClipboard: isTr
      ? 'Not panoya kopyalandı. Uygulamaya manuel yapıştırabilirsiniz.'
      : 'Note copied to clipboard. You can paste it manually into the app.',
    noteStored: isTr
      ? 'Not kaydedildi. Uygulamaya manuel yapıştırabilirsiniz.'
      : 'Note saved. You can paste it manually into the app.',
    orderNotFound: isTr ? 'Sipariş bulunamadı' : 'Order not found',
    goBack: isTr ? 'Geri Dön' : 'Go Back',
    printInvoice: isTr ? 'Fatura Bas' : 'Print Invoice',
    deliveryRegion: isTr ? 'Teslim Bölgesi' : 'Delivery Region',
    deliveryDate: isTr ? 'Teslim Günü' : 'Delivery Date',
    deliveryTime: isTr ? 'Teslim Saati' : 'Delivery Time',
    orderNote: isTr ? 'Sipariş Notu' : 'Order Note',
    sendToApp: isTr ? 'Uygulamaya Gönder' : 'Send to App',
    customerInfo: isTr ? 'Müşteri Bilgileri' : 'Customer Information',
    orderStatus: isTr ? 'Sipariş Durumu' : 'Order Status',
    quantityUnit: isTr ? 'adet' : 'pcs',
    statusUpdating: isTr ? 'Güncelleniyor...' : 'Updating...',
    selectStatus: isTr ? 'Durum seçin' : 'Select status',
    invoiceDocTitle: isTr ? 'Fatura' : 'Invoice',
    invoiceDocSub: isTr ? 'Fatura / Sipariş Dökümü' : 'Invoice / Order Summary',
    invoiceNo: isTr ? 'Fatura No' : 'Invoice No',
    dateLabel: isTr ? 'Tarih' : 'Date',
    customerLabel: isTr ? 'Müşteri' : 'Customer',
    deliveryLabel: isTr ? 'Teslimat' : 'Delivery',
    phoneLabel: isTr ? 'Telefon' : 'Phone',
    addressLabel: isTr ? 'Adres' : 'Address',
    productLabel: isTr ? 'Ürün' : 'Product',
    quantityLabel: isTr ? 'Adet' : 'Qty',
    unitPriceLabel: isTr ? 'Birim Fiyat' : 'Unit Price',
    lineTotalLabel: isTr ? 'Satır Toplamı' : 'Line Total',
  };

  const { data: order, isLoading } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => adminOrderService.getOne(id),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => adminOrderService.updateStatus(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-order', id] });
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success(tx.orderStatusUpdated);
    },
    onError: () => toast.error(tx.updateFailed),
  });

  const handlePrintInvoice = () => {
    if (!order) return;

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const popup = window.open('', '_blank', 'noopener,noreferrer,width=960,height=800');
    if (!popup) {
      toast.error(tx.printBlocked);
      return;
    }

    const noteBlock = order.giftNote?.trim()
      ? `<div class="panel"><strong>${tx.orderNote}:</strong><br />${escapeHtml(order.giftNote)}</div>`
      : '';

    const rows = order.items
      .map(
        (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.product?.name ?? item.productId)}</td>
            <td>${item.quantity}</td>
            <td>${formatPrice(parseFloat(item.price))}</td>
            <td>${formatPrice(parseFloat(item.price) * item.quantity)}</td>
          </tr>
        `,
      )
      .join('');

    popup.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${tx.invoiceDocTitle} #${order.id.slice(-8).toUpperCase()}</title>
          <style>
            @page { size: A5 portrait; margin: 10mm; }
            * { box-sizing: border-box; }
            html, body { width: 100%; }
            body { font-family: Arial, sans-serif; margin: 0; color: #111; font-size: 12px; }
            .top { display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px; }
            .brand { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
            .muted { color: #666; font-size: 12px; }
            .panel { border: 1px solid #ddd; border-radius: 8px; padding: 8px 10px; margin-bottom: 8px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #ddd; padding: 6px; font-size: 11px; }
            th { background: #f6f6f6; text-align: left; }
            .right { text-align: right; }
            .total { margin-top: 8px; text-align: right; font-size: 14px; font-weight: bold; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="top">
            <div>
              <div class="brand">KibrisCicekSepetim</div>
              <div class="muted">${tx.invoiceDocSub}</div>
            </div>
            <div class="muted">
              ${tx.invoiceNo}: #${order.id.slice(-8).toUpperCase()}<br />
              ${tx.dateLabel}: ${new Date(order.createdAt).toLocaleString(locale)}
            </div>
          </div>

          <div class="panel grid">
            <div>
              <div><strong>${tx.customerLabel}:</strong> ${escapeHtml(order.user.name)}</div>
              <div><strong>${t('profile.email')}:</strong> ${escapeHtml(order.user.email)}</div>
            </div>
            <div>
              <div><strong>${tx.deliveryLabel}:</strong> ${escapeHtml(order.address.fullName)}</div>
              <div><strong>${tx.phoneLabel}:</strong> ${escapeHtml(order.address.phone)}</div>
              <div><strong>${tx.addressLabel}:</strong> ${escapeHtml(`${order.address.addressLine}, ${order.address.city} ${order.address.postalCode}, ${order.address.country}`)}</div>
            </div>
          </div>

          ${noteBlock}

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>${tx.productLabel}</th>
                <th>${tx.quantityLabel}</th>
                <th>${tx.unitPriceLabel}</th>
                <th>${tx.lineTotalLabel}</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <div class="total">${t('cart.total')}: ${formatPrice(parseFloat(order.totalPrice), 'TRY', locale)}</div>

          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    popup.document.close();
  };

  const handleSendNoteToDesktopApp = async () => {
    if (!order?.giftNote?.trim()) {
      toast.error(tx.noNote);
      return;
    }

    const result = await handoffNote(order.giftNote);

    if (!result.ok) {
      toast.error(tx.noteTransferFailed);
      return;
    }

    if (result.protocolTriggered) {
      toast.success(tx.noteProtocol);
    } else if (result.clipboardOk) {
      toast.success(tx.noteClipboard);
    } else {
      toast.success(tx.noteStored);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64 rounded-xl" />
          </div>
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">{tx.orderNotFound}</p>
        <Button variant="outline" onClick={() => router.back()}>{tx.goBack}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">
              {t('orders.orderNumber')} #{order.id.slice(-8).toUpperCase()}
            </h1>
            <AdminStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{formatDate(order.createdAt, locale)}</p>
        </div>
        </div>
        <Button variant="outline" size="sm" onClick={handlePrintInvoice}>
          <Printer className="h-3.5 w-3.5 mr-1.5" />
          {tx.printInvoice}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: items + address */}
        <div className="lg:col-span-2 space-y-5">
          {/* Order items */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Package className="h-4 w-4" />
                {t('orders.orderItems')} ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-muted shrink-0">
                      {publicUploadSrc(getSafeImageUrl(item.product?.images?.[0])) ? (
                        <Image
                          src={publicUploadSrc(getSafeImageUrl(item.product?.images?.[0])) as string}
                          alt={item.product?.name ?? 'Ürün'}
                          fill
                          unoptimized={shouldBypassImageOptimization(publicUploadSrc(getSafeImageUrl(item.product?.images?.[0])))}
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.product?.name ?? item.productId}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatPrice(parseFloat(item.price), 'TRY', locale)} × {item.quantity} {tx.quantityUnit}
                      </p>
                    </div>
                    <p className="font-semibold text-sm tabular-nums">
                      {formatPrice(parseFloat(item.price) * item.quantity, 'TRY', locale)}
                    </p>
                  </div>
                ))}
              </div>
              <Separator />
              {/* Order summary */}
              <div className="px-5 py-4 space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{t('cart.subtotal')}</span>
                  <span>{formatPrice(parseFloat(order.totalPrice), 'TRY', locale)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{t('cart.shipping')}</span>
                  <span className="text-emerald-600">{t('common.free')}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>{t('cart.total')}</span>
                  <span className="text-primary">{formatPrice(parseFloat(order.totalPrice), 'TRY', locale)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping address */}
          {order.address && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t('orders.deliveryAddress')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3 text-muted-foreground">
                <p className="font-medium text-foreground">{order.address.fullName}</p>
                <p>{order.address.phone}</p>
                <p>{order.address.addressLine}</p>
                <p>
                  {order.address.city}
                  {order.address.postalCode && ` ${order.address.postalCode}`}
                </p>
                <p>{order.address.country}</p>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-muted-foreground text-xs">{tx.deliveryRegion}</p>
                    <p className="font-medium text-foreground">{getDeliveryRegionLabel(order.deliveryRegion)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">{tx.deliveryDate}</p>
                    <p className="font-medium text-foreground">{formatCalendarDate(order.deliveryDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">{tx.deliveryTime}</p>
                    <p className="font-medium text-foreground">{order.deliveryTime || '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm font-semibold">{tx.orderNote}</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => void handleSendNoteToDesktopApp()}
                  disabled={!order.giftNote?.trim()}
                >
                  <Copy className="h-4 w-4" /> {tx.sendToApp}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">{tx.orderNote}</p>
                <p className="font-medium whitespace-pre-wrap break-words">{order.giftNote?.trim() || '—'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: customer + status */}
        <div className="space-y-5">
          {/* Customer */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">{tx.customerInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">{t('checkout.fullName')}</p>
                <p className="font-medium">{order.user.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t('profile.email')}</p>
                <p className="font-medium break-all">{order.user.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Status update */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">{tx.orderStatus}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <AdminStatusBadge status={order.status} />
              <Select
                value={order.status}
                onValueChange={(v) => statusMutation.mutate(v as OrderStatus)}
                disabled={statusMutation.isPending}
              >
                <SelectTrigger className="h-9 text-sm">
                  {statusMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {tx.statusUpdating}
                    </span>
                  ) : (
                    <SelectValue placeholder={tx.selectStatus} />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-sm">
                      <div className="flex items-center gap-2">
                        <s.icon className="h-3.5 w-3.5" />
                        {s.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
