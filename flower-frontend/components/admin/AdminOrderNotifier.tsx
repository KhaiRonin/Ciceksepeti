'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminOrderService } from '@/services/dashboard.service';

function playNotificationSound() {
  if (typeof window === 'undefined') return;

  const AudioContextClass = window.AudioContext || (window as typeof window & {
    webkitAudioContext?: typeof AudioContext;
  }).webkitAudioContext;

  if (!AudioContextClass) return;

  const audioContext = new AudioContextClass();
  const now = audioContext.currentTime;

  const beep = (start: number, frequency: number, duration: number) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.15, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  };

  void audioContext.resume().then(() => {
    beep(now, 880, 0.18);
    beep(now + 0.24, 1174, 0.22);
  });
}

export function AdminOrderNotifier() {
  const lastOrderIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  const { data } = useQuery({
    queryKey: ['admin-order-notifier'],
    queryFn: () => adminOrderService.getAll({ limit: 1, page: 1 }),
  });

  useEffect(() => {
    const latestOrder = data?.data?.[0];
    if (!latestOrder) return;

    if (!initializedRef.current) {
      lastOrderIdRef.current = latestOrder.id;
      initializedRef.current = true;
      return;
    }

    if (lastOrderIdRef.current && latestOrder.id !== lastOrderIdRef.current) {
      lastOrderIdRef.current = latestOrder.id;
      toast.success('Yeni sipariş geldi', {
        description: `${latestOrder.user.name} tarafından yeni bir sipariş oluşturuldu.`,
        duration: 10_000,
      });
      playNotificationSound();
      return;
    }

    lastOrderIdRef.current = latestOrder.id;
  }, [data]);

  return null;
}
