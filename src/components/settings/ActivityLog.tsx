'use client';

import { motion } from 'framer-motion';
import {
  PlusCircle,
  Trash2,
  UserPlus,
  Globe,
  Settings,
  Bot,
  CreditCard,
  Circle,
  Search,
  Users,
  Box,
  ShieldCheck,
  ChevronRight,
  Info,
  Calendar,
  User,
  Activity,
  Loader2,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
} from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface ActivityLogFeedProps {
  logs: AuditLog[];
}

const getActionIcon = (action: string, entityType: string) => {
  const a = action.toLowerCase();
  const e = entityType.toLowerCase();

  if (a.includes('create'))
    return <PlusCircle className="h-4 w-4 text-emerald-400" />;
  if (a.includes('delete') || a.includes('remove'))
    return <Trash2 className="h-4 w-4 text-rose-400" />;
  if (a.includes('invite'))
    return <UserPlus className="h-4 w-4 text-sky-400" />;
  if (a.includes('role') || a.includes('permission') || a.includes('rbac'))
    return <ShieldCheck className="h-4 w-4 text-amber-400" />;
  if (e.includes('domain'))
    return <Globe className="h-4 w-4 text-indigo-400" />;
  if (a.includes('subscription') || e.includes('billing') || a.includes('plan'))
    return <CreditCard className="h-4 w-4 text-violet-400" />;
  if (a.includes('accept'))
    return <Circle className="h-4 w-4 text-emerald-400" />;
  if (e.includes('project'))
    return <Box className="h-4 w-4 text-orange-400" />;

  return <Settings className="h-4 w-4 text-zinc-400" />;
};

