'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Activity, AlertCircle, Info, CheckCircle2, XCircle,
  Search, RefreshCw, Download,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { adminLogService } from '@/services/dashboard.service';
import { AdminLogEntry } from '@/types/admin';

type LogLevel = AdminLogEntry['level'];

const LEVEL_CONFIG: Record<LogLevel, { icon: React.ElementType; label: string; className: string; badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  info: { icon: Info, label: 'Bilgi', className: 'text-blue-600', badgeVariant: 'secondary' },
  warn: { icon: AlertCircle, label: 'Uyarı', className: 'text-amber-600', badgeVariant: 'outline' },
  error: { icon: XCircle, label: 'Hata', className: 'text-red-600', badgeVariant: 'destructive' },
  success: { icon: CheckCircle2, label: 'Başarı', className: 'text-emerald-600', badgeVariant: 'default' },
};

export default function LogsPage() {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: () => adminLogService.getAll(300),
  });

  const filtered = useMemo(() => logs.filter((log) => {
    if (levelFilter !== 'all' && log.level !== levelFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        log.details?.toLowerCase().includes(q) ||
        log.user?.toLowerCase().includes(q) ||
        log.ip?.includes(q)
      );
    }
    return true;
  }), [logs, levelFilter, search]);

  const counts = useMemo(() => ({
    error: logs.filter((l) => l.level === 'error').length,
    warn: logs.filter((l) => l.level === 'warn').length,
    info: logs.filter((l) => l.level === 'info').length,
    success: logs.filter((l) => l.level === 'success').length,
  }), [logs]);

  function refresh() {
    void refetch();
  }

  function downloadLogs() {
    const content = filtered.map((l) =>
      `[${l.createdAt}] [${l.level.toUpperCase()}] ${l.message}${l.details ? ' — ' + l.details : ''}${l.user ? ' | user: ' + l.user : ''}${l.ip ? ' | ip: ' + l.ip : ''}`
    ).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-logs-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Sistem Logları</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Admin işlemleri ve sistem olayları</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={refresh}>
            <RefreshCw className="h-3.5 w-3.5" /> Yenile
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={downloadLogs}>
            <Download className="h-3.5 w-3.5" /> İndir
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {(Object.entries(counts) as [LogLevel, number][]).map(([level, count]) => {
          const cfg = LEVEL_CONFIG[level];
          const Icon = cfg.icon;
          return (
            <Card key={level} className="border-border/60 cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => setLevelFilter(levelFilter === level ? 'all' : level)}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Icon className={cn('h-4 w-4', cfg.className)} />
                  <p className="text-xs text-muted-foreground capitalize">{cfg.label}</p>
                </div>
                <p className="text-xl font-bold mt-1">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative w-full sm:flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
        <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v as LogLevel | 'all')}>
          <SelectTrigger className="w-full sm:w-32 h-8 text-sm">
            <SelectValue placeholder="Seviye" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="error">Hata</SelectItem>
            <SelectItem value="warn">Uyarı</SelectItem>
            <SelectItem value="success">Başarı</SelectItem>
            <SelectItem value="info">Bilgi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Log entries */}
      <Card className="border-border/60">
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> {filtered.length} kayıt
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[520px]">
            <div className="divide-y divide-border/40">
              {isLoading ? (
                <div className="py-16 text-center text-sm text-muted-foreground">
                  Loglar yükleniyor...
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-sm text-muted-foreground">
                  Kayıt bulunamadı
                </div>
              ) : (
                filtered.map((log) => {
                  const cfg = LEVEL_CONFIG[log.level];
                  const Icon = cfg.icon;
                  return (
                    <div key={log.id} className="flex gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                      <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', cfg.className)} />
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{log.message}</span>
                          <Badge variant={cfg.badgeVariant} className="text-[10px] px-1.5 h-4">
                            {cfg.label}
                          </Badge>
                        </div>
                        {log.details && (
                          <p className="text-xs text-muted-foreground">{log.details}</p>
                        )}
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60">
                          <span>{format(parseISO(log.createdAt), 'dd MMM yyyy HH:mm', { locale: tr })}</span>
                          {log.user && <span>· {log.user}</span>}
                          {log.ip && <span>· {log.ip}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
