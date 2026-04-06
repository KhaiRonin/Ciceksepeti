'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, MoreHorizontal, Tag, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { DataTable } from '@/components/admin/DataTable';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { adminCategoryService } from '@/services/dashboard.service';
import { AdminCategory } from '@/types/admin';
import { formatDate, getSafeImageUrl, publicUploadSrc } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(2, 'En az 2 karakter'),
  imageUrl: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<AdminCategory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: adminCategoryService.getAll,
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const createMutation = useMutation({
    mutationFn: (v: FormValues) => adminCategoryService.create({ name: v.name, imageUrl: v.imageUrl || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      closeDialog();
      toast.success('Kategori başarıyla eklendi');
    },
    onError: () => toast.error('Kategori eklenirken bir hata oluştu'),
  });

  const updateMutation = useMutation({
    mutationFn: (v: FormValues) => adminCategoryService.update(editCategory!.id, { name: v.name, imageUrl: v.imageUrl || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      closeDialog();
      toast.success('Kategori güncellendi');
    },
    onError: () => toast.error('Kategori güncellenemedi'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminCategoryService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      setDeleteId(null);
      toast.success('Kategori silindi');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Kategori silinemedi'),
  });

  function openCreate() {
    setEditCategory(null);
    reset({ name: '', imageUrl: '' });
    setDialogOpen(true);
  }

  function openEdit(cat: AdminCategory) {
    setEditCategory(cat);
    reset({ name: cat.name, imageUrl: cat.imageUrl ?? '' });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditCategory(null);
  }

  async function onSubmit(values: FormValues) {
    if (editCategory) await updateMutation.mutateAsync(values);
    else await createMutation.mutateAsync(values);
  }

  const columns: ColumnDef<AdminCategory>[] = [
    {
      accessorKey: 'name',
      header: 'Kategori',
      cell: ({ row }) => {
        const c = row.original;
        const imageSrc = publicUploadSrc(getSafeImageUrl(c.imageUrl));
        return (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md overflow-hidden bg-muted flex items-center justify-center shrink-0">
              {imageSrc ? (
                <img src={imageSrc} alt={c.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
            <p className="font-medium text-sm">{c.name}</p>
          </div>
        );
      },
    },
    {
      accessorKey: '_count',
      header: 'Ürün Sayısı',
      cell: ({ row }) => (
        <span className="text-sm">{row.original._count?.products ?? 0} ürün</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Oluşturulma',
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.createdAt)}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => openEdit(c)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" /> Düzenle
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(c.id)}>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Kategoriler</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{categories.length} kategori</p>
        </div>
        <Button size="sm" className="gap-1.5 h-8" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Yeni Kategori
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={categories}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Kategori ara..."
        emptyMessage="Kategori bulunamadı"
        emptyDescription="İlk kategorinizi ekleyerek başlayın."
      />

      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) closeDialog(); else setDialogOpen(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}</DialogTitle>
            <DialogDescription>Kategori bilgilerini doldurun</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
            <div className="space-y-1.5">
              <Label>Kategori Görseli</Label>
              <ImageUploader
                value={watch('imageUrl')}
                onChange={(url) => setValue('imageUrl', url, { shouldDirty: true })}
                onUpload={adminCategoryService.uploadImage}
              />
              <p className="text-[10px] text-muted-foreground">Sürükle-bırak yapın veya tıklayarak görsel yükleyin</p>
            </div>
            <div className="space-y-1.5">
              <Label>Kategori Adı <span className="text-destructive">*</span></Label>
              <Input {...register('name')} placeholder="Buketler" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeDialog}>İptal</Button>
              <Button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                {(isSubmitting || createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editCategory ? 'Güncelle' : 'Ekle'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Kategoriyi sil"
        description="Bu kategoriyi silmek istediğinize emin misiniz? İçindeki ürünler kategorisiz kalır."
        confirmLabel="Sil"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}
