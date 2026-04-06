'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/context';

export default function CheckoutSuccessPage() {
  const { t } = useI18n();

  return (
    <div className="container mx-auto px-4 md:px-6 py-16 max-w-xl">
      <div className="rounded-2xl border border-border/60 bg-card p-8 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-2xl font-bold">{t('checkout.successTitle')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('checkout.successDescription')}
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <Button asChild>
            <Link href="/orders">{t('nav.orders')}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">{t('common.home')}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
