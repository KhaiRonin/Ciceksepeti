'use client';

import { Check, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LOCALE_LABELS, SUPPORTED_LOCALES, type LocaleCode } from '@/lib/i18n/config';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

export default function LanguageSelector({
  className,
  onSelected,
}: {
  className?: string;
  onSelected?: () => void;
}) {
  const { locale, setLocale, t } = useI18n();

  function handleSelect(nextLocale: LocaleCode) {
    setLocale(nextLocale);
    onSelected?.();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn('gap-2 px-2.5', className)}>
          <Languages className="h-4 w-4" />
          <span className="text-xs font-semibold">{LOCALE_LABELS[locale].short}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>{t('nav.languageSelector')}</DropdownMenuLabel>
        {SUPPORTED_LOCALES.map((code) => (
          <DropdownMenuItem
            key={code}
            className="flex items-center justify-between gap-3"
            onClick={() => handleSelect(code)}
          >
            <span>{LOCALE_LABELS[code].native}</span>
            {locale === code && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
