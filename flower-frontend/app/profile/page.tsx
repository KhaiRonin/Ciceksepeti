'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, Loader2, MapPin, ShieldCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { addressService } from '@/services/address.service';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const profileSchema = z.object({
  name: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mevcut şifre gerekli'),
    newPassword: z
      .string()
      .min(8, 'Yeni şifre en az 8 karakter olmalıdır')
      .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Şifre en az bir harf ve bir rakam içermelidir'),
    confirmPassword: z.string().min(1, 'Şifre tekrar gerekli'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Şifreler eşleşmiyor',
  });

const addressSchema = z.object({
  fullName: z.string().min(3, 'Ad soyad en az 3 karakter olmalıdır'),
  phone: z.string().min(10, 'Geçerli telefon giriniz'),
  country: z.string().min(2, 'Ülke bilgisi gerekli'),
  city: z.string().min(2, 'Şehir bilgisi gerekli'),
  addressLine: z.string().min(5, 'Adres en az 5 karakter olmalıdır'),
  postalCode: z.string().min(3, 'Posta kodu en az 3 karakter olmalıdır'),
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type AddressForm = z.infer<typeof addressSchema>;

type SavedCard = {
  id: string;
  holderName: string;
  brand: string;
  last4: string;
  expMonth: string;
  expYear: string;
  createdAt: string;
};

const SAVED_CARDS_STORAGE_KEY = 'profile_saved_cards_v1';

function getRequestErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') return fallback;

  const maybeResponse = (error as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
  }).response;
  const apiMessage = maybeResponse?.data?.message;

  if (Array.isArray(apiMessage) && apiMessage.length > 0) {
    return apiMessage.join(', ');
  }

  if (typeof apiMessage === 'string' && apiMessage.trim()) {
    return apiMessage.trim();
  }

  const generic = (error as { message?: string }).message;
  if (typeof generic === 'string' && generic.trim() && !generic.startsWith('Request failed')) {
    return generic;
  }

  return fallback;
}

function detectCardBrand(cardNumber: string): string {
  if (/^4/.test(cardNumber)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(cardNumber)) return 'Mastercard';
  if (/^3[47]/.test(cardNumber)) return 'American Express';
  return 'Kart';
}

function loadSavedCards(): SavedCard[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(SAVED_CARDS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SavedCard[];
  } catch {
    return [];
  }
}

function saveSavedCards(cards: SavedCard[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SAVED_CARDS_STORAGE_KEY, JSON.stringify(cards));
}

