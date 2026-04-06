'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, Tag, ToggleLeft, ToggleRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { adminCouponService } from '@/services/dashboard.service';
import { AdminCoupon, CreateCouponPayload } from '@/types/admin';
import { formatPrice } from '@/lib/utils';

const couponSchema = z.object({
  code: z.string().min(3, 'Kod en az 3 karakter olmalı').max(30).toUpperCase(),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.number().positive('Değer pozitif olmalı'),
  minOrder: z.number().min(0).optional(),
  maxUses: z.number().int().positive().optional(),
  isActive: z.boolean(),
  expiresAt: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
});
type CouponForm = z.infer<typeof couponSchema>;

export default function CouponsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<AdminCoupon | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: adminCouponService.getAll,
  });

  const form = useForm<CouponForm>({
    resolver: zodResolver(couponSchema),
    defaultValues: { code: '', type: 'PERCENTAGE', value: 10, isActive: true },
  });

  const createMut = useMutation({
    mutationFn: (p: CreateCouponPayload) => adminCouponService.create(p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-coupons'] }); toast.success('Kupon oluşturuldu'); closeDialog(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Hata oluştu'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateCouponPayload> }) =>
      adminCouponService.update(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-coupons'] }); toast.success('Kupon güncellendi'); closeDialog(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Hata oluştu'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminCouponService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-coupons'] }); toast.success('Kupon silindi'); setDeleteId(null); },
    onError: () => toast.error('Silinemedi'),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminCouponService.update(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });

  function openCreate() {
    setEditItem(null);
    form.reset({ code: '', type: 'PERCENTAGE', value: 10, isActive: true });
    setDialogOpen(true);
  }

  function openEdit(c: AdminCoupon) {
    setEditItem(c);
    form.reset({
      code: c.code,
      type: c.type,
      value: Number(c.value),
      minOrder: c.minOrder ? Number(c.minOrder) : undefined,
      maxUses: c.maxUses ?? undefined,
      isActive: c.isActive,
      expiresAt: c.expiresAt ? c.expiresAt.substring(0, 10) : '',
      description: c.description ?? '',
    });
    setDialogOpen(true);
  }

  function closeDialog() { setDialogOpen(false); setEditItem(null); }

  function onSubmit(v: CouponForm) {
    const payload: CreateCouponPayload = {
      code: v.code,
      type: v.type,
      value: v.value,
      minOrder: v.minOrder !== undefined ? Number(v.minOrder) : undefined,
      maxUses: v.maxUses !== undefined ? Number(v.maxUses) : undefined,
      isActive: v.isActive,
      expiresAt: v.expiresAt || undefined,
      description: v.description || undefined,
    };
    if (editItem) {
      updateMut.mutate({ id: editItem.id, payload });
    } else {
      createMut.mutate(payload);
    }
  }

  const filtered = coupons.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    (c.description ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const isExpired = (c: AdminCoupon) => c.expiresAt ? new Date(c.expiresAt) < new Date() : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Kupon Kodları</h1>
          <p className="text-sm text-muted-foreground mt-0.5">İndirim kuponlarını yönetin</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1.5" />
          Yeni Kupon
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Kupon', value: coupons.length },
          { label: 'Aktif', value: coupons.filter((c) => c.isActive && !isExpired(c)).length },
          { label: 'Pasif/Süresi Dolmuş', value: coupons.filter((c) => !c.isActive || isExpired(c)).length },
          { label: 'Toplam Kullanım', value: coupons.reduce((s, c) => s + c.usedCount, 0) },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Kupon ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-8 text-sm"
        />
      </div>

      {/* Table */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Tüm Kuponlar ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Yükleniyor...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <Tag className="h-8 w-8 mx-auto mb-2 opacity-30" />
              Kupon bulunamadı
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground text-xs">Kod</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-xs">Tür / Değer</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-xs">Min. Sipariş</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-xs">Kullanım</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-xs">Son Tarih</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-xs">Durum</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-xs text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filtered.map((c) => {
                    const expired = isExpired(c);
                    return (
                      <tr key={c.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div>
                            <code className="font-mono font-bold text-primary text-sm">{c.code}</code>
                            {c.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="text-xs">
                            {c.type === 'PERCENTAGE'
                              ? `%${Number(c.value)} indirim`
                              : `${formatPrice(Number(c.value))} indirim`}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {c.minOrder ? formatPrice(Number(c.minOrder)) : '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ''}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {c.expiresAt ? (
                            <span className={expired ? 'text-red-500' : ''}>
                              {format(new Date(c.expiresAt), 'dd.MM.yyyy')}
                              {expired && ' (Doldu)'}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleActive.mutate({ id: c.id, isActive: !c.isActive })}
                            className="flex items-center gap-1.5"
                          >
                            {c.isActive && !expired ? (
                              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Aktif</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Pasif</Badge>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-600"
                              onClick={() => setDeleteId(c.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Kupon Düzenle' : 'Yeni Kupon'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Kupon Kodu</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="YAZA20" className="uppercase font-mono" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tür</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">Yüzde (%)</SelectItem>
                          <SelectItem value="FIXED">Sabit Tutar (₺)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Değer</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="10" onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min. Sipariş (₺)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="Opsiyonel" onChange={(e) => field.onChange(isNaN(e.target.valueAsNumber) ? undefined : e.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxUses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maks. Kullanım</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="Sınırsız" onChange={(e) => field.onChange(isNaN(e.target.valueAsNumber) ? undefined : e.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Son Kullanım Tarihi</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Açıklama (opsiyonel)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Örn: Yaz kampanyası" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="col-span-2 flex items-center justify-between rounded-md border border-border/60 p-3">
                      <FormLabel className="text-sm font-normal">Aktif</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>İptal</Button>
                <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
                  {editItem ? 'Güncelle' : 'Oluştur'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Kuponu Sil"
        description="Bu kuponu silmek istediğinizden emin misiniz?"
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
