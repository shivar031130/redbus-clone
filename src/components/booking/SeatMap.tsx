'use client';

import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Armchair } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type SeatStatus = 'available' | 'selected' | 'booked' | 'locked';

interface Seat {
  id: string;
  seat_number: string;
  status: SeatStatus;
  locked_by?: string | null;
}

type SeatRecord = {
  id: string;
  seat_number: string;
  status: SeatStatus;
  locked_by?: string | null;
};

const mapSeatRecord = (seat: SeatRecord): Seat => ({
  id: seat.id,
  seat_number: seat.seat_number,
  status: seat.status,
  locked_by: seat.locked_by ?? null
});

interface SeatMapProps {
  scheduleId: string;
  busId: string;
  totalSeats?: number;
  seatLayout?: '2-1' | '2-2';
  selectedSeats: string[];
  onSeatToggle: (seatNumber: string) => void;
  maxSeats?: number;
}

export function SeatMap({ scheduleId, busId, totalSeats = 0, seatLayout = '2-1', selectedSeats, onSeatToggle, maxSeats = 4 }: SeatMapProps) {
  const supabase = useMemo(() => createClient(), []);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const layout = useMemo(() => (
    seatLayout === '2-2'
      ? { left: ['A', 'B'], right: ['C', 'D'] }
      : { left: ['A'], right: ['B', 'C'] }
  ), [seatLayout]);
  const columns = useMemo(() => [...layout.left, ...layout.right], [layout]);
  const seatCapacity = totalSeats > 0 ? totalSeats : seats.length;
  const rows = seatCapacity > 0 ? Math.ceil(seatCapacity / columns.length) : 0;

  const buildSeatNumbers = useCallback((count: number) => {
    const numbers: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const row = Math.floor(i / columns.length) + 1;
      const column = columns[i % columns.length];
      numbers.push(`${row}${column}`);
    }
    return numbers;
  }, [columns]);

  const fetchSeats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('seats')
        .select('id, seat_number, status, locked_by')
        .eq('schedule_id', scheduleId);

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped = (data as SeatRecord[]).map(mapSeatRecord);

        setSeats(mapped);

        if (totalSeats > 0 && mapped.length < totalSeats) {
          const existing = new Set(mapped.map((s) => s.seat_number));
          const missingNumbers = buildSeatNumbers(totalSeats).filter((num) => !existing.has(num));

          if (missingNumbers.length > 0) {
            const missingSeats = missingNumbers.map((seatNumber) => ({
              schedule_id: scheduleId,
              bus_id: busId,
              seat_number: seatNumber,
              status: 'available',
            }));

            const { data: inserted, error: insertError } = await supabase
              .from('seats')
              .upsert(missingSeats, { onConflict: 'schedule_id, seat_number', ignoreDuplicates: true })
              .select('id, seat_number, status, locked_by');

            if (!insertError && inserted?.length) {
              const merged = [
                ...mapped,
                ...(inserted as SeatRecord[]).map(mapSeatRecord)
              ];
              setSeats(merged);
            }
          }
        }
      } else {
        // Fallback: If no seats exist in database for this schedule, create them dynamically
        const initialSeatNumbers = buildSeatNumbers(totalSeats);
        const initialSeats = initialSeatNumbers.map((seatNumber) => ({
          schedule_id: scheduleId,
          bus_id: busId,
          seat_number: seatNumber,
          status: 'available',
        }));

        if (initialSeats.length === 0) {
          setSeats([]);
          return;
        }
        
        // Use upsert to avoid race conditions (e.g. React Strict Mode double‑firing)
        const { data: upserted, error: upsertError } = await supabase
          .from('seats')
          .upsert(initialSeats, { onConflict: 'schedule_id, seat_number', ignoreDuplicates: true })
          .select('id, seat_number, status, locked_by');

        // If upsert fails with a generic error object (e.g. empty {}), fall back to a plain fetch.
        if (upsertError) {
          console.warn('Upsert seats error, attempting plain fetch:', upsertError);
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('seats')
            .select('id, seat_number, status, locked_by')
            .eq('schedule_id', scheduleId);
          if (fallbackError) throw fallbackError;
          if (fallbackData) setSeats((fallbackData as SeatRecord[]).map(mapSeatRecord));
        } else if (upserted && upserted.length > 0) {
          setSeats((upserted as SeatRecord[]).map(mapSeatRecord));
        } else {
          // No rows were inserted because they already exist – fetch the existing rows.
          const { data: existing, error: existingError } = await supabase
            .from('seats')
            .select('id, seat_number, status, locked_by')
            .eq('schedule_id', scheduleId);
          if (existingError) throw existingError;
          if (existing) setSeats((existing as SeatRecord[]).map(mapSeatRecord));
        }

      }
    } catch (err: unknown) {
      console.error("DB Seat Query Failed:", err);
      // Clean UI Mock fallback so the user is never blocked
      const localFallback: Seat[] = [];
      buildSeatNumbers(Math.max(totalSeats, 0)).forEach((seatNumber) => {
        localFallback.push({ id: `s-${seatNumber}`, seat_number: seatNumber, status: 'available', locked_by: null });
      });
      setSeats(localFallback);
    } finally {
      setLoading(false);
    }
  }, [buildSeatNumbers, busId, scheduleId, supabase, totalSeats]);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) return;
      setCurrentUserId(data.user?.id ?? null);
    });

    queueMicrotask(() => {
      if (isMounted) void fetchSeats();
    });

    // Set up Supabase Realtime Channel to keep seats synchronized across browsers!
    const channel = supabase
      .channel(`seats_updates_${scheduleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seats',
          filter: `schedule_id=eq.${scheduleId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const deletedSeat = payload.old as Partial<SeatRecord>;
            if (!deletedSeat?.seat_number) return;
            setSeats((current) => current.filter((s) => s.seat_number !== deletedSeat.seat_number));
            return;
          }

          const updatedSeat = payload.new as Partial<SeatRecord>;
          if (updatedSeat?.id && updatedSeat.seat_number && updatedSeat.status) {
            setSeats((current) => {
              const nextSeat: Seat = {
                id: updatedSeat.id as string,
                seat_number: updatedSeat.seat_number as string,
                status: updatedSeat.status as SeatStatus,
                locked_by: updatedSeat.locked_by ?? null
              };
              const exists = current.some((s) => s.seat_number === updatedSeat.seat_number);
              return exists
                ? current.map((s) => (s.seat_number === updatedSeat.seat_number ? nextSeat : s))
                : [...current, nextSeat];
            });
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [fetchSeats, scheduleId, supabase]);

  const handleSeatClick = async (seat: Seat) => {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? null;
    const isOwnedLock = seat.status === 'locked' && (seat.locked_by === userId || (!seat.locked_by && selectedSeats.includes(seat.seat_number)));

    if (seat.status === 'booked') {
      toast.error('Seat is not available');
      return;
    }

    if (seat.status === 'locked' && !isOwnedLock) {
      toast.error('Seat is locked by another traveler');
      return;
    }

    const isSelected = selectedSeats.includes(seat.seat_number) || isOwnedLock;

    if (!isSelected && selectedSeats.length >= maxSeats) {
      toast.warning(`You can only select up to ${maxSeats} seats.`);
      return;
    }

    const newStatus = isSelected ? 'available' : 'locked';
    const nextLockedBy = newStatus === 'locked' ? userId : null;
    const updateLocalSeat = () => {
      setSeats((current) =>
        current.map((s) =>
          s.seat_number === seat.seat_number
            ? { ...s, status: newStatus, locked_by: nextLockedBy }
            : s
        )
      );
    };

    try {
      // Only attempt DB update if it's a real UUID (not a local fallback 's-1A' id)
      if (!seat.id.startsWith('s-')) {
        let updateQuery = supabase
          .from('seats')
          .update({
            status: newStatus,
            locked_at: newStatus === 'locked' ? new Date().toISOString() : null,
            locked_by: nextLockedBy
          })
          .eq('id', seat.id);

        if (newStatus === 'locked') {
          updateQuery = updateQuery.eq('status', 'available');
        } else {
          updateQuery = updateQuery.eq('status', 'locked');
          updateQuery = userId ? updateQuery.eq('locked_by', userId) : updateQuery.is('locked_by', null);
        }

        const { data: updatedSeats, error: updateError } = await updateQuery.select('id');

        if (updateError) throw updateError;
        if (!updatedSeats?.length) {
          toast.error('Seat status changed. Please try another seat.');
          fetchSeats();
          return;
        }
      }

      updateLocalSeat();
      onSeatToggle(seat.seat_number);
    } catch (err: unknown) {
      console.error("Failed to update seat in DB:", err);
      if (seat.id.startsWith('s-')) {
        updateLocalSeat();
        onSeatToggle(seat.seat_number);
      } else {
        toast.error('Could not reserve this seat. Please try again.');
        fetchSeats();
      }
    }
  };

  const renderSeat = (seatNumber: string) => {
    const seat = seats.find(s => s.seat_number === seatNumber);
    if (!seat) return <div className="w-12 h-14" key={seatNumber}></div>;

    const isOwnedLock = seat.status === 'locked' && (seat.locked_by === currentUserId || (!seat.locked_by && selectedSeats.includes(seat.seat_number)));
    const isSelected = selectedSeats.includes(seat.seat_number) || isOwnedLock;
    let statusClass = 'bg-white border-gray-200 text-gray-400 hover:border-primary hover:text-primary';
    
    if (seat.status === 'booked') {
      statusClass = 'bg-gray-100 border-gray-100 text-gray-300 cursor-not-allowed opacity-50';
    } else if (seat.status === 'locked' && !isOwnedLock) {
      statusClass = 'bg-orange-50 border-orange-200 text-orange-400 cursor-not-allowed';
    } else if (isSelected) {
      statusClass = 'bg-primary border-primary text-white shadow-md shadow-primary/20 scale-105';
    }

    return (
      <button
        key={seat.id}
        onClick={() => handleSeatClick(seat)}
        disabled={seat.status === 'booked' || (seat.status === 'locked' && !isOwnedLock)}
        className={cn(
          'relative w-12 h-14 rounded-t-2xl rounded-b-md border-2 flex items-center justify-center transition-all duration-200 hover:scale-105 group cursor-pointer focus:outline-none',
          statusClass
        )}
      >
        <span className="absolute -top-8 opacity-0 group-hover:opacity-100 text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded transition-all duration-200 pointer-events-none z-10 whitespace-nowrap shadow-md">
          Seat {seat.seat_number}
        </span>
        <Armchair className={cn("w-7 h-7 transition-colors", isSelected ? "text-white" : "text-slate-400")} strokeWidth={1.5} />
      </button>
    );
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="text-sm text-muted-foreground">Constructing seat grid...</p>
      </div>
    );
  }

  if (seatCapacity === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        No seat layout available. Please check the bus seat capacity.
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm inline-block w-full max-w-md">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
        <div className="flex gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded-full border border-gray-300 bg-white"></div> Available</div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded-full border border-primary bg-primary"></div> Selected</div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded-full border border-gray-200 bg-gray-200"></div> Booked</div>
        </div>
      </div>

      <div className="flex flex-col gap-4 items-center bg-slate-50/50 p-6 rounded-2xl border border-dashed border-slate-200">
        <div className="w-full text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/60 pb-3">
          Front of Bus / Driver Cabin
        </div>
        
        <div className="flex flex-col gap-3 w-full">
          {Array.from({ length: rows }).map((_, rowIndex) => {
            const rowNum = rowIndex + 1;
            const renderSeatSlot = (columnIndex: number, column: string) => {
              const seatIndex = rowIndex * columns.length + columnIndex;
              const seatNumber = `${rowNum}${column}`;
              if (seatIndex >= seatCapacity) {
                return <div key={`empty-${seatNumber}`} className="w-12 h-14" />;
              }
              return renderSeat(seatNumber);
            };

            return (
              <div key={rowNum} className="flex gap-8 w-full justify-between items-center px-4">
                <div className="flex gap-3">
                  {layout.left.map((column, idx) => renderSeatSlot(idx, column))}
                </div>
                <div className="text-xs font-bold text-slate-300 w-6 text-center">{rowNum}</div>
                <div className="flex gap-3">
                  {layout.right.map((column, idx) => renderSeatSlot(layout.left.length + idx, column))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
