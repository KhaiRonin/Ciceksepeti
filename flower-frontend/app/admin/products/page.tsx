'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Plus, Pencil, Trash2, MoreHorizontal,
  Package, Loader2, Languages,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import { DataTable } from '@/components/admin/DataTable';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { ImageUploader } from '@/components/admin/ImageUploader';

import { adminProductService, adminCategoryService, adminCatalogService } from '@/services/dashboard.service';
import { AdminProduct } from '@/types/admin';
import { formatPrice, formatDate } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

// ─── Zod schema ──────────────────────────────────────────────────────────────
const schema = z.object({
  name: z.string().min(2, 'En az 2 karakter'),
  description: z.string(),
  price: z.string().min(1, 'Zorunlu').refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Geçerli fiyat girin'),
  stock: z.string().min(1, 'Zorunlu').refine((v) => !isNaN(parseInt(v)) && parseInt(v) >= 0, 'Geçerli stok girin'),
  categoryId: z.string().min(1, 'Kategori seçin'),
  imageUrl: z.string().optional(),
  discountPercent: z.string().optional().refine((v) => !v || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0 && parseFloat(v) <= 100), '0-100 arası indirim oranı girin'),
  discountDays: z.string().optional().refine((v) => !v || (!isNaN(parseInt(v)) && parseInt(v) >= 0), 'Geçerli gün girin'),
  clearDiscount: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api').replace(/\/api\/?$/, '');

function toProxyUrl(target: string): string {
  return `/api/image-proxy?url=${encodeURIComponent(target)}`;
}

function toNumberSafe(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) ? n : null;
  }
  if (value && typeof value === 'object' && 'toString' in value) {
    const n = Number.parseFloat(String(value));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function getImageSrc(product: AdminProduct): string | null {
  const legacyImage = (product as unknown as { imageUrl?: string }).imageUrl;
  const firstArrayImage = Array.isArray(product.images) ? product.images[0] : undefined;
  const raw = (firstArrayImage || legacyImage || '').trim();
  if (!raw) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return toProxyUrl(raw);
  if (raw.startsWith('/')) return toProxyUrl(`${API_ORIGIN}${raw}`);
  return toProxyUrl(raw);
}

function getCreatedAt(product: AdminProduct): string | null {
  const legacyCreatedAt = (product as unknown as { created_at?: string }).created_at;
  return product.createdAt ?? legacyCreatedAt ?? null;
}

function getDiscountInfo(product: AdminProduct) {
  const percent = toNumberSafe(product.discountPercent);
  const end = product.discountEndAt ? new Date(product.discountEndAt) : null;
  const start = product.discountStartAt ? new Date(product.discountStartAt) : null;
  const now = new Date();
  const isStarted = !start || start <= now;
  const isNotEnded = !!end && end > now;
  const isActive = (percent ?? 0) > 0 && isStarted && isNotEnded;

  let daysLeft = 0;
  if (isActive && end) {
    const diffMs = end.getTime() - now.getTime();
    daysLeft = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  return { percent: percent ?? 0, end, isActive, daysLeft };
}

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [discountedOnly, setDiscountedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<AdminProduct | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; name: string } | null>(null);

  // ─── Queries ──────────────────────────────────────────────────────────────────
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['admin-products', page, debouncedSearch, discountedOnly],
    queryFn: () => adminProductService.getAll({
      page,
      limit: 12,
      search: debouncedSearch,
      discounted: discountedOnly,
    }),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: adminCategoryService.getAll,
  });

  const products = productsData?.data ?? [];
  const meta = productsData?.meta;

  // ─── Form ────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  // ─── Mutations ───────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (values: FormValues) =>
      adminProductService.create({
        name: values.name,
        description: values.description,
        price: parseFloat(values.price),
        stock: parseInt(values.stock),
        categoryId: values.categoryId,
        images: values.imageUrl ? [values.imageUrl] : [],
        discountPercent: values.discountPercent ? parseFloat(values.discountPercent) : undefined,
        discountDays: values.discountDays ? parseInt(values.discountDays) : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      closeDialog();
      toast.success('Ürün başarıyla eklendi');
    },
    onError: () => toast.error('Ürün eklenirken hata oluştu'),
  });

  const updateMutation = useMutation({
    mutationFn: (values: FormValues) =>
      adminProductService.update(editProduct!.id, {
        name: values.name,
        description: values.description,
        price: parseFloat(values.price),
        stock: parseInt(values.stock),
        categoryId: values.categoryId,
        images: values.imageUrl ? [values.imageUrl] : [],
        discountPercent: values.clearDiscount ? 0 : (values.discountPercent ? parseFloat(values.discountPercent) : undefined),
        discountDays: values.clearDiscount ? 0 : (values.discountDays ? parseInt(values.discountDays) : undefined),
        clearDiscount: !!values.clearDiscount,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      closeDialog();
      toast.success('Ürün güncellendi');
    },
    onError: () => toast.error('Güncelleme başarısız'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminProductService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      setDeleteId(null);
      toast.success('Ürün silindi');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Silme işlemi başarısız'),
  });

  const syncCatalogTranslationsMutation = useMutation({
    mutationFn: () => adminCatalogService.syncTranslations(),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success(
        `Çeviriler senkronlandı: ${result.updated.products} ürün, ${result.updated.categories} kategori güncellendi.`,
      );
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? 'Çeviri senkronu sırasında hata oluştu');
    },
  });

  // ─── Helpers ─────────────────────────────────────────────────────────────
  function openCreate() {
    setEditProduct(null);
    reset({ clearDiscount: false });
    setDialogOpen(true);
  }

  function openEdit(product: AdminProduct) {
    setEditProduct(product);
    reset({
      name: product.name,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      categoryId: product.categoryId,
      imageUrl: (product.images ?? [])[0] ?? '',
      discountPercent: product.discountPercent ?? '',
      discountDays: '',
      clearDiscount: false,
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditProduct(null);
    reset({});
  }

  async function onSubmit(values: FormValues) {
    if (editProduct) {
      await updateMutation.mutateAsync(values);
    } else {
      await createMutation.mutateAsync(values);
    }
  }

  // ─── Columns ─────────────────────────────────────────────────────────────
  const columns: ColumnDef<AdminProduct>[] = [
    {
      accessorKey: 'name',
      header: 'Ürün',
      cell: ({ row }) => {
        const p = row.original;
        const src = getImageSrc(p);
        return (
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-lg overflow-hidden shrink-0 bg-muted">
              {src ? (
                <button
                  type="button"
                  onClick={() => setPreviewImage({ src, name: p.name })}
                  className="h-full w-full cursor-zoom-in"
                  title="Büyüt"
                >
                  <img
                    src={src}
                    alt={p.name}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                </button>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Package className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-sm">{p.name}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{p.category?.name}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'price',
      header: 'Fiyat',
      cell: ({ row }) => {
        const p = row.original;
        const discount = getDiscountInfo(p);
        const numericPrice = toNumberSafe((p as unknown as { price?: unknown; unitPrice?: unknown; totalPrice?: unknown }).price
          ?? (p as unknown as { unitPrice?: unknown }).unitPrice
          ?? (p as unknown as { totalPrice?: unknown }).totalPrice);
        const discountedPrice = numericPrice !== null
          ? Number((numericPrice * (1 - discount.percent / 100)).toFixed(2))
          : null;
        return (
          <div>
            {discount.isActive && numericPrice !== null && discountedPrice !== null ? (
              <>
                <p className="font-semibold text-sm">{formatPrice(discountedPrice)}</p>
                <p className="text-xs text-muted-foreground line-through">{formatPrice(numericPrice)}</p>
              </>
            ) : (
              <p className="font-semibold text-sm">{numericPrice !== null ? formatPrice(numericPrice) : '—'}</p>
            )}
          </div>
        );
      },
    },
    {
      id: 'discount',
      header: 'İndirim',
      cell: ({ row }) => {
        const discount = getDiscountInfo(row.original);
        if (!discount.isActive) {
          return <span className="text-xs text-muted-foreground">Yok</span>;
        }

        return (
          <div className="text-xs">
            <p className="font-semibold text-emerald-600">%{discount.percent}</p>
            <p className="text-muted-foreground">Bitiş: {formatDate(discount.end?.toISOString() ?? null)}</p>
            <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
              {discount.daysLeft} gün kaldı
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'stock',
      header: 'Stok',
      cell: ({ row }) => {
        const s = row.original.stock;
        return (
          <span
            className={`text-sm font-medium ${
              s === 0 ? 'text-destructive' : s < 5 ? 'text-amber-600' : 'text-foreground'
            }`}
          >
            {s === 0 ? 'Tükendi' : `${s} adet`}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Eklenme',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{formatDate(getCreatedAt(row.original))}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => openEdit(p)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" /> Düzenle
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteId(p.id)}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Sil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Ürünler</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {meta?.total ?? products.length} ürün yönetiliyor
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => syncCatalogTranslationsMutation.mutate()}
            disabled={syncCatalogTranslationsMutation.isPending}
          >
            {syncCatalogTranslationsMutation.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Languages className="mr-1.5 h-4 w-4" />
            )}
            Çevirileri Senkronla
          </Button>
          <Button
            type="button"
            size="sm"
            variant={discountedOnly ? 'default' : 'outline'}
            className="h-8"
            onClick={() => {
              setDiscountedOnly((prev) => !prev);
              setPage(1);
            }}
          >
            {discountedOnly ? 'İndirimli: Açık' : 'Sadece İndirimli'}
          </Button>
          <Button size="sm" className="gap-1.5 h-8" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Yeni Ürün
          </Button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Ürün ara..."
        pageSize={12}
        totalRows={meta?.total}
        page={page}
        onPageChange={setPage}
        externalSearch
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        emptyMessage="Ürün bulunamadı"
        emptyDescription="Yeni bir ürün ekleyerek başlayın."
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) closeDialog(); else setDialogOpen(v); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</DialogTitle>
            <DialogDescription>
              {editProduct ? `"${editProduct.name}" ürününü düzenliyorsunuz` : 'Yeni ürün bilgilerini doldurun'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-1">
            {/* Product Image */}
            <div className="space-y-1.5">
              <Label>Ürün Görseli</Label>
              <ImageUploader
                value={watch('imageUrl')}
                onChange={(url) => setValue('imageUrl', url, { shouldDirty: true })}
                onUpload={adminProductService.uploadImage}
              />
              <p className="text-[10px] text-muted-foreground">Sürükle-bırak yapın veya tıklayarak görsel yükleyin</p>
            </div>

            <Separator />

            {/* Name & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Ürün Adı <span className="text-destructive">*</span></Label>
                <Input {...register('name')} placeholder="Kırmızı Gül Buketi" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Kategori <span className="text-destructive">*</span></Label>
                <Select
                  defaultValue={editProduct?.categoryId ?? ''}
                  onValueChange={(v) => setValue('categoryId', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Açıklama <span className="text-destructive">*</span></Label>
              <Textarea {...register('description')} placeholder="Ürün hakkında detaylı bilgi..." rows={4} />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>

            {/* Price & Stock */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Fiyat (₺) <span className="text-destructive">*</span></Label>
                <Input type="number" step="0.01" placeholder="0.00" {...register('price')} />
                {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Stok <span className="text-destructive">*</span></Label>
                <Input type="number" placeholder="0" {...register('stock')} />
                {errors.stock && <p className="text-xs text-destructive">{errors.stock.message}</p>}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Süreli İndirim</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="clearDiscount"
                    checked={!!watch('clearDiscount')}
                    onCheckedChange={(checked) => setValue('clearDiscount', !!checked)}
                  />
                  <Label htmlFor="clearDiscount" className="text-xs text-muted-foreground">İndirimi kaldır</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>İndirim Oranı (%)</Label>
                  <Input type="number" step="0.01" placeholder="Örn: 20" {...register('discountPercent')} disabled={!!watch('clearDiscount')} />
                  {errors.discountPercent && <p className="text-xs text-destructive">{errors.discountPercent.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Kaç Gün Sürecek</Label>
                  <Input type="number" placeholder="Örn: 7" {...register('discountDays')} disabled={!!watch('clearDiscount')} />
                  {errors.discountDays && <p className="text-xs text-destructive">{errors.discountDays.message}</p>}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                İndirim süresi dolunca ürün otomatik olarak eski fiyatına döner.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={closeDialog}>
                İptal
              </Button>
              <Button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                {(isSubmitting || createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editProduct ? 'Güncelle' : 'Ekle'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Ürünü sil"
        description="Bu ürünü kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmLabel="Sil"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />

      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewImage?.name ?? 'Ürün Görseli'}</DialogTitle>
            <DialogDescription>Görsel önizlemesi</DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-hidden rounded-lg border border-border/60 bg-muted/30">
            {previewImage && (
              <img
                src={previewImage.src}
                alt={previewImage.name}
                className="h-full max-h-[70vh] w-full object-contain"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
