'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ShoppingCart, User, Menu, Flower, Search, LogOut, Settings, Package, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/auth.store';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/lib/i18n/context';
import LanguageSelector from './LanguageSelector';
import { categoryService } from '@/services/category.service';

const NAV_LINKS = [
  { href: '/products', labelKey: 'nav.allFlowers' },
  { href: '/products?sort=best-selling', labelKey: 'nav.bestSellers' },
  { href: '/products?discounted=true', labelKey: 'nav.discountedProducts' },
  { href: '/special-days', labelKey: 'nav.specialDays' },
  { href: '/blog', labelKey: 'nav.blog' },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const { logout } = useAuth();
  const { cartCount } = useCart();
  const { locale, t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: categories } = useQuery({
    queryKey: ['categories', locale],
    queryFn: categoryService.getCategories,
  });

  const isNavLinkActive = (href: string) => {
    const [targetPath, targetQuery = ''] = href.split('?');
    if (pathname !== targetPath) return false;

    const normalizedCurrent = searchParams.toString();

    // For plain /products link, only highlight when no special products query is active.
    if (!targetQuery) {
      if (targetPath !== '/products') return true;

      const hasSort = searchParams.has('sort');
      const hasDiscounted = searchParams.get('discounted') === 'true';
      return !hasSort && !hasDiscounted;
    }

    const targetParams = new URLSearchParams(targetQuery);
    const currentParams = new URLSearchParams(normalizedCurrent);

    for (const [key, value] of targetParams.entries()) {
      if (currentParams.get(key) !== value) {
        return false;
      }
    }

    return true;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground group-hover:scale-105 transition-transform">
            <Flower className="h-5 w-5" />
          </div>
          <span className="font-serif text-xl font-semibold tracking-tight hidden sm:block">
            {t('nav.brand')}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-md transition-colors hover:text-primary',
                isNavLinkActive(link.href)
                  ? 'text-primary bg-accent'
                  : 'text-muted-foreground',
              )}
            >
              {t(link.labelKey)}
            </Link>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="px-3 py-2 h-auto text-sm font-medium rounded-md text-muted-foreground hover:text-primary"
              >
                {t('nav.categories')}
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {categories?.map((cat) => (
                <DropdownMenuItem key={cat.id} asChild>
                  <Link href={`/products?categoryId=${cat.id}`}>{cat.name}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <Button variant="ghost" size="icon" asChild>
            <Link href="/search">
              <Search className="h-5 w-5" />
            </Link>
          </Button>

          <LanguageSelector className="hidden md:inline-flex" />

          {/* Cart */}
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-bold bg-primary text-primary-foreground">
                  {cartCount > 9 ? '9+' : cartCount}
                </Badge>
              )}
            </Link>
          </Button>

          {/* User menu */}
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile"><User className="mr-2 h-4 w-4" /> {t('nav.profile')}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orders"><Package className="mr-2 h-4 w-4" /> {t('nav.orders')}</Link>
                </DropdownMenuItem>
                {user.role === 'admin' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin"><Settings className="mr-2 h-4 w-4" /> {t('nav.adminPanel')}</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={logout}
                >
                  <LogOut className="mr-2 h-4 w-4" /> {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">{t('nav.login')}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">{t('nav.register')}</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 pt-8">
              <div className="flex flex-col gap-4">
                <Link
                  href="/"
                  className="flex items-center gap-2 mb-4"
                  onClick={() => setMobileOpen(false)}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Flower className="h-5 w-5" />
                  </div>
                  <span className="font-serif text-xl font-semibold">{t('nav.brand')}</span>
                </Link>
                <LanguageSelector className="w-fit" onSelected={() => setMobileOpen(false)} />
                <nav className="flex flex-col gap-1">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
                        isNavLinkActive(link.href)
                          ? 'text-primary bg-accent'
                          : 'text-muted-foreground hover:text-primary hover:bg-accent',
                      )}
                    >
                      {t(link.labelKey)}
                    </Link>
                  ))}

                  {categories && categories.length > 0 && (
                    <>
                      <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t('nav.categories')}
                      </p>
                      {categories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/products?categoryId=${cat.id}`}
                          onClick={() => setMobileOpen(false)}
                          className="px-3 py-2.5 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-primary hover:bg-accent"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </>
                  )}
                </nav>
                {!isAuthenticated && (
                  <div className="flex flex-col gap-2 mt-4 pt-4 border-t">
                    <Button asChild onClick={() => setMobileOpen(false)}>
                      <Link href="/login">{t('nav.login')}</Link>
                    </Button>
                    <Button variant="outline" asChild onClick={() => setMobileOpen(false)}>
                      <Link href="/register">{t('nav.register')}</Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
