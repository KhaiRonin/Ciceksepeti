'use client';

import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  iconColor?: string;
  description?: string;
  loading?: boolean;
}

export function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = 'text-primary',
  description,
  loading = false,
}: StatsCardProps) {
  const isPositive = (change ?? 0) >= 0;

  if (loading) {
    return (
      <Card className="border-border/60">
        <CardContent className="p-5">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-8 w-32 bg-muted rounded" />
            <div className="h-3 w-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground tabular-nums truncate">
              {value}
            </p>
          </div>
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10',
              iconColor.replace('text-', 'bg-').replace('-primary', '-primary/10'),
            )}
          >
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
        </div>

        {(change !== undefined || description) && (
          <div className="mt-3 flex items-center gap-1.5">
            {change !== undefined && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-medium',
                  isPositive ? 'text-emerald-600' : 'text-red-600',
                )}
              >
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {isPositive ? '+' : ''}{change?.toFixed(1)}%
              </span>
            )}
            {description && (
              <span className="text-xs text-muted-foreground">{description}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
