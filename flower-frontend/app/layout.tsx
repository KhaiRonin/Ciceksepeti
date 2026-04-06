import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import Script from 'next/script';
import './globals.css';
import { Providers } from './providers';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { getDirection, LOCALE_COOKIE_NAME, normalizeLocale } from '@/lib/i18n/config';

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Kıbrısçiçeksepetim — Lüks Çiçek & Hediye',
  description:
    'En taze çiçekler, el yapımı buketler ve özel hediyeler kapınıza kadar.',
  keywords: ['çiçek', 'buket', 'hediye', 'teslimat', 'çiçeksepeti'],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLocale = normalizeLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);

  return (
    <html lang={initialLocale} dir={getDirection(initialLocale)}>
      <body className={`${playfair.variable} ${inter.variable} font-sans antialiased`}>
        <Script id="ethereum-guard" strategy="beforeInteractive">
          {`window.ethereum = window.ethereum || {};`}
        </Script>
        <Providers initialLocale={initialLocale}>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
