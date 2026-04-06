'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PackageSearch, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import { adminReturnService } from '@/services/dashboard.service';
import { AdminReturn, ReturnStatus } from '@/types/admin';
import { formatDate, formatPrice } from '@/lib/utils';

const RETURN_STATUS_CONFIG: Record<ReturnStatus, { label: string; color: string }> = {
  PENDING: { label: 'Bekliyor', color: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'Onaylandı', color: 'bg-blue-100 text-blue-700' },
  REJECTED: { label: 'Reddedildi', color: 'bg-red-100 text-red-700' },
  COMPLETED: { label: 'Tamamlandı', color: 'bg-emerald-100 text-emerald-700' },
};

function ReturnBadge({ status }: { status: ReturnStatus }) {
  const cfg = RETURN_STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

export default function ReturnsPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<AdminReturn | null>(null);
  const [newStatus, setNewStatus] = useState<ReturnStatus>('PENDING');
  const [adminNote, setAdminNote] = useState('');

  const { data: returns = [], isLoading } = useQuery({
    queryKey: ['admin-returns'],
    queryFn: adminReturnService.getAll,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: ReturnStatus; note: string }) =>
      adminReturnService.updateStatus(id, status, note || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-returns'] });
      toast.success('İade durumu güncellendi');
      setSelected(null);
    },
    onError: () => toast.error('Güncelleme başarısız'),
  });

  function openDetail(r: AdminReturn) {
    setSelected(r);
    setNewStatus(r.status);
    setAdminNote(r.adminNote ?? '');
  }

  const byStatus = Object.keys(RETURN_STATUS_CONFIG).reduce(
    (acc, k) => {
      acc[k] = returns.filter((r) => r.status === k).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">İade Talepleri</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Müşteri iade taleplerini yönetin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(RETURN_STATUS_CONFIG).map(([k, v]) => (
          <Card key={k} className="border-border/60">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{v.label}</p>
              <p className="text-2xl font-bold mt-1">{byStatus[k] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Tüm İadeler ({returns.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Yükleniyor...</div>
          ) : returns.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <PackageSearch className="h-8 w-8 mx-auto mb-2 opacity-30" />
              İade talebi bulunamadı
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground text-xs">Müşteri</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-xs">Sipariş</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-xs">Sebep</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-xs">Durum</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-xs">Tarih</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-xs text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {returns.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{r.user.name}</p>
                          <p className="text-xs text-muted-foreground">{r.user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-mono text-xs text-muted-foreground">#{r.orderId.substring(0, 8)}</p>
                          <p className="text-xs">{formatPrice(parseFloat(r.order.totalPrice))}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-sm text-muted-foreground truncate">{r.reason}</p>
                      </td>
                      <td className="px-4 py-3">
                        <ReturnBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(r.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openDetail(r)}>
                          İncele
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>İade Talebi Detayı</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Müşteri</span>
                  <span className="font-medium">{selected.user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sipariş No</span>
                  <span className="font-mono text-xs">#{selected.orderId.substring(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sipariş Tutarı</span>
                  <span>{formatPrice(parseFloat(selected.order.totalPrice))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Talep Tarihi</span>
                  <span>{formatDate(selected.createdAt)}</span>
                </div>
              </div>

              <div className="rounded-md bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">İade Sebebi</p>
                <p className="text-sm">{selected.reason}</p>
              </div>

              <div className="space-y-2">
                <Label>Durum Güncelle</Label>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as ReturnStatus)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Bekliyor</SelectItem>
                    <SelectItem value="APPROVED">Onayla</SelectItem>
                    <SelectItem value="REJECTED">Reddet</SelectItem>
                    <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Admin Notu (opsiyonel)</Label>
                <Textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Müşteriye iletilecek not..."
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>İptal</Button>
            <Button
              disabled={updateMut.isPending}
              onClick={() =>
                selected &&
                updateMut.mutate({ id: selected.id, status: newStatus, note: adminNote })
              }
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
