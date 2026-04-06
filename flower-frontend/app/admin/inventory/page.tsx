'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Save, Search, AlertTriangle, Package, ArrowUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminProductService } from '@/services/dashboard.service';
import { AdminProduct } from '@/types/admin';
import { formatPrice, getSafeImageUrl, publicUploadSrc, shouldBypassImageOptimization } from '@/lib/utils';
import Image from 'next/image';

export default function InventoryPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<'stock-asc' | 'stock-desc' | 'name'>('stock-asc');

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['admin-products-inventory'],
    queryFn: () => adminProductService.getAll({ limit: 500 }),
  });

  const products = productsData?.data ?? [];

  async function saveStock(p: AdminProduct) {
    const newStock = parseInt(edits[p.id] ?? String(p.stock));
    if (isNaN(newStock) || newStock < 0) {
      toast.error('Geçerli bir stok değeri girin');
      return;
    }
    setSaving((prev) => ({ ...prev, [p.id]: true }));
    try {
      await adminProductService.update(p.id, { stock: newStock });
      qc.invalidateQueries({ queryKey: ['admin-products-inventory'] });
      setEdits((prev) => { const n = { ...prev }; delete n[p.id]; return n; });
      toast.success(`${p.name} stoku güncellendi`);
    } catch {
      toast.error('Güncelleme başarısız');
    } finally {
      setSaving((prev) => { const n = { ...prev }; delete n[p.id]; return n; });
    }
  }

  const filtered = products
    .filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category?.name ?? '').toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === 'stock-asc') return a.stock - b.stock;
      if (sortBy === 'stock-desc') return b.stock - a.stock;
      return a.name.localeCompare(b.name);
    });

  const lowStock = products.filter((p) => p.stock <= 5 && p.stock > 0).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;

  function getStockBadge(stock: number) {
    if (stock === 0) return <Badge variant="destructive" className="text-xs">Tükenmiş</Badge>;
    if (stock <= 5) return <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Düşük</Badge>;
    return <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Yeterli</Badge>;
  }

  function getImageSrc(product: AdminProduct): string | undefined {
    const raw = (Array.isArray(product.images) ? product.images[0] : '') || '';
    if (!raw) return undefined;
    return publicUploadSrc(getSafeImageUrl(raw));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Stok Yönetimi</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Ürün stoklarını toplu olarak güncelleyin</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Toplam Ürün</p>
            <p className="text-2xl font-bold mt-1">{products.length}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <p className="text-xs text-muted-foreground">Düşük Stok (≤5)</p>
            </div>
            <p className="text-2xl font-bold mt-1 text-amber-600">{lowStock}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Tükenmiş</p>
            <p className="text-2xl font-bold mt-1 text-red-600">{outOfStock}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative w-full sm:flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ürün ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <ArrowUpDown className="h-4 w-4" />
          <span className="hidden sm:inline">Sırala:</span>
          {(['stock-asc', 'stock-desc', 'name'] as const).map((s) => (
            <Button
              key={s}
              variant={sortBy === s ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSortBy(s)}
            >
              {s === 'stock-asc' ? 'Stok ↑' : s === 'stock-desc' ? 'Stok ↓' : 'İsim'}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Stok Listesi ({filtered.length} ürün)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Yükleniyor...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground text-xs">Ürün</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-xs">Kategori</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-xs">Fiyat</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-xs">Durum</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-xs w-32">Stok</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-xs text-right">Kaydet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filtered.map((p) => {
                    const currentVal = edits[p.id] ?? String(p.stock);
                    const isDirty = edits[p.id] !== undefined && edits[p.id] !== String(p.stock);
                    const imageSrc = getImageSrc(p);
                    return (
                      <tr key={p.id} className={`hover:bg-muted/30 ${isDirty ? 'bg-blue-50/50 dark:bg-blue-950/10' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {imageSrc ? (
                              <div className="relative h-9 w-9 shrink-0 rounded overflow-hidden bg-muted">
                                <Image
                                  src={imageSrc}
                                  alt={p.name}
                                  fill
                                  className="object-cover"
                                  unoptimized={shouldBypassImageOptimization(imageSrc)}
                                />
                              </div>
                            ) : (
                              <div className="h-9 w-9 shrink-0 rounded bg-muted flex items-center justify-center">
                                <Package className="h-4 w-4 text-muted-foreground/50" />
                              </div>
                            )}
                            <span className="font-medium truncate max-w-[200px]">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {p.category?.name ?? '—'}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {formatPrice(parseFloat(p.price))}
                        </td>
                        <td className="px-4 py-3">
                          {getStockBadge(p.stock)}
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            min={0}
                            value={currentVal}
                            onChange={(e) =>
                              setEdits((prev) => ({ ...prev, [p.id]: e.target.value }))
                            }
                            className="h-8 w-24 text-sm"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isDirty && (
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              disabled={saving[p.id]}
                              onClick={() => saveStock(p)}
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Kaydet
                            </Button>
                          )}
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
    </div>
  );
}
