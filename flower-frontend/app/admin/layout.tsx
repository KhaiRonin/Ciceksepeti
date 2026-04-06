'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useAdminStore } from '@/store/admin.store';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import PageLoader from '@/components/common/PageLoader';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const { sidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen } = useAdminStore();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    setChecked(true);
    if (!isAuthenticated || user?.role !== 'admin') {
      router.replace('/');
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  const { data: dashData } = useQuery({
    queryKey: ['admin-dashboard-badges'],
    queryFn: () => dashboardService.getDashboard('weekly'),
    enabled: isAuthenticated && user?.role === 'admin',
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  if (!checked || !_hasHydrated) return <PageLoader />;
  if (!isAuthenticated || user?.role !== 'admin') return null;

  const pendingOrders = dashData?.stats?.pendingOrders ?? 0;
  const lowStock = dashData?.stats?.lowStockProducts ?? 0;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AdminSidebar pendingOrders={pendingOrders} lowStock={lowStock} />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-[240px] p-0 border-0">
          <AdminSidebar pendingOrders={pendingOrders} lowStock={lowStock} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div
        className={cn(
          'flex flex-1 flex-col min-w-0 transition-all duration-300',
          'md:ml-[240px]',
          sidebarCollapsed && 'md:ml-[64px]',
        )}
      >
        <AdminHeader />
        <main className="flex-1 p-4 md:p-6 max-w-[1600px] w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
