'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarClock, Clock3, Loader2, MapPin, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import PageLoader from '@/components/common/PageLoader';
import { addressService } from '@/services/address.service';
import { orderService } from '@/services/order.service';
import { paymentService } from '@/services/payment.service';
import { useCart } from '@/hooks/useCart';
import { useAuthStore } from '@/store/auth.store';
import { formatPrice } from '@/lib/utils';
import {
  DELIVERY_REGION_OPTIONS,
  readDeliveryDatePreference,
  readDeliveryRegionPreference,
  readDeliveryTimePreference,
  writeDeliveryDatePreference,
  writeDeliveryTimePreference,
  type DeliveryRegion,
  writeDeliveryRegionPreference,
} from '@/lib/delivery-preferences';
import { readCopiedNoteFromStorage, readNoteFromClipboard, writeCopiedNoteToStorage } from '@/lib/note-copy';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import { GIFT_NOTE_RECIPIENT_OPTIONS, GiftNoteRecipientType } from '@/lib/gift-note';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n/context';

type CheckoutGiftNoteTemplate = {
  id: string;
  content: string;
  recipientType: string;
  sortOrder: number;
};

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

const newAddressSchema = z.object({
  fullName: z.string().min(3),
  phone: z.string().min(10),
  city: z.string().min(2),
  country: z.string().min(2),
  addressLine: z.string().min(5),
  postalCode: z.string().min(3),
});

type NewAddressForm = z.infer<typeof newAddressSchema>;

const DELIVERY_TIME_OPTIONS = (() => {
  const options: string[] = [];
  let currentMinutes = 12 * 60;
  const endMinutes = 23 * 60;

  while (currentMinutes <= endMinutes) {
    const hour = Math.floor(currentMinutes / 60)
      .toString()
      .padStart(2, '0');
    const minute = (currentMinutes % 60).toString().padStart(2, '0');

    options.push(`${hour}:${minute}`);
    currentMinutes += 30;
  }

  return options;
})();

type DeliveryDateOption = {
  value: string;
  label: string;
  subLabel: string;
};

const DELIVERY_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DELIVERY_TIME_REGEX = /^(1[2-9]|2[0-3]):(00|30)$/;

function normalizeDeliveryRegionValue(raw: string): DeliveryRegion | '' {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  const upper = trimmed.toUpperCase();
  if (upper === 'GIRNE' || upper === 'LEFKOSA' || upper === 'GAZIMAGUSA') {
    return upper;
  }

  if (upper === 'MAGUSA' || upper === 'GAZIMAGUSA') return 'GAZIMAGUSA';
  return '';
}

function normalizeDeliveryDateValue(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (DELIVERY_DATE_REGEX.test(trimmed)) return trimmed;

  const dottedMatch = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(trimmed);
  if (!dottedMatch) return '';

  const [, day, month, year] = dottedMatch;
  return `${year}-${month}-${day}`;
}

