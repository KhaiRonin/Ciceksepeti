import { Badge } from '@/components/ui/badge';
import { OrderStatus } from '@/types';

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  PENDING: { label: 'Bekliyor', variant: 'secondary' },
  PAID: { label: 'Ödendi', variant: 'default' },
  PROCESSING: { label: 'İşleniyor', variant: 'default' },
  CONFIRMED: { label: 'Onaylandı', variant: 'default' },
  PREPARING: { label: 'Hazırlanıyor', variant: 'default' },
  SHIPPED: { label: 'Kargoda', variant: 'default' },
  DELIVERED: { label: 'Teslim Edildi', variant: 'outline' },
  CANCELLED: { label: 'İptal Edildi', variant: 'destructive' },
  CANCELED: { label: 'İptal Edildi', variant: 'destructive' },
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: 'secondary' as const };
  return (
    <Badge
      variant={config.variant}
      className={
        status === 'DELIVERED'
          ? 'border-green-600 text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/30'
          : status === 'PREPARING' || status === 'SHIPPED'
          ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400'
          : undefined
      }
    >
      {config.label}
    </Badge>
  );
}
