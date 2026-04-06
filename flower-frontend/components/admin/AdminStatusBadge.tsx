'use client';

import { cn } from '@/lib/utils';
import { OrderStatus } from '@/types/admin';

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  PENDING: {
    label: 'Bekliyor',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  },
  PAID: {
    label: 'Ödendi',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  PROCESSING: {
    label: 'Hazırlanıyor',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  },
  SHIPPED: {
    label: 'Kargoda',
    className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  DELIVERED: {
    label: 'Teslim Edildi',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  CANCELED: {
    label: 'İptal',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function AdminStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-black/5',
        config.className,
        className,
      )}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      {config.label}
    </span>
  );
}