export default function ProfilePage() {
  const { user, isAuthenticated, setUser, clearAuth } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [isSavingCard, setIsSavingCard] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  useEffect(() => {
    setSavedCards(loadSavedCards());
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '' },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
    reset: resetPasswordForm,
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const {
    register: registerAddress,
    handleSubmit: handleAddressSubmit,
    formState: { errors: addressErrors, isSubmitting: isAddressFormSubmitting },
    reset: resetAddressForm,
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      fullName: user?.name ?? '',
      phone: '',
      country: 'Türkiye',
      city: '',
      addressLine: '',
      postalCode: '',
    },
  });

  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: addressService.getAddresses,
    enabled: isAuthenticated,
  });

  const createAddressMutation = useMutation({
    mutationFn: addressService.createAddress,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] });
      resetAddressForm({
        fullName: user?.name ?? '',
        phone: '',
        country: 'Türkiye',
        city: '',
        addressLine: '',
        postalCode: '',
      });
      toast.success('Adres eklendi');
    },
    onError: (error) => {
      toast.error(getRequestErrorMessage(error, 'Adres eklenemedi'));
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (addressId: string) => addressService.deleteAddress(addressId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Adres silindi');
    },
    onError: (error) => {
      toast.error(getRequestErrorMessage(error, 'Adres silinemedi'));
    },
  });

  async function onSubmit(data: ProfileForm) {
    try {
      const updated = await authService.updateMe(data);
      setUser(updated);
      reset({ name: updated.name });
      toast.success('Profil güncellendi!');
    } catch {
      toast.error('Güncelleme başarısız');
    }
  }

  async function onPasswordSubmit(values: PasswordForm) {
    try {
      await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      resetPasswordForm();
      clearAuth();
      toast.success('Şifreniz güncellendi. Lütfen tekrar giriş yapın.');
      router.push('/login');
    } catch (error) {
      toast.error(getRequestErrorMessage(error, 'Şifre değiştirilemedi'));
    }
  }

  async function onAddressSubmit(values: AddressForm) {
    await createAddressMutation.mutateAsync(values);
  }

  function handleAddSavedCard(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const digits = cardNumber.replace(/\D/g, '');
    if (cardholderName.trim().length < 2) {
      toast.error('Kart üzerindeki isim en az 2 karakter olmalı');
      return;
    }

    if (digits.length < 13 || digits.length > 19) {
      toast.error('Geçerli bir kart numarası giriniz');
      return;
    }

    const month = Number(expMonth);
    const year = Number(expYear);
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      toast.error('Geçerli bir ay giriniz');
      return;
    }
    if (!Number.isInteger(year) || expYear.length !== 2) {
      toast.error('Yıl bilgisini 2 haneli giriniz');
      return;
    }

    setIsSavingCard(true);
    try {
      const newCard: SavedCard = {
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        holderName: cardholderName.trim(),
        brand: detectCardBrand(digits),
        last4: digits.slice(-4),
        expMonth: month.toString().padStart(2, '0'),
        expYear,
        createdAt: new Date().toISOString(),
      };

      const nextCards = [newCard, ...savedCards];
      setSavedCards(nextCards);
      saveSavedCards(nextCards);

      setCardholderName('');
      setCardNumber('');
      setExpMonth('');
      setExpYear('');
      toast.success('Kart kaydedildi');
    } finally {
      setIsSavingCard(false);
    }
  }

  function handleDeleteSavedCard(cardId: string) {
    const nextCards = savedCards.filter((card) => card.id !== cardId);
    setSavedCards(nextCards);
    saveSavedCards(nextCards);
    toast.success('Kayıtlı kart kaldırıldı');
  }

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 max-w-3xl">
      <div className="mb-8">
        <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">Hesabım</p>
        <h1 className="font-serif text-3xl font-bold">Profilim</h1>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-8 p-5 rounded-2xl bg-accent/30 border border-border/60">
        <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold font-serif shadow">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-lg">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          {user.role === 'admin' && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium mt-1 inline-block">
              Admin
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-2xl border border-border/60 p-5 bg-card">
        <h2 className="font-semibold text-lg">Profil Bilgileri</h2>
        <div className="space-y-1.5">
          <Label htmlFor="name">Ad Soyad</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>E-posta</Label>
          <Input value={user.email} disabled className="bg-muted/50 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">E-posta adresi değiştirilemez.</p>
        </div>

        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Kaydediliyor...</>
          ) : (
            'Kaydet'
          )}
        </Button>
      </form>

      <Separator className="my-8" />

      <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-5 rounded-2xl border border-border/60 p-5 bg-card">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-lg">Şifre Değiştir</h2>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="currentPassword">Mevcut Şifre</Label>
          <Input id="currentPassword" type="password" {...registerPassword('currentPassword')} />
          {passwordErrors.currentPassword && (
            <p className="text-xs text-destructive">{passwordErrors.currentPassword.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="newPassword">Yeni Şifre</Label>
          <Input id="newPassword" type="password" {...registerPassword('newPassword')} />
          {passwordErrors.newPassword && (
            <p className="text-xs text-destructive">{passwordErrors.newPassword.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
          <Input id="confirmPassword" type="password" {...registerPassword('confirmPassword')} />
          {passwordErrors.confirmPassword && (
            <p className="text-xs text-destructive">{passwordErrors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" disabled={isPasswordSubmitting}>
          {isPasswordSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Güncelleniyor...</>
          ) : (
            'Şifreyi Güncelle'
          )}
        </Button>
      </form>

      <Separator className="my-8" />

      <div className="space-y-5 rounded-2xl border border-border/60 p-5 bg-card">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-lg">Teslimat Adresleri</h2>
        </div>

        <form onSubmit={handleAddressSubmit(onAddressSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="addressFullName">Ad Soyad</Label>
            <Input id="addressFullName" {...registerAddress('fullName')} />
            {addressErrors.fullName && <p className="text-xs text-destructive">{addressErrors.fullName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="addressPhone">Telefon</Label>
            <Input id="addressPhone" {...registerAddress('phone')} />
            {addressErrors.phone && <p className="text-xs text-destructive">{addressErrors.phone.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="addressCountry">Ülke</Label>
            <Input id="addressCountry" {...registerAddress('country')} />
            {addressErrors.country && <p className="text-xs text-destructive">{addressErrors.country.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="addressCity">Şehir</Label>
            <Input id="addressCity" {...registerAddress('city')} />
            {addressErrors.city && <p className="text-xs text-destructive">{addressErrors.city.message}</p>}
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="addressLine">Adres Satırı</Label>
            <Input id="addressLine" {...registerAddress('addressLine')} />
            {addressErrors.addressLine && <p className="text-xs text-destructive">{addressErrors.addressLine.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="postalCode">Posta Kodu</Label>
            <Input id="postalCode" {...registerAddress('postalCode')} />
            {addressErrors.postalCode && <p className="text-xs text-destructive">{addressErrors.postalCode.message}</p>}
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={isAddressFormSubmitting || createAddressMutation.isPending}>
              {createAddressMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ekleniyor...</>
              ) : (
                'Adres Ekle'
              )}
            </Button>
          </div>
        </form>

        <div className="space-y-3">
          {(addressesLoading || deleteAddressMutation.isPending) && (
            <p className="text-sm text-muted-foreground">Adresler güncelleniyor...</p>
          )}

          {!addressesLoading && (addresses?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">Henüz kayıtlı teslimat adresiniz yok.</p>
          )}

          {(addresses ?? []).map((address) => (
            <div key={address.id} className="rounded-xl border border-border/60 p-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{address.fullName}</p>
                <p className="text-sm text-muted-foreground">{address.phone}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {address.addressLine ?? '-'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {[address.city, address.country, address.postalCode].filter(Boolean).join(' • ')}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => deleteAddressMutation.mutate(address.id)}
                disabled={deleteAddressMutation.isPending}
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Separator className="my-8" />

      <div className="space-y-5 rounded-2xl border border-border/60 p-5 bg-card">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-lg">Kayıtlı Ödeme Kartları</h2>
        </div>

        <p className="text-sm text-muted-foreground">
          Güvenlik için yalnızca maskeli kart bilgisi saklanır. Tam kart numarası tutulmaz.
        </p>

        <form onSubmit={handleAddSavedCard} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="cardholderName">Kart Üzerindeki İsim</Label>
            <Input
              id="cardholderName"
              value={cardholderName}
              onChange={(event) => setCardholderName(event.target.value)}
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="cardNumber">Kart Numarası</Label>
            <Input
              id="cardNumber"
              inputMode="numeric"
              placeholder="**** **** **** ****"
              value={cardNumber}
              onChange={(event) => setCardNumber(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expMonth">Ay (MM)</Label>
            <Input
              id="expMonth"
              inputMode="numeric"
              maxLength={2}
              value={expMonth}
              onChange={(event) => setExpMonth(event.target.value.replace(/\D/g, ''))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expYear">Yıl (YY)</Label>
            <Input
              id="expYear"
              inputMode="numeric"
              maxLength={2}
              value={expYear}
              onChange={(event) => setExpYear(event.target.value.replace(/\D/g, ''))}
            />
          </div>

          <div className="md:col-span-2">
            <Button type="submit" disabled={isSavingCard}>
              {isSavingCard ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Kaydediliyor...</>
              ) : (
                'Kart Ekle'
              )}
            </Button>
          </div>
        </form>

        <div className="space-y-3">
          {savedCards.length === 0 && (
            <p className="text-sm text-muted-foreground">Henüz kayıtlı kart bulunmuyor.</p>
          )}

          {savedCards.map((card) => (
            <div
              key={card.id}
              className={cn('rounded-xl border border-border/60 p-4 flex items-center justify-between gap-3')}
            >
              <div>
                <p className="font-medium">{card.brand} •••• {card.last4}</p>
                <p className="text-sm text-muted-foreground">{card.holderName}</p>
                <p className="text-xs text-muted-foreground">SKT {card.expMonth}/{card.expYear}</p>
              </div>
              <Button type="button" variant="outline" size="icon" onClick={() => handleDeleteSavedCard(card.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
