'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Store, Bell, Lock, Palette, Search, CreditCard, Mail, Globe } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';

/* ── Mağaza bilgileri şeması ── */
const storeSchema = z.object({
  name: z.string().min(2, 'Mağaza adı en az 2 karakter olmalı'),
  email: z.string().email('Geçerli bir e-posta girin'),
  phone: z.string().min(7, 'Geçerli bir telefon numarası girin'),
  address: z.string().optional(),
});
type StoreInput = z.infer<typeof storeSchema>;

/* ── Şifre değiştirme şeması ── */
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mevcut şifre zorunlu'),
    newPassword: z.string().min(8, 'Yeni şifre en az 8 karakter olmalı'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  });
type PasswordInput = z.infer<typeof passwordSchema>;

export default function AdminSettingsPage() {
  const [loadingStore, setLoadingStore] = useState(false);
  const [loadingPw, setLoadingPw] = useState(false);

  const [notifications, setNotifications] = useState({
    newOrder: true,
    lowStock: true,
    newCustomer: false,
    systemAlerts: true,
  });

  /* ── Store form ── */
  const storeForm = useForm<StoreInput>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: 'Kıbrısçiçeksepetim',
      email: 'destek@kibrisciceksepetim.com',
      phone: '+90 392 000 00 00',
      address: 'Lefkoşa, KKTC',
    },
  });

  const onSaveStore = async (values: StoreInput) => {
    setLoadingStore(true);
    await new Promise((r) => setTimeout(r, 800));
    console.log('Store settings:', values);
    toast.success('Mağaza bilgileri kaydedildi');
    setLoadingStore(false);
  };

  /* ── Password form ── */
  const pwForm = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onChangePassword = async (values: PasswordInput) => {
    setLoadingPw(true);
    await new Promise((r) => setTimeout(r, 800));
    console.log('Password change:', values.currentPassword ? 'processed' : 'skipped');
    pwForm.reset();
    toast.success('Şifre başarıyla değiştirildi');
    setLoadingPw(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">Ayarlar</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Panel ve mağaza yapılandırması</p>
      </div>

      {/* ── Store info ── */}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Store className="h-4 w-4" />
            Mağaza Bilgileri
          </CardTitle>
          <CardDescription className="text-xs">
            Müşterilere ve faturalarda görünen bilgiler
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...storeForm}>
            <form onSubmit={storeForm.handleSubmit(onSaveStore)} className="space-y-4">
              <FormField
                control={storeForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Mağaza Adı</FormLabel>
                    <FormControl>
                      <Input className="h-8 text-sm" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={storeForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">İletişim E-postası</FormLabel>
                    <FormControl>
                      <Input className="h-8 text-sm" type="email" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={storeForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Telefon</FormLabel>
                    <FormControl>
                      <Input className="h-8 text-sm" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={storeForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Adres</FormLabel>
                    <FormControl>
                      <Input className="h-8 text-sm" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <div className="flex justify-end pt-1">
                <Button type="submit" size="sm" disabled={loadingStore}>
                  {loadingStore && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                  Kaydet
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* ── Notifications ── */}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Bildirim Tercihleri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(
            [
              { key: 'newOrder', label: 'Yeni Sipariş', desc: 'Yeni sipariş geldiğinde bildir' },
              { key: 'lowStock', label: 'Düşük Stok', desc: 'Stok 5 adedinin altına düşünce uyar' },
              { key: 'newCustomer', label: 'Yeni Müşteri', desc: 'Yeni kayıt olduğunda bildir' },
              { key: 'systemAlerts', label: 'Sistem Uyarıları', desc: 'Kritik hata ve güvenlik bildirimleri' },
            ] as const
          ).map((item, idx, arr) => (
            <div key={item.key}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label className="text-sm font-medium">{item.label}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
                <Switch
                  checked={notifications[item.key]}
                  onCheckedChange={(v) => setNotifications((prev) => ({ ...prev, [item.key]: v }))}
                />
              </div>
              {idx < arr.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Appearance placeholder ── */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Görünüm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Tema rengi, yazı tipi gibi görünüm ayarları yakında eklenecek.
          </p>
        </CardContent>
      </Card>

      {/* ── Change password ── */}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Şifre Değiştir
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...pwForm}>
            <form onSubmit={pwForm.handleSubmit(onChangePassword)} className="space-y-4">
              <FormField
                control={pwForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Mevcut Şifre</FormLabel>
                    <FormControl>
                      <Input className="h-8 text-sm" type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={pwForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Yeni Şifre</FormLabel>
                    <FormControl>
                      <Input className="h-8 text-sm" type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={pwForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Yeni Şifre Tekrar</FormLabel>
                    <FormControl>
                      <Input className="h-8 text-sm" type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <div className="flex justify-end pt-1">
                <Button type="submit" size="sm" variant="outline" disabled={loadingPw}>
                  {loadingPw && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                  Şifreyi Değiştir
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* ── SEO ── */}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Search className="h-4 w-4 text-violet-500" />
            SEO Ayarları
          </CardTitle>
          <CardDescription className="text-xs">Arama motoru optimizasyon ayarları</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Site Başlığı (Title)</Label>
            <Input defaultValue="Kıbrısçiçeksepetim — Taze Çiçekler, Hızlı Teslimat" className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Meta Açıklama</Label>
            <Input defaultValue="Kuzey Kıbrıs'ın en taze çiçek buketi ve aranjman mağazası." className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Anahtar Kelimeler</Label>
            <Input defaultValue="çiçek, buket, aranjman, kıbrıs, lefkoşa" className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Robots.txt</Label>
            <Input defaultValue="index, follow" className="h-8 text-sm" />
          </div>
          <div className="flex justify-end pt-1">
            <Button size="sm" onClick={() => toast.success('SEO ayarları kaydedildi')}>Kaydet</Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Payment ── */}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-blue-500" />
            Ödeme Ayarları
          </CardTitle>
          <CardDescription className="text-xs">Kabul edilen ödeme yöntemleri</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: 'creditCard', label: 'Kredi / Banka Kartı', desc: 'Visa, Mastercard' },
            { key: 'bankTransfer', label: 'Havale / EFT', desc: 'Banka hesabına direkt transfer' },
            { key: 'cashOnDelivery', label: 'Kapıda Ödeme', desc: 'Teslimat sırasında nakit veya kart' },
          ].map((item, idx, arr) => (
            <div key={item.key}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label className="text-sm font-medium">{item.label}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
                <Switch defaultChecked={idx === 0} onCheckedChange={() => toast.success('Ödeme yöntemi güncellendi')} />
              </div>
              {idx < arr.length - 1 && <Separator className="mt-3" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Email ── */}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Mail className="h-4 w-4 text-rose-500" />
            E-posta Ayarları
          </CardTitle>
          <CardDescription className="text-xs">SMTP sunucusu ve gönderici bilgileri</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">SMTP Sunucusu</Label>
              <Input defaultValue="smtp.gmail.com" className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Port</Label>
              <Input defaultValue="587" type="number" className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Kullanıcı Adı</Label>
              <Input defaultValue="destek@kibrisciceksepetim.com" className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Şifre</Label>
              <Input type="password" placeholder="••••••••" className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Gönderici Adı</Label>
              <Input defaultValue="Kıbrısçiçeksepetim" className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Gönderici E-posta</Label>
              <Input defaultValue="noreply@kibrisciceksepetim.com" className="h-8 text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => toast.info('Test e-postası gönderildi')}>Test Gönder</Button>
            <Button size="sm" onClick={() => toast.success('E-posta ayarları kaydedildi')}>Kaydet</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
