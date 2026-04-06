'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Truck, MapPin, Package, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const zoneSchema = z.object({
  name: z.string().min(1, 'Ad gerekli'),
  region: z.string().min(1, 'Bölge gerekli'),
  rate: z.number().min(0),
  freeThreshold: z.number().min(0),
  isActive: z.boolean(),
});

const generalSchema = z.object({
  defaultCarrier: z.string().min(1),
  freeShippingMin: z.number().min(0),
  flatRate: z.number().min(0),
  enableFreeShipping: z.boolean(),
  enableFlatRate: z.boolean(),
});

type Zone = z.infer<typeof zoneSchema> & { id: string };
type GeneralForm = z.infer<typeof generalSchema>;

const INITIAL_ZONES: Zone[] = [
  { id: '1', name: 'Kıbrıs', region: 'Kuzey Kıbrıs', rate: 0, freeThreshold: 0, isActive: true },
  { id: '2', name: 'Kuzey Kıbrıs Uzak', region: 'Dipkarpaz, Karpaz', rate: 15, freeThreshold: 500, isActive: true },
  { id: '3', name: 'GK Kıbrıs', region: 'Güney Kıbrıs', rate: 50, freeThreshold: 1000, isActive: false },
];

export default function ShippingPage() {
  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [addingZone, setAddingZone] = useState(false);

  const generalForm = useForm<GeneralForm>({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      defaultCarrier: 'Kendi Kurye',
      freeShippingMin: 500,
      flatRate: 30,
      enableFreeShipping: true,
      enableFlatRate: true,
    },
  });

  const zoneForm = useForm<z.infer<typeof zoneSchema>>({
    resolver: zodResolver(zoneSchema),
    defaultValues: { name: '', region: '', rate: 0, freeThreshold: 0, isActive: true },
  });

  function saveGeneral(values: GeneralForm) {
    toast.success('Kargo ayarları kaydedildi');
  }

  function saveZone(values: z.infer<typeof zoneSchema>) {
    if (editingZone) {
      setZones((prev) => prev.map((z) => z.id === editingZone.id ? { ...values, id: editingZone.id } : z));
      toast.success('Bölge güncellendi');
    } else {
      setZones((prev) => [...prev, { ...values, id: crypto.randomUUID() }]);
      toast.success('Bölge eklendi');
    }
    setEditingZone(null);
    setAddingZone(false);
    zoneForm.reset();
  }

  function startEdit(zone: Zone) {
    setEditingZone(zone);
    setAddingZone(false);
    zoneForm.reset(zone);
  }

  function deleteZone(id: string) {
    setZones((prev) => prev.filter((z) => z.id !== id));
    toast.success('Bölge silindi');
  }

  function cancelZoneEdit() {
    setEditingZone(null);
    setAddingZone(false);
    zoneForm.reset();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Kargo Ayarları</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Teslimat bölgeleri ve ücretleri</p>
      </div>

      {/* General settings */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Truck className="h-4 w-4 text-blue-500" /> Genel Kargo Ayarları
          </CardTitle>
          <CardDescription className="text-xs">Varsayılan nakliye yöntemi ve ücretleri</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={generalForm.handleSubmit(saveGeneral)} className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Varsayılan Kargo Firması</Label>
              <Input {...generalForm.register('defaultCarrier')} className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Sabit Kargo Ücreti (₺)</Label>
              <Input {...generalForm.register('flatRate', { valueAsNumber: true })} type="number" min="0" step="0.01" className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ücretsiz Kargo Alt Limiti (₺)</Label>
              <Input {...generalForm.register('freeShippingMin', { valueAsNumber: true })} type="number" min="0" step="0.01" className="h-8 text-sm" />
            </div>
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Sabit Ücret Aktif</Label>
                <Switch
                  checked={generalForm.watch('enableFlatRate')}
                  onCheckedChange={(v) => generalForm.setValue('enableFlatRate', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Ücretsiz Kargo Aktif</Label>
                <Switch
                  checked={generalForm.watch('enableFreeShipping')}
                  onCheckedChange={(v) => generalForm.setValue('enableFreeShipping', v)}
                />
              </div>
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" size="sm" className="h-8 gap-1.5">
                <Save className="h-3.5 w-3.5" /> Kaydet
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Shipping Zones */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-500" /> Teslimat Bölgeleri
              </CardTitle>
              <CardDescription className="text-xs">Bölgeye göre kargo ücreti tanımları</CardDescription>
            </div>
            {!addingZone && !editingZone && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => { setAddingZone(true); setEditingZone(null); zoneForm.reset(); }}
              >
                + Bölge Ekle
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Zone form */}
          {(addingZone || editingZone) && (
            <form onSubmit={zoneForm.handleSubmit(saveZone)} className="bg-muted/40 rounded-lg p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {editingZone ? 'Bölgeyi Düzenle' : 'Yeni Bölge'}
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Bölge Adı</Label>
                  <Input {...zoneForm.register('name')} placeholder="örn. İstanbul" className="h-7 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">İlçe / Bölge Açıklaması</Label>
                  <Input {...zoneForm.register('region')} placeholder="örn. Anadolu yakası" className="h-7 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Kargo Ücreti (₺)</Label>
                  <Input {...zoneForm.register('rate', { valueAsNumber: true })} type="number" min="0" step="0.01" className="h-7 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Ücretsiz Kargo Limiti (₺, 0 = yok)</Label>
                  <Input {...zoneForm.register('freeThreshold', { valueAsNumber: true })} type="number" min="0" step="0.01" className="h-7 text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={zoneForm.watch('isActive')}
                    onCheckedChange={(v) => zoneForm.setValue('isActive', v)}
                  />
                  <Label className="text-xs">Aktif</Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="h-7 text-xs">Kaydet</Button>
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={cancelZoneEdit}>İptal</Button>
              </div>
            </form>
          )}

          {/* Zones table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bölge</TableHead>
                <TableHead>Kapsam</TableHead>
                <TableHead>Ücret</TableHead>
                <TableHead>Ücretsiz limite</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {zones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell className="font-medium text-sm">{zone.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{zone.region}</TableCell>
                  <TableCell className="text-sm">
                    {zone.rate === 0 ? <span className="text-emerald-600">Ücretsiz</span> : `₺${zone.rate}`}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {zone.freeThreshold > 0 ? `₺${zone.freeThreshold}` : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={zone.isActive ? 'default' : 'secondary'} className="text-xs">
                      {zone.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => startEdit(zone)}>Düzenle</Button>
                      <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive hover:text-destructive" onClick={() => deleteZone(zone.id)}>Sil</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
