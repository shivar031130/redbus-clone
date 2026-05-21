'use client';

import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';

interface ScheduleUpdate {
  id: string;
  status: string;
  message: string | null;
  estimated_departure_time: string | null;
  estimated_arrival_time: string | null;
  delay_minutes: number | null;
  created_at: string;
}

interface ScheduleUpdatesPanelProps {
  scheduleId: string;
  scheduledDeparture?: string | null;
  scheduledArrival?: string | null;
  className?: string;
}

const formatTime = (iso?: string | null) => {
  if (!iso) return 'TBA';
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};

export function ScheduleUpdatesPanel({
  scheduleId,
  scheduledDeparture,
  scheduledArrival,
  className,
}: ScheduleUpdatesPanelProps) {
  const supabase = useMemo(() => createClient(), []);
  const [updates, setUpdates] = useState<ScheduleUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('schedule_updates')
        .select('id, status, message, estimated_departure_time, estimated_arrival_time, delay_minutes, created_at')
        .eq('schedule_id', scheduleId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && isMounted) {
        setUpdates((data ?? []) as ScheduleUpdate[]);
      }
      if (isMounted) setLoading(false);
    };

    load();

    const channel = supabase
      .channel(`schedule_updates_${scheduleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'schedule_updates',
          filter: `schedule_id=eq.${scheduleId}`,
        },
        (payload) => {
          setUpdates((current) => [payload.new as ScheduleUpdate, ...current].slice(0, 10));
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [scheduleId, supabase]);

  const latest = updates[0];

  return (
    <Card className={cn('p-5 space-y-4', className)}>
      <div>
        <h3 className="text-lg font-semibold">Schedule and ETA Updates</h3>
        <p className="text-sm text-muted-foreground">Live service status and delay notifications.</p>
      </div>

      <div className="rounded-xl border border-border bg-secondary/20 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Latest Status</div>
            <div className="text-lg font-semibold text-primary">
              {latest?.status ?? 'Scheduled'}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Departs: {formatTime(latest?.estimated_departure_time ?? scheduledDeparture)}
            <span className="mx-2">|</span>
            Arrives: {formatTime(latest?.estimated_arrival_time ?? scheduledArrival)}
          </div>
        </div>
        {latest?.delay_minutes ? (
          <div className="mt-2 text-sm text-amber-600 font-medium">
            Delay: {latest.delay_minutes} minutes
          </div>
        ) : null}
        {latest?.message ? (
          <div className="mt-2 text-sm text-muted-foreground">{latest.message}</div>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Update Timeline</div>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading updates...</div>
        ) : updates.length === 0 ? (
          <div className="text-sm text-muted-foreground">No updates yet. Check back closer to departure.</div>
        ) : (
          updates.map((update) => (
            <div key={update.id} className="flex items-start gap-3 border-b border-dashed border-border pb-3">
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {update.status} - {formatTime(update.created_at)}
                </div>
                {update.message ? (
                  <div className="text-xs text-muted-foreground">{update.message}</div>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
