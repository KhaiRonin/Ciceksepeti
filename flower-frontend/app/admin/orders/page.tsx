'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Eye, Search } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { DataTable } from '@/components/admin/DataTable';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import { adminOrderService } from '@/services/dashboard.service';
import { AdminOrder, OrderStatus } from '@/types/admin';
import { formatDateTimeKKTC, formatPriceFromApi } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

function getOrderTotalValue(order: AdminOrder): unknown {
  const legacy = order as unknown as {
    totalAmount?: unknown;
    total_price?: unknown;
  };

  return order.totalPrice ?? legacy.totalAmount ?? legacy.total_price ?? null;
}

function getOrderCreatedAt(order: AdminOrder): string | null {
  const legacy = order as unknown as {
    created_at?: string;
    orderDate?: string;
    order_date?: string;
  };

  return order.createdAt ?? legacy.created_at ?? legacy.orderDate ?? legacy.order_date ?? null;
}

const ORDER_STATUSES: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tüm Durumlar' },
  { value: 'PENDING', label: 'Bekliyor' },
  { value: 'PAID', label: 'Ödendi' },
  { value: 'PROCESSING', label: 'Hazırlanıyor' },
  { value: 'SHIPPED', label: 'Kargoda' },
  { value: 'DELIVERED', label: 'Teslim Edildi' },
  { value: 'CANCELED', label: 'İptal' },
];

export default function AdminOrdersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, debouncedSearch, statusFilter],
    queryFn: () => adminOrderService.getAll({
      page,
      limit: 15,
      search: debouncedSearch,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      adminOrderService.updateStatus(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Sipariş durumu güncellendi');
    },
    onError: () => toast.error('Güncelleme başarısız'),
  });

  const orders = data?.data ?? [];
  const meta = data?.meta;

  const columns: ColumnDef<AdminOrder>[] = [
    {
      accessorKey: 'id',
      header: 'Sipariş No',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          #{row.original.id.slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      accessorKey: 'user',
      header: 'Müşteri',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium">{row.original.user.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.user.email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'total',
      header: 'Tutar',
      cell: ({ row }) => (
        <span className="font-semibold text-sm tabular-nums">{formatPriceFromApi(getOrderTotalValue(row.original))}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Durum',
      cell: ({ row }) => (
        <Select
          defaultValue={row.original.status}
          onValueChange={(v) =>
            statusMutation.mutate({ id: row.original.id, status: v as OrderStatus })
          }
        >
          <SelectTrigger className="w-[140px] h-7 text-xs border-0 shadow-none bg-transparent p-0 gap-1">
            <AdminStatusBadge status={row.original.status} />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUSES.filter((s) => s.value !== 'all').map((s) => (
              <SelectItem key={s.value} value={s.value} className="text-xs">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Tarih',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{formatDateTimeKKTC(getOrderCreatedAt(row.original))}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
            <Link href={`/admin/orders/${row.original.id}`}>
              <Eye className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Siparişler</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {meta?.total ?? orders.length} sipariş
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        isLoading={isLoading}
        searchKey="user"
        searchPlaceholder="Müşteri veya sipariş ara..."
        externalSearch
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        pageSize={15}
        totalRows={meta?.total}
        page={page}
        onPageChange={setPage}
        emptyMessage="Sipariş bulunamadı"
        emptyDescription="Henüz sipariş yok."
        toolbar={
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as OrderStatus | 'all'); setPage(1); }}>
            <SelectTrigger className="h-8 text-xs w-[160px]">
              <SelectValue placeholder="Durum filtresi" />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}
