'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { I18nProvider } from '@/lib/i18n/context';
import type { LocaleCode } from '@/lib/i18n/config';
import { queryClient } from '@/lib/query-client';
import { writeCopiedNoteToStorage } from '@/lib/note-copy';
import { useEffect } from 'react';

export function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: LocaleCode;
}) {
  useEffect(() => {
    const handleCopy = (event: ClipboardEvent) => {
      const eventText = event.clipboardData?.getData('text/plain')?.trim() ?? '';
      const selectionText = window.getSelection?.()?.toString().trim() ?? '';
      const copiedText = eventText || selectionText;

      if (!copiedText) return;
      writeCopiedNoteToStorage(copiedText);
    };

    document.addEventListener('copy', handleCopy);

    let restoreClipboardWrite: (() => void) | null = null;
    const canPatchClipboardWrite =
      typeof navigator !== 'undefined'
      && typeof (navigator as { clipboard?: Clipboard }).clipboard !== 'undefined';

    if (canPatchClipboardWrite) {
      const clipboard = navigator.clipboard as Clipboard & {
        writeText: (data: string) => Promise<void>;
      };

      const originalWriteText = clipboard.writeText.bind(clipboard);

      try {
        clipboard.writeText = async (data: string) => {
          writeCopiedNoteToStorage(data);
          await originalWriteText(data);
        };

        restoreClipboardWrite = () => {
          clipboard.writeText = originalWriteText;
        };
      } catch {
        restoreClipboardWrite = null;
      }
    }

    const handleWindowError = (event: ErrorEvent) => {
      const text = `${event.message || ''} ${(event.error as Error | undefined)?.message || ''}`;
      if (text.includes('window.ethereum.selectedAddress')) {
        event.preventDefault();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reasonText = String(
        (event.reason as { message?: string } | undefined)?.message ?? event.reason ?? '',
      );
      if (reasonText.includes('window.ethereum.selectedAddress')) {
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      document.removeEventListener('copy', handleCopy);
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      restoreClipboardWrite?.();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider initialLocale={initialLocale}>
        <TooltipProvider delayDuration={300}>
          {children}
          <Toaster richColors position="bottom-right" />
          <ReactQueryDevtools initialIsOpen={false} />
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
