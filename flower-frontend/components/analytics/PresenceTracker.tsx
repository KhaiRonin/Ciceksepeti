'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { API_BASE_URL } from '@/lib/api';
const VISITOR_STORAGE_KEY = 'visitor-presence-id';

function getVisitorId() {
  if (typeof window === 'undefined') return '';

  const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY);
  if (existing) return existing;

  const created =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  window.localStorage.setItem(VISITOR_STORAGE_KEY, created);
  return created;
}

export default function PresenceTracker() {
  const pathname = usePathname();
  const [visitorId, setVisitorId] = useState('');
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const shouldSkipTracking = !hasHydrated || pathname.startsWith('/admin') || user?.role === 'admin';
  const prevSkipRef = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    setVisitorId(getVisitorId());
  }, []);

  useEffect(() => {
    if (!visitorId || shouldSkipTracking) return;

    let cancelled = false;

    const sendHeartbeat = async () => {
      if (cancelled || typeof document === 'undefined' || document.visibilityState === 'hidden') {
        return;
      }

      try {
        await fetch(`${API_BASE_URL}/analytics/presence`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            visitorId,
            path: pathname,
          }),
          keepalive: true,
        });
      } catch {
        // Presence tracking should never break the page.
      }
    };

    void sendHeartbeat();
    const interval = window.setInterval(() => {
      void sendHeartbeat();
    }, 30_000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void sendHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [pathname, shouldSkipTracking, visitorId]);

  /** Notify backend only when leaving a tracked session (e.g. storefront → admin), not on every admin paint. */
  useEffect(() => {
    if (!visitorId) return;
    const prev = prevSkipRef.current;
    if (prev === undefined) {
      prevSkipRef.current = shouldSkipTracking;
      return;
    }
    if (prev === false && shouldSkipTracking === true) {
      void fetch(`${API_BASE_URL}/analytics/presence/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visitorId,
          path: pathname,
        }),
        keepalive: true,
      }).catch(() => {
        // Presence cleanup should never break the page.
      });
    }
    prevSkipRef.current = shouldSkipTracking;
  }, [pathname, shouldSkipTracking, visitorId]);

  return null;
}
