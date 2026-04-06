'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, UserCheck, Trash2, ShieldCheck, User } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import { DataTable } from '@/components/admin/DataTable';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { adminCustomerService } from '@/services/dashboard.service';
import { AdminUser } from '@/types/admin';
import { formatDate } from '@/lib/utils';

import type { ColumnDef } from '@tanstack/react-table';

export default function AdminCustomersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', page, search],
    queryFn: () => adminCustomerService.getAll({ page, limit: 15, search }),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      adminCustomerService.updateRole(id, role as 'admin' | 'user'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-customers'] });
      toast.success('Rol güncellendi');
    },
    onError: () => toast.error('Güncelleme başarısız'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminCustomerService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-customers'] });
      setDeleteTarget(null);
      toast.success('Müşteri silindi');
    },
    onError: () => toast.error('Silme işlemi başarısız'),
  });

  const columns: ColumnDef<AdminUser>[] = [
    {
      accessorKey: 'name',
      header: 'Müşteri',
      cell: ({ row }) => {
        const initials = (row.original.name ?? '')
          .split(' ')
          .map((n: string) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {initials || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm leading-none">{row.original.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{row.original.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      header: 'Rol',
      cell: ({ row }) => (
        <Badge
          variant={row.original.role === 'admin' ? 'default' : 'secondary'}
          className="text-xs gap-1"
        >
          {row.original.role === 'admin'
            ? <><ShieldCheck className="h-3 w-3" /> Admin</>
            : <><User className="h-3 w-3" /> Kullanıcı</>}
        </Badge>
      ),
    },
    {
      accessorKey: '_count',
      header: 'Siparişler',
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {row.original._count?.orders ?? 0} sipariş
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Kayıt Tarihi',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const u = row.original;
        const isAdmin = u.role === 'admin';
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-42">
                <DropdownMenuItem
                  className="gap-2 text-sm"
                  onClick={() => roleMutation.mutate({ id: u.id, role: isAdmin ? 'user' : 'admin' })}
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  {isAdmin ? 'Admin Kaldır' : 'Admin Yap'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2 text-sm text-destructive focus:text-destructive"
                  onClick={() => setDeleteTarget(u)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Sil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold">Müşteriler</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data?.meta?.total ?? 0} kayıtlı müşteri
          </p>
        </div>

        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          searchKey="name"
          externalSearch={true}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          page={page}
          totalRows={data?.meta?.total}
          pageSize={15}
          onPageChange={setPage}
        />
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Müşteriyi Sil"
        description={`"${deleteTarget?.name}" adlı müşteriyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmLabel="Sil"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
        destructive
      />
    </>
  );
}
