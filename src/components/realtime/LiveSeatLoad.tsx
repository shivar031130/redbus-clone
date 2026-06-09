'use client';

import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';

export interface SeatMetrics {
  total_seats: number;
  booked_seats: number;
  locked_seats: number;
  available_seats: number;
}

export interface ComputedOccupancy {
  total: number;
  occupied: number;
  percent: number;
  available: number;
}

export function computeSeatOccupancy(metrics: SeatMetrics | null): ComputedOccupancy {
  // Early return guard for null/undefined metrics
  if (!metrics) {
    return {
      total: 0,
      occupied: 0,
      percent: 0,
      available: 0,
    };
  }

  // TypeScript automatically knows metrics is NOT null here
  const total = metrics.total_seats;
  const occupied = metrics.booked_seats + metrics.locked_seats;
  const percent = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const available = metrics.available_seats;

  return {
    total,
    occupied,
    percent,
    available,
  };
}


type SeatStatusRow = {
  status: 'available' | 'selected' | 'booked' | 'locked';
};

interface LiveSeatLoadProps {
  scheduleId: string;
  compact?: boolean;
  className?: string;
  initialMetrics?: SeatMetrics | null;
}

export function LiveSeatLoad({ scheduleId, compact, className, initialMetrics }: LiveSeatLoadProps) {
  const supabase = useMemo(() => createClient(), []);
  const [metrics, setMetrics] = useState<SeatMetrics | null>(initialMetrics ?? null);

  useEffect(() => {
    let isMounted = true;

    const fetchSeatCounts = async () => {
      const { data: seats, error } = await supabase
        .from('seats')
        .select('status')
        .eq('schedule_id', scheduleId);

      if (error || !isMounted || !seats) return;

      const seatRows = seats as SeatStatusRow[];
      const total = seatRows.length;
      const booked = seatRows.filter((seat) => seat.status === 'booked').length;
      const locked = seatRows.filter((seat) => seat.status === 'locked').length;
      const available = Math.max(total - booked - locked, 0);
      setMetrics({ total_seats: total, booked_seats: booked, locked_seats: locked, available_seats: available });
    };

    const fetchMetrics = async () => {
      const { data, error } = await supabase
        .from('schedule_metrics')
        .select('total_seats, booked_seats, locked_seats, available_seats')
        .eq('schedule_id', scheduleId)
        .maybeSingle();

      if (!error && data && isMounted) {
        setMetrics(data as SeatMetrics);
        return;
      }

      await fetchSeatCounts();
    };

    fetchMetrics();

    const channel = supabase
      .channel(`live_seat_load_${scheduleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedule_metrics',
          filter: `schedule_id=eq.${scheduleId}`,
        },
        (payload) => {
          if (payload.new) setMetrics(payload.new as SeatMetrics);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seats',
          filter: `schedule_id=eq.${scheduleId}`,
        },
        () => {
          fetchSeatCounts();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [scheduleId, supabase]);

  const { total, occupied, percent, available } = computeSeatOccupancy(metrics);

  return (
    <div className={cn('rounded-2xl border border-border bg-white p-4 shadow-sm', className, compact && 'p-3')}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className={cn('text-sm font-semibold', compact && 'text-xs')}>Live Passenger Load</div>
          <div className={cn('text-xs text-muted-foreground', compact && 'text-[10px]')}>Realtime seat occupancy</div>
        </div>
        <div className={cn('text-sm font-bold text-primary', compact && 'text-xs')}>
          {total ? `${occupied}/${total}` : '--'}
        </div>
      </div>

      <div className="h-2 w-full rounded-full bg-secondary/60 overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className={cn('mt-3 text-xs text-muted-foreground flex justify-between', compact && 'mt-2 text-[10px]')}>
        <span>Available: {available}</span>
        <span>Occupied: {percent}%</span>
      </div>
    </div>
  );
}
