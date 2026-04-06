'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Trash2, Star, Filter } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { adminReviewService } from '@/services/dashboard.service';
import { AdminReview } from '@/types/admin';
import { formatDate } from '@/lib/utils';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const approvedParam =
    filter === 'approved' ? true : filter === 'pending' ? false : undefined;

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['admin-reviews', filter],
    queryFn: () => adminReviewService.getAll(approvedParam),
  });

  const approveMut = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      adminReviewService.approve(id, approved),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success(vars.approved ? 'Yorum onaylandı' : 'Yorum reddedildi');
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminReviewService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('Yorum silindi');
      setDeleteId(null);
    },
  });

  const totalStars = reviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = reviews.length > 0 ? (totalStars / reviews.length).toFixed(1) : '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Ürün Yorumları</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Müşteri değerlendirmelerini yönetin</p>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="pending">Bekleyenler</SelectItem>
            <SelectItem value="approved">Onaylılar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Yorum', value: reviews.length },
          { label: 'Bekleyen', value: reviews.filter((r) => !r.isApproved).length },
          { label: 'Onaylı', value: reviews.filter((r) => r.isApproved).length },
          { label: 'Ortalama Puan', value: avgRating },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reviews List */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Yorumlar ({reviews.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Yükleniyor...</div>
          ) : reviews.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Star className="h-8 w-8 mx-auto mb-2 opacity-30" />
              Yorum bulunamadı
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {reviews.map((r) => (
                <div key={r.id} className="p-4 hover:bg-muted/20">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-medium text-sm">{r.user.name}</span>
                        <span className="text-xs text-muted-foreground">{r.user.email}</span>
                        <StarRating rating={r.rating} />
                        <Badge variant={r.isApproved ? 'default' : 'secondary'} className="text-xs">
                          {r.isApproved ? 'Onaylı' : 'Bekliyor'}
                        </Badge>
                      </div>
                      <p className="text-xs text-primary mt-1 font-medium">
                        Ürün: {r.product.name}
                      </p>
                      {r.comment && (
                        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                          {r.comment}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground/60 mt-1.5">
                        {formatDate(r.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!r.isApproved ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs gap-1"
                          onClick={() => approveMut.mutate({ id: r.id, approved: true })}
                          disabled={approveMut.isPending}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Onayla
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50 text-xs gap-1"
                          onClick={() => approveMut.mutate({ id: r.id, approved: false })}
                          disabled={approveMut.isPending}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reddet
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-600"
                        onClick={() => setDeleteId(r.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Yorumu Sil"
        description="Bu yorumu kalıcı olarak silmek istediğinizden emin misiniz?"
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
