'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingBag,
  Users,
  Settings,
  Flower2,
  ChevronLeft,
  ChevronRight,
  Bell,
  AlertTriangle,
  Warehouse,
  RotateCcw,
  Ticket,
  Star,
  Megaphone,
  UserCog,
  FileBarChart2,
  Truck,
  ScrollText,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminStore } from '@/store/admin.store';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: string;
}

const NAV_ITEMS: { group: string; items: NavItem[] }[] = [
  {
    group: 'Genel',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/admin/reports', label: 'Raporlar', icon: FileBarChart2 },
    ],
  },
  {
    group: 'Katalog',
    items: [
      { href: '/admin/products', label: 'Ürünler', icon: Package },
      { href: '/admin/categories', label: 'Kategoriler', icon: Tag },
      { href: '/admin/inventory', label: 'Stok Yönetimi', icon: Warehouse },
    ],
  },
  {
    group: 'Satış',
    items: [
      { href: '/admin/orders', label: 'Siparişler', icon: ShoppingBag, badge: 'pending' },
      { href: '/admin/returns', label: 'İadeler', icon: RotateCcw },
      { href: '/admin/coupons', label: 'Kuponlar', icon: Ticket },
    ],
  },
  {
    group: 'Müşteriler',
    items: [
      { href: '/admin/customers', label: 'Müşteriler', icon: Users },
      { href: '/admin/users', label: 'Kullanıcılar', icon: UserCog },
      { href: '/admin/reviews', label: 'Yorumlar', icon: Star },
    ],
  },
  {
    group: 'Pazarlama',
    items: [
      { href: '/admin/banners', label: 'Bannerlar', icon: Megaphone },
      { href: '/admin/note-templates', label: 'Not Şablonları', icon: MessageSquare },
    ],
  },
  {
    group: 'Sistem',
    items: [
      { href: '/admin/settings', label: 'Ayarlar', icon: Settings },
      { href: '/admin/shipping', label: 'Kargo', icon: Truck },
      { href: '/admin/logs', label: 'Loglar', icon: ScrollText },
    ],
  },
];

interface Props {
  pendingOrders?: number;
  lowStock?: number;
}

export function AdminSidebar({ pendingOrders = 0, lowStock = 0 }: Props) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useAdminStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border/40 bg-card transition-all duration-300',
        sidebarCollapsed ? 'w-[64px]' : 'w-[240px]',
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex h-14 items-center border-b border-border/40 px-3 shrink-0',
        sidebarCollapsed ? 'justify-center' : 'justify-between px-4',
      )}>
        {!sidebarCollapsed && (
          <Link href="/admin" className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Flower2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-none text-foreground">Kıbrısçiçeksepetim</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Admin Panel</p>
            </div>
          </Link>
        )}
        {sidebarCollapsed && (
          <Link href="/admin">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Flower2 className="h-4 w-4" />
            </div>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-6 w-6 shrink-0', sidebarCollapsed && 'hidden')}
          onClick={toggleSidebar}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV_ITEMS.map((group) => (
          <div key={group.group}>
            {!sidebarCollapsed && (
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {group.group}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                const isPending = item.badge === 'pending' && pendingOrders > 0;

                const linkContent = (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-all',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                      sidebarCollapsed && 'justify-center px-0',
                    )}
                  >
                    <item.icon className={cn('h-4 w-4 shrink-0', active && 'text-primary')} />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {isPending && (
                          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                            {pendingOrders > 99 ? '99+' : pendingOrders}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );

                if (sidebarCollapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right" className="flex items-center gap-2">
                        {item.label}
                        {isPending && (
                          <Badge variant="destructive" className="h-4 text-[10px]">
                            {pendingOrders}
                          </Badge>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return linkContent;
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Alerts footer */}
      {!sidebarCollapsed && (lowStock > 0 || pendingOrders > 0) && (
        <div className="border-t border-border/40 p-3 space-y-1.5">
          {pendingOrders > 0 && (
            <div className="flex items-center gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 px-2 py-1.5 text-xs text-amber-700 dark:text-amber-400">
              <Bell className="h-3 w-3 shrink-0" />
              <span>{pendingOrders} bekleyen sipariş</span>
            </div>
          )}
          {lowStock > 0 && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 dark:bg-red-950/30 px-2 py-1.5 text-xs text-red-700 dark:text-red-400">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>{lowStock} düşük stok</span>
            </div>
          )}
        </div>
      )}

      {/* Collapse toggle (when collapsed) */}
      {sidebarCollapsed && (
        <div className="border-t border-border/40 p-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 w-full"
            onClick={toggleSidebar}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </aside>
  );
}
