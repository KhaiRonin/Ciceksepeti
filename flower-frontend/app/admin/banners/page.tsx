'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ImageIcon, GripVertical, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';

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
import { Switch } from '@/components/ui/switch';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { adminBannerService } from '@/services/dashboard.service';
import { AdminBanner, CreateBannerPayload } from '@/types/admin';

const bannerSchema = z.object({
  title: z.string().min(2, 'Başlık en az 2 karakter olmalı'),
  imageUrl: z.string().url('Geçerli bir URL girin'),
  linkUrl: z.string().url().optional().or(z.literal('')),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
});
type BannerForm = z.infer<typeof bannerSchema>;

export default function BannersPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<AdminBanner | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: adminBannerService.getAll,
  });

  const form = useForm<BannerForm>({
    resolver: zodResolver(bannerSchema),
    defaultValues: { title: '', imageUrl: '', linkUrl: '', sortOrder: 0, isActive: true },
  });

  const createMut = useMutation({
    mutationFn: (p: CreateBannerPayload) => adminBannerService.create(p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-banners'] }); toast.success('Banner oluşturuldu'); closeDialog(); },
    onError: () => toast.error('Hata oluştu'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateBannerPayload> }) =>
      adminBannerService.update(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-banners'] }); toast.success('Banner güncellendi'); closeDialog(); },
    onError: () => toast.error('Hata oluştu'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminBannerService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-banners'] }); toast.success('Banner silindi'); setDeleteId(null); },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminBannerService.update(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-banners'] }),
  });

  function openCreate() {
    setEditItem(null);
    form.reset({ title: '', imageUrl: '', linkUrl: '', sortOrder: banners.length, isActive: true });
    setDialogOpen(true);
  }

  function openEdit(b: AdminBanner) {
    setEditItem(b);
    form.reset({
      title: b.title,
      imageUrl: b.imageUrl,
      linkUrl: b.linkUrl ?? '',
      sortOrder: b.sortOrder,
      isActive: b.isActive,
    });
    setDialogOpen(true);
  }

  function closeDialog() { setDialogOpen(false); setEditItem(null); }

  function onSubmit(v: BannerForm) {
    const payload: CreateBannerPayload = {
      title: v.title,
      imageUrl: v.imageUrl,
      linkUrl: v.linkUrl || undefined,
      sortOrder: v.sortOrder,
      isActive: v.isActive,
    };
    if (editItem) {
      updateMut.mutate({ id: editItem.id, payload });
    } else {
      createMut.mutate(payload);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Banner / Slider Yönetimi</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Ana sayfa bannerlarını düzenleyin</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1.5" />
          Yeni Banner
        </Button>
      </div>

      {/* Preview Info */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
        <CardContent className="p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Not:</strong> Aktif bannerlar ana sayfanın slider bölümünde sıra numarasına göre gösterilir. Görsel URL'si olarak doğrudan resim linki girin.
          </p>
        </CardContent>
      </Card>

      {/* Banner Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : banners.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="p-12 text-center">
            <ImageIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Henüz banner eklenmemiş</p>
            <Button size="sm" variant="outline" className="mt-4" onClick={openCreate}>
              İlk Bannerı Ekle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((b) => (
              <Card key={b.id} className={`border-border/60 overflow-hidden ${!b.isActive ? 'opacity-60' : ''}`}>
                <div className="relative aspect-video bg-muted">
                  <Image
                    src={b.imageUrl}
                    alt={b.title}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute top-2 left-2 flex gap-1">
                    <Badge variant="secondary" className="text-xs bg-black/60 text-white border-0">
                      #{b.sortOrder + 1}
                    </Badge>
                    <Badge
                      className={`text-xs border-0 ${b.isActive ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'}`}
                    >
                      {b.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="font-medium text-sm truncate">{b.title}</p>
                  {b.linkUrl && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{b.linkUrl}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <button
                      onClick={() => toggleMut.mutate({ id: b.id, isActive: !b.isActive })}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {b.isActive ? (
                        <><Eye className="h-3.5 w-3.5" />Gizle</>
                      ) : (
                        <><EyeOff className="h-3.5 w-3.5" />Göster</>
                      )}
                    </button>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(b)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-600"
                        onClick={() => setDeleteId(b.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Banner Düzenle' : 'Yeni Banner'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Başlık</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Banner başlığı" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Görsel URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://example.com/banner.jpg" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="linkUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link URL (opsiyonel)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://example.com/kampanya" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sıra</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min={0} placeholder="0" onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border border-border/60 p-3">
                    <FormLabel className="text-sm font-normal">Aktif</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
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
        title="Bannerı Sil"
        description="Bu bannerı silmek istediğinizden emin misiniz?"
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
