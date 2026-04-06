'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search, Shield, ShieldOff, Trash2, UserCog, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { adminCustomerService } from '@/services/dashboard.service';
import { AdminUser } from '@/types/admin';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users-manage'],
    queryFn: () => adminCustomerService.getAll({ limit: 500 }),
  });
  const users = usersData?.data ?? [];

  const roleMut = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'user' | 'admin' }) =>
      adminCustomerService.updateRole(id, role),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users-manage'] }); toast.success('Rol güncellendi'); },
    onError: () => toast.error('Güncelleme başarısız'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminCustomerService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users-manage'] }); toast.success('Kullanıcı silindi'); setDeleteId(null); },
    onError: () => toast.error('Silinemedi'),
  });

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Kullanıcı Yönetimi</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Tüm kullanıcıları ve rolleri yönetin</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Toplam Kullanıcı</p>
            <p className="text-2xl font-bold mt-1">{users.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Admin</p>
            <p className="text-2xl font-bold mt-1">{users.filter((u) => u.role === 'admin').length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Müşteri</p>
            <p className="text-2xl font-bold mt-1">{users.filter((u) => u.role === 'user').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative w-full sm:flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Kullanıcı ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {(['all', 'admin', 'user'] as const).map((r) => (
            <Button
              key={r}
              variant={roleFilter === r ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setRoleFilter(r)}
            >
              {r === 'all' ? 'Tümü' : r === 'admin' ? 'Admin' : 'Müşteri'}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            <Users className="inline h-4 w-4 mr-1.5" />
            Kullanıcılar ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Yükleniyor...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground text-xs">Ad / E-posta</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-xs">Rol</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-xs">Sipariş</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-xs">Kayıt Tarihi</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-xs text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{u.name}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {u.role === 'admin' ? (
                          <Badge className="bg-purple-100 text-purple-700 border-0 text-xs gap-1">
                            <Shield className="h-3 w-3" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Müşteri</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {u._count?.orders ?? 0} sipariş
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.id !== currentUser?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                                <UserCog className="h-3.5 w-3.5" />
                                İşlem
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {u.role === 'user' ? (
                                <DropdownMenuItem
                                  onClick={() => roleMut.mutate({ id: u.id, role: 'admin' })}
                                  disabled={roleMut.isPending}
                                >
                                  <Shield className="h-3.5 w-3.5 mr-2" />
                                  Admin Yap
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => roleMut.mutate({ id: u.id, role: 'user' })}
                                  disabled={roleMut.isPending}
                                >
                                  <ShieldOff className="h-3.5 w-3.5 mr-2" />
                                  Admin Kaldır
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setDeleteId(u.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Sil
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Kullanıcıyı Sil"
        description="Bu kullanıcıyı kalıcı olarak silmek istediğinizden emin misiniz? Tüm siparişleri de etkilenebilir."
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
