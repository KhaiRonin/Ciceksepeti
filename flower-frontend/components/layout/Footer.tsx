import Link from 'next/link';
import { Flower, Instagram, Facebook, Twitter, Mail, Phone } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const SHOP_LINKS = [
  { href: '/products', label: 'Tüm Çiçekler' },
  { href: '/categories/buket', label: 'Buketler' },
  { href: '/categories/saksili', label: 'Saksılı Bitkiler' },
  { href: '/categories/duzenleme', label: 'Düzenlemeler' },
];

const ACCOUNT_LINKS = [
  { href: '/login', label: 'Giriş Yap' },
  { href: '/register', label: 'Kayıt Ol' },
  { href: '/orders', label: 'Siparişlerim' },
  { href: '/profile', label: 'Profilim' },
];

const SUPPORT_LINKS = [
  { href: '#', label: 'Sıkça Sorulan Sorular' },
  { href: '#', label: 'Teslimat Bilgileri' },
  { href: '#', label: 'İade & Değişim' },
  { href: '#', label: 'İletişim' },
];

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-border/60 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 w-fit">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Flower className="h-6 w-6" />
              </div>
              <span className="font-serif text-2xl font-semibold">Kıbrısçiçeksepetim</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              En taze çiçekler ve el yapımı özel tasarım buketlerle her anı güzel kılıyoruz.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <a
                href="#"
                className="h-9 w-9 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="h-9 w-9 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="h-9 w-9 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold text-sm tracking-wide uppercase text-foreground/70 mb-4">
              Mağaza
            </h4>
            <ul className="space-y-2.5">
              {SHOP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-semibold text-sm tracking-wide uppercase text-foreground/70 mb-4">
              Hesabım
            </h4>
            <ul className="space-y-2.5">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Contact */}
          <div>
            <h4 className="font-semibold text-sm tracking-wide uppercase text-foreground/70 mb-4">
              Destek
            </h4>
            <ul className="space-y-2.5 mb-6">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2">
              <a
                href="tel:+908001234567"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Phone className="h-3.5 w-3.5 shrink-0" />
                0800 123 45 67
              </a>
              <a
                href="mailto:destek@kibrisciceksepetim.com"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" />
                destek@kibrisciceksepetim.com
              </a>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Kıbrısçiçeksepetim. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-primary transition-colors">Gizlilik Politikası</Link>
            <Link href="#" className="hover:text-primary transition-colors">Kullanım Koşulları</Link>
            <Link href="#" className="hover:text-primary transition-colors">KVKK</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