export function ActivityLogFeed({ logs }: ActivityLogFeedProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('Settings.activity');

  const currentQuery = searchParams.get('q') || '';
  const currentType = searchParams.get('type') || 'all';

  const [search, setSearch] = useState(currentQuery);
  const debouncedSearch = useDebounce(search, 300);

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor(
      (now.getTime() - new Date(date).getTime()) / 1000
    );

    if (diffInSeconds < 0) return t('relativeTime.justNow');
    if (diffInSeconds < 60) return t('relativeTime.justNow');

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return t('relativeTime.minutes', { count: diffInMinutes });

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return t('relativeTime.hours', { count: diffInHours });

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return t('relativeTime.days', { count: diffInDays });

    return new Date(date).toLocaleDateString();
  };

  const filterTabs = [
    { id: 'all', label: t('filters.all'), icon: Activity },
    { id: 'PROJECT', label: t('filters.projects'), icon: Box },
    { id: 'MEMBER', label: t('filters.members'), icon: Users },
    { id: 'BILLING', label: t('filters.billing'), icon: CreditCard },
    { id: 'ROLE', label: t('filters.security'), icon: ShieldCheck },
    { id: 'SETTINGS', label: t('filters.settings'), icon: Settings },
  ];

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const existingQ = params.get('q') || '';

    if (debouncedSearch === existingQ) return;

    if (debouncedSearch) {
      params.set('q', debouncedSearch);
    } else {
      params.delete('q');
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }, [debouncedSearch, pathname, router, searchParams]);

  const handleTypeChange = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const existingType = params.get('type') || 'all';

    if (type === existingType) return;

    if (type === 'all') {
      params.delete('type');
    } else {
      params.set('type', type);
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const groupedLogs = useMemo(() => {
    return logs.reduce((acc, log) => {
      const date = new Date(log.createdAt);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      let dateKey = date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      if (date.toDateString() === today.toDateString()) {
        dateKey = t('today');
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = t('yesterday');
      }

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(log);
      return acc;
    }, {} as Record<string, AuditLog[]>);
  }, [logs, t]);

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder={t('searchPlaceholder')}
            className="pl-9 bg-zinc-900/50 border-zinc-800 focus:border-zinc-700 transition-colors h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-x-auto no-scrollbar max-w-full">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTypeChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap',
                currentType === tab.id
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
          <div className="h-16 w-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4 border border-zinc-800">
            <Activity className="h-8 w-8 text-zinc-700" />
          </div>
          <h3 className="text-lg font-medium text-zinc-300">
            {t('empty.title')}
          </h3>
          <p className="text-sm text-zinc-500 max-w-xs mt-1">
            {t('empty.description')}
          </p>
          <Button
            variant="ghost"
            className="mt-4 text-zinc-400 hover:text-white"
            onClick={() => {
              setSearch('');
              handleTypeChange('all');
            }}
          >
            {t('empty.clear')}
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            'relative transition-opacity duration-300',
            isPending && 'opacity-50 pointer-events-none'
          )}
        >
          {isPending && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <Loader2 className="h-8 w-8 text-zinc-500 animate-spin" />
            </div>
          )}

          <div className="space-y-8">
            {Object.entries(groupedLogs).map(([date, dateLogs]) => (
              <div key={date} className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-zinc-800/50" />
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-950 px-3 py-1 rounded-full border border-zinc-800/50">
                    {date}
                  </span>
                  <div className="h-px flex-1 bg-zinc-800/50" />
                </div>

                <div className="relative space-y-4">
                  {/* Vertical line per group */}
                  <div className="absolute left-6 top-4 bottom-4 w-px bg-gradient-to-b from-zinc-800 via-zinc-800 to-transparent" />

                  {dateLogs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="relative pl-12 group"
                    >
                      {/* Icon Circle */}
                      <div className="absolute left-6 top-3 -translate-x-1/2 flex items-center justify-center h-8 w-8 rounded-full bg-zinc-950 border border-zinc-800 shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 group-hover:border-zinc-700 transition-colors">
                        {getActionIcon(log.action, log.entityType)}
                      </div>

                      <div
                        onClick={() => setSelectedLog(log)}
                        className="bg-zinc-900/40 border border-zinc-800/50 hover:border-zinc-700/50 rounded-xl p-4 transition-all cursor-pointer hover:bg-zinc-900/60 shadow-sm relative overflow-hidden group/card"
                      >
                        {/* Hover Glow */}
                        <div className="absolute inset-0 bg-gradient-to-r from-zinc-800/0 via-zinc-800/5 to-zinc-800/0 opacity-0 group-hover/card:opacity-100 transition-opacity" />

                        <div className="flex items-start justify-between gap-4 relative z-10">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-10 w-10 border border-zinc-800 shadow-sm ring-2 ring-transparent group-hover/card:ring-zinc-800 transition-all">
                              {log.userId === 'system' ? (
                                <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-zinc-400">
                                  <Bot className="h-5 w-5" />
                                </div>
                              ) : (
                                <AvatarFallback className="bg-gradient-to-br from-zinc-800 to-zinc-900 text-xs text-zinc-300 font-bold">
                                  {log.userName
                                    ? log.userName.slice(0, 2).toUpperCase()
                                    : 'U'}
                                </AvatarFallback>
                              )}
                            </Avatar>

                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-zinc-100 text-sm">
                                  {log.userName || t('modal.user')}
                                </span>
                                <span className="text-zinc-500 text-xs font-medium">
                                  {log.action.replace(/_/g, ' ').toLowerCase()}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-medium">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span>{log.userEmail}</span>
                                </div>
                                <span className="h-1 w-1 rounded-full bg-zinc-800" />
                                <div className="flex items-center gap-1">
                                  <Info className="h-3 w-3" />
                                  <span>{log.ipAddress}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 bg-zinc-800/50 px-2 py-1 rounded-full border border-zinc-700/30">
                              <Calendar className="h-3 w-3" />
                              {isClient
                                ? formatRelativeTime(log.createdAt)
                                : 'Loading...'}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-zinc-950 text-zinc-400 border border-zinc-800 uppercase tracking-wider">
                                {log.entityType}
                              </span>
                              <ChevronRight className="h-3.5 w-3.5 text-zinc-700 group-hover/card:text-zinc-400 group-hover/card:translate-x-0.5 transition-all" />
                            </div>
                          </div>
                        </div>

                        {log.details && (
                          <div className="mt-4 pt-3 border-t border-zinc-800/30">
                            <p className="text-xs text-zinc-400 font-medium leading-relaxed line-clamp-1">
                              {log.details}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Details Modal */}
      <Dialog
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <DialogContent className="bg-zinc-950 border-zinc-800 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-zinc-100 flex items-center gap-2">
              <Activity className="h-5 w-5 text-zinc-400" />
              {t('modal.title')}
            </DialogTitle>
            <DialogDescription className="text-zinc-500">
              {t('modal.description')}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                    {t('modal.user')}
                  </p>
                  <p className="text-sm text-zinc-200 font-medium">
                    {selectedLog.userName}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                    {t('modal.email')}
                  </p>
                  <p className="text-sm text-zinc-200 font-medium">
                    {selectedLog.userEmail}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                    {t('modal.action')}
                  </p>
                  <p className="text-sm text-zinc-200 font-medium uppercase tracking-tight">
                    {selectedLog.action}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                    {t('modal.type')}
                  </p>
                  <p className="text-sm text-zinc-200 font-medium">
                    {selectedLog.entityType}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                    {t('modal.date')}
                  </p>
                  <p className="text-sm text-zinc-200 font-medium">
                    {isClient
                      ? new Date(selectedLog.createdAt).toLocaleString()
                      : 'Loading...'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                    {t('modal.ip')}
                  </p>
                  <p className="text-sm text-zinc-200 font-medium font-mono">
                    {selectedLog.ipAddress}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  {t('modal.summary')}
                </p>
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300">
                  {selectedLog.details}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  {t('modal.userAgent')}
                </p>
                <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-[10px] text-zinc-500 font-mono break-all leading-normal">
                  {selectedLog.userAgent}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="outline"
              className="border-zinc-800"
              onClick={() => setSelectedLog(null)}
            >
              {t('modal.close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

