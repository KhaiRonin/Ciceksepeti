'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '@/services/cart.service';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';

export function useCart() {
  const qc = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: cartService.getCart,
    enabled: isAuthenticated,
  });

  const addMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartService.addItem(productId, quantity),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Sepete eklendi!');
    },
    onError: () => toast.error('Sepete eklenemedi'),
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => cartService.removeItem(productId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Ürün sepetten kaldırıldı');
    },
  });

  const cartCount =
    cartQuery.data?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  const cartTotal =
    cartQuery.data?.items.reduce(
      (sum, i) => sum + i.product.price * i.quantity,
      0,
    ) ?? 0;

  return {
    cart: cartQuery.data,
    isLoading: cartQuery.isLoading,
    cartCount,
    cartTotal,
    addItem: addMutation.mutate,
    removeItem: removeMutation.mutate,
    isAdding: addMutation.isPending,
  };
}