function normalizeDeliveryTimeValue(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (DELIVERY_TIME_REGEX.test(trimmed)) return trimmed;

  const rangeMatch = /^(\d{2}:\d{2})-\d{2}:\d{2}$/.exec(trimmed);
  if (!rangeMatch) return '';

  const start = rangeMatch[1];
  return DELIVERY_TIME_REGEX.test(start) ? start : '';
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function buildDeliveryDateOptions(locale: string, count = 12): DeliveryDateOption[] {
  const options: DeliveryDateOption[] = [];
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const dayFormatter = new Intl.DateTimeFormat(locale, { weekday: 'long' });

  for (let i = 0; i < count; i += 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + i);

    const formattedDate = dateFormatter.format(date);
    const dayName = dayFormatter.format(date);
    const label = formattedDate;
    const subLabel = dayName;

    options.push({
      value: toDateKey(date),
      label,
      subLabel,
    });
  }

  return options;
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const { locale, t } = useI18n();
  const isTr = locale === 'tr';
  const tx = {
    deliveryTitle: isTr ? 'Teslimat Bilgileri' : 'Delivery Information',
    deliveryDescription: isTr
      ? 'Gün ve saat seçimini yaparak siparişinizi tamamlama adımına hazırlayın.'
      : 'Select day and time details to complete your order.',
    deliveryRegionLabel: isTr ? 'Teslim Bölgesi' : 'Delivery Region',
    deliveryDateLabel: isTr ? 'Teslim Günü' : 'Delivery Date',
    deliveryTimeLabel: isTr ? 'Teslim Saati' : 'Delivery Time',
    recipientPlaceholder: isTr ? 'Alıcı tipi seçin' : 'Select recipient type',
    noTemplates: isTr ? 'Bu alıcı tipi için hazır not bulunamadı.' : 'No prepared note found for this recipient type.',
    selectRegion: isTr ? 'Lütfen bir teslim bölgesi seçin' : 'Please choose a delivery region',
    selectDeliveryDate: isTr ? 'Lütfen teslim gününü seçin' : 'Please choose a delivery date',
    selectDeliveryTime: isTr ? 'Lütfen teslim saatini seçin' : 'Please choose a delivery time',
  };
  const giftNoteTouchedRef = useRef(false);
  const { cart, cartTotal } = useCart();
  const deliveryDateOptions = useMemo(() => buildDeliveryDateOptions(locale), [locale]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [giftNote, setGiftNote] = useState('');
  const [selectedRecipientType, setSelectedRecipientType] =
    useState<GiftNoteRecipientType>('SEVGILI');
  const [deliveryRegion, setDeliveryRegion] = useState<DeliveryRegion | ''>('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CARD'>('CARD');
  const [isRedirectingPayment, setIsRedirectingPayment] = useState(false);

  const { data: addresses, isLoading, refetch } = useQuery({
    queryKey: ['addresses'],
    queryFn: addressService.getAddresses,
    enabled: isAuthenticated,
  });

  const { data: giftNoteTemplates = [] } = useQuery({
    queryKey: ['checkout-gift-note-templates', selectedRecipientType],
    queryFn: async () => {
      const { data } = await api.get<CheckoutGiftNoteTemplate[]>(
        `/products/note-templates?recipientType=${selectedRecipientType}`,
      );
      return data;
    },
    enabled: !!selectedRecipientType,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewAddressForm>({ resolver: zodResolver(newAddressSchema) });

  const createAddressMutation = useMutation({
    mutationFn: addressService.createAddress,
    onSuccess: (addr) => {
      refetch();
      setSelectedAddressId(addr.id);
      setShowNewAddress(false);
      reset();
      toast.success(t('checkout.addressAdded'));
    },
  });

  const placeOrderMutation = useMutation({
    mutationFn: orderService.createOrder,
    onError: (error) => {
      toast.error(getRequestErrorMessage(error, t('checkout.orderFailed')));
    },
  });

  useEffect(() => {
    setDeliveryRegion(normalizeDeliveryRegionValue(readDeliveryRegionPreference()));
    setDeliveryDate(normalizeDeliveryDateValue(readDeliveryDatePreference()));
    setDeliveryTime(normalizeDeliveryTimeValue(readDeliveryTimePreference()));
  }, []);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (isAuthenticated) return;

    router.replace('/login');
  }, [_hasHydrated, isAuthenticated, router]);

  useEffect(() => {
    let active = true;

    const safeSetGiftNote = (value: string) => {
      if (!active) return;
      setGiftNote((previous) => {
        if (giftNoteTouchedRef.current && previous.trim()) return previous;
        return value;
      });
    };

    const hydrateGiftNote = async () => {
      const fromStorage = readCopiedNoteFromStorage();
      if (fromStorage) {
        safeSetGiftNote(fromStorage);
        return;
      }

      const fromClipboard = await readNoteFromClipboard();
      if (!fromClipboard) return;

      safeSetGiftNote(fromClipboard);
      writeCopiedNoteToStorage(fromClipboard);
    };

    const handleFocus = () => {
      void hydrateGiftNote();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      void hydrateGiftNote();
    };

    const handleStorage = () => {
      void hydrateGiftNote();
    };

    void hydrateGiftNote();

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      active = false;
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    const noteFromQuery = searchParams.get('note')?.trim() ?? '';
    if (!noteFromQuery) return;

    setGiftNote((prev) => {
      if (giftNoteTouchedRef.current && prev.trim()) return prev;
      return noteFromQuery;
    });
    writeCopiedNoteToStorage(noteFromQuery);
  }, [searchParams]);

  if (!_hasHydrated || isLoading) return <PageLoader />;
  if (!isAuthenticated) return null;

  const finalTotal = cartTotal >= 250 ? cartTotal : cartTotal + 29.9;
  async function handlePlaceOrder() {
    const normalizedRegion = normalizeDeliveryRegionValue(deliveryRegion);
    const normalizedDate = normalizeDeliveryDateValue(deliveryDate);
    const normalizedTime = normalizeDeliveryTimeValue(deliveryTime);

    if (!selectedAddressId) { toast.error(t('checkout.selectAddress')); return; }
    if (!normalizedRegion) { toast.error(tx.selectRegion); return; }
    if (!normalizedDate) { toast.error(tx.selectDeliveryDate); return; }
    if (!normalizedTime) { toast.error(tx.selectDeliveryTime); return; }
    if (!paymentMethod) { toast.error(t('checkout.selectPayment')); return; }

    try {
      setIsRedirectingPayment(true);

      const order = await placeOrderMutation.mutateAsync({
        addressId: selectedAddressId,
        giftNote: giftNote.trim() || undefined,
        deliveryDate: normalizedDate,
        deliveryTime: normalizedTime,
        deliveryRegion: normalizedRegion,
      } as any);

      qc.invalidateQueries({ queryKey: ['cart'] });

      const session = await paymentService.createSession(order.id);

      if (session.ready && session.iframeUrl) {
        toast.success(t('checkout.paymentRedirecting'));
        window.location.href = session.iframeUrl;
        return;
      }

      toast.info(session.message || t('checkout.paymentSessionFailed'));
      router.push(`/orders/${order.id}`);
    } catch (error) {
      toast.error(getRequestErrorMessage(error, t('checkout.paymentSessionFailed')));
    } finally {
      setIsRedirectingPayment(false);
    }
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">{t('checkout.paymentLabel')}</p>
        <h1 className="font-serif text-3xl font-bold">{t('checkout.title')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Address selection */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> {t('checkout.addressTitle')}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewAddress((v) => !v)}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                {showNewAddress ? t('common.cancel') : t('checkout.newAddress')}
              </Button>
            </div>

            {/* Existing addresses */}
            {addresses && addresses.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={cn(
                      'text-left p-4 rounded-xl border-2 transition-colors',
                      selectedAddressId === addr.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40',
                    )}
                  >
                    {!(addr as any).title && (
                      <p className="font-semibold text-sm">{addr.city} / {(addr as any).country}</p>
                    )}
                    {(addr as any).title && <p className="font-semibold text-sm">{(addr as any).title}</p>}
                    <p className="text-sm text-muted-foreground mt-1">{addr.fullName}</p>
                    {(addr as any).addressLine ? (
                      <p className="text-xs text-muted-foreground mt-0.5">{(addr as any).addressLine}</p>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {(addr as any).street} {(addr as any).buildingNo}/{(addr as any).flat}, {(addr as any).neighbourhood}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(addr as any).district} / {addr.city}
                        </p>
                      </>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* New address form */}
            {(showNewAddress || (addresses && addresses.length === 0)) && (
              <form
                onSubmit={handleSubmit((d) => createAddressMutation.mutate(d as any))}
                className="border border-border/60 rounded-xl p-5 space-y-4 bg-card"
              >
                <h3 className="font-medium text-sm text-muted-foreground">{t('checkout.newAddressTitle')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>{t('checkout.fullName')}</Label>
                    <Input {...register('fullName')} placeholder={t('checkout.fullNamePlaceholder')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('checkout.phone')}</Label>
                    <Input {...register('phone')} placeholder={t('checkout.phonePlaceholder')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('checkout.city')}</Label>
                    <Input {...register('city')} placeholder={t('checkout.cityPlaceholder')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('checkout.country')}</Label>
                    <Input {...register('country')} placeholder={t('checkout.countryPlaceholder')} />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>{t('checkout.addressLine')}</Label>
                    <Input {...register('addressLine')} placeholder={t('checkout.addressPlaceholder')} />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>{t('checkout.postalCode')}</Label>
                    <Input {...register('postalCode')} placeholder={t('checkout.postalCodePlaceholder')} />
                  </div>
                </div>
                <Button type="submit" size="sm" disabled={isSubmitting || createAddressMutation.isPending}>
                  {createAddressMutation.isPending ? (
                    <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> {t('checkout.savingAddress')}</>
                  ) : t('checkout.saveAddress')}
                </Button>
              </form>
            )}

            <div className="mt-6 relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-rose-50 via-background to-orange-50 p-6 shadow-sm">
              <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-orange-200/30 blur-3xl" />

              <div className="relative space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-3 py-1 text-xs font-semibold text-primary">
                      <Sparkles className="h-3.5 w-3.5" /> {tx.deliveryTitle}
                    </div>
                    <h3 className="mt-2 text-lg font-semibold">{tx.deliveryTitle}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tx.deliveryDescription}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">{tx.deliveryRegionLabel}</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {DELIVERY_REGION_OPTIONS.map((option) => {
                      const selected = deliveryRegion === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            const region = option.value as DeliveryRegion;
                            setDeliveryRegion(region);
                            writeDeliveryRegionPreference(region);
                          }}
                          className={cn(
                            'h-11 rounded-xl border text-sm font-medium transition-all',
                            selected
                              ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                              : 'border-border/70 bg-white/80 hover:border-primary/50 hover:bg-white',
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                      <CalendarClock className="h-3.5 w-3.5" /> {tx.deliveryDateLabel}
                    </Label>
                    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                      {deliveryDateOptions.map((option) => {
                        const selected = deliveryDate === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setDeliveryDate(option.value);
                              writeDeliveryDatePreference(option.value);
                            }}
                            className={cn(
                              'min-w-[160px] snap-start rounded-xl border px-3 py-2 text-left transition-all',
                              selected
                                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                : 'border-border/70 bg-white/80 hover:border-primary/50 hover:bg-white',
                            )}
                          >
                            <p className={cn('text-sm font-semibold', selected ? 'text-primary-foreground' : 'text-foreground')}>
                              {option.label}
                            </p>
                            <p
                              className={cn(
                                'mt-0.5 text-xs capitalize',
                                selected ? 'text-primary-foreground/85' : 'text-muted-foreground',
                              )}
                            >
                              {option.subLabel}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" /> {tx.deliveryTimeLabel}
                    </Label>
                    <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
                      {DELIVERY_TIME_OPTIONS.map((timeSlot) => {
                        const selected = deliveryTime === timeSlot;

                        return (
                          <button
                            key={timeSlot}
                            type="button"
                            onClick={() => {
                              setDeliveryTime(timeSlot);
                              writeDeliveryTimePreference(timeSlot);
                            }}
                            className={cn(
                              'h-11 rounded-xl border text-sm font-medium transition-all',
                              selected
                                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                : 'border-border/70 bg-white/80 hover:border-primary/50 hover:bg-white',
                            )}
                          >
                            {timeSlot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-border/60 rounded-xl p-5 space-y-3 bg-card">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium">{t('checkout.noteTitle')}</h3>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t('checkout.noteTitle')}</p>
                <Select
                  value={selectedRecipientType}
                  onValueChange={(value) => setSelectedRecipientType(value as GiftNoteRecipientType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={tx.recipientPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {GIFT_NOTE_RECIPIENT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                  {giftNoteTemplates.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
                      {tx.noTemplates}
                    </p>
                  ) : (
                    giftNoteTemplates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => {
                          giftNoteTouchedRef.current = true;
                          setGiftNote(template.content);
                          writeCopiedNoteToStorage(template.content);
                        }}
                        className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-left text-sm transition-colors hover:border-primary/50 hover:bg-primary/5"
                      >
                        {template.content}
                      </button>
                    ))
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('checkout.noteDescription')}
              </p>
              <Textarea
                value={giftNote}
                onChange={(e) => {
                  giftNoteTouchedRef.current = true;
                  const value = e.target.value;
                  setGiftNote(value);
                  writeCopiedNoteToStorage(value);
                }}
                rows={6}
                placeholder={t('checkout.notePlaceholder')}
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-border/60 bg-card p-6 sticky top-24">
            <h2 className="font-serif font-semibold text-lg mb-5">{t('cart.orderSummary')}</h2>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {cart?.items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs text-muted-foreground">
                  <span className="truncate mr-2">{item.product.name} x{item.quantity}</span>
                  <span className="shrink-0">{formatPrice(item.product.price * item.quantity, 'TRY', locale)}</span>
                </div>
              ))}
            </div>
            <Separator className="mb-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{t('cart.subtotal')}</span>
                <span>{formatPrice(cartTotal, 'TRY', locale)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t('cart.shipping')}</span>
                <span className={cartTotal >= 250 ? 'text-green-600' : ''}>
                  {cartTotal >= 250 ? t('common.free') : formatPrice(29.9, 'TRY', locale)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base pt-1">
                <span>{t('cart.total')}</span>
                <span className="text-primary">{formatPrice(finalTotal, 'TRY', locale)}</span>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-border/70 bg-secondary/20 p-4 space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('checkout.paymentTitle')}</p>
              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                  paymentMethod === 'CARD'
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border/70 bg-background text-muted-foreground',
                )}
              >
                <p className="font-medium">{t('checkout.cardPayment')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('checkout.cardPaymentDescription')}</p>
              </button>
            </div>

            <Button
              className="w-full mt-6"
              size="lg"
              disabled={!selectedAddressId || placeOrderMutation.isPending || isRedirectingPayment}
              onClick={handlePlaceOrder}
            >
              {placeOrderMutation.isPending || isRedirectingPayment ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('checkout.processing')}</>
              ) : (
                t('checkout.confirmOrder')
              )}
            </Button>
            {!selectedAddressId && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                {t('checkout.selectAddress')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
