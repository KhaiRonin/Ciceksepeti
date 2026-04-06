'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Menu, Bell, ChevronDown, LogOut, User, Settings, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAdminStore } from '@/store/admin.store';
import { useAuthStore } from '@/store/auth.store';
import { clearTokens } from '@/lib/api';
import Link from 'next/link';

const BREADCRUMBS: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/products': 'Ürünler',
  '/admin/categories': 'Kategoriler',
  '/admin/orders': 'Siparişler',
  '/admin/customers': 'Müşteriler',
  '/admin/analytics': 'Analitik',
  '/admin/media': 'Medya Kitaplığı',
  '/admin/settings': 'Ayarlar',
};

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { setMobileSidebarOpen } = useAdminStore();
  const { user, clearAuth } = useAuthStore();

  const pageTitle = BREADCRUMBS[pathname] ?? 'Yönetim';

  async function handleLogout() {
    clearTokens();
    clearAuth();
    router.push('/login');
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'A';

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border/40 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 gap-3">
      {/* Mobile menu */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 md:hidden"
        onClick={() => setMobileSidebarOpen(true)}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-foreground truncate">{pageTitle}</h1>
        <p className="text-xs text-muted-foreground hidden sm:block">
          Kıbrısçiçeksepetim Yönetim Paneli
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {/* View site */}
        <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs hidden sm:flex" asChild>
          <Link href="/" target="_blank">
            <ExternalLink className="h-3 w-3" />
            Siteyi Gör
          </Link>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 gap-2 px-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:inline max-w-[120px] truncate">
                {user?.name ?? 'Admin'}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="pb-1">
              <p className="font-medium text-sm">{user?.name}</p>
              <p className="text-xs text-muted-foreground font-normal truncate">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" /> Profilim
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/settings">
                <Settings className="mr-2 h-4 w-4" /> Ayarlar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" /> Çıkış Yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
