'use client';

import { SeatMap } from '@/components/booking/SeatMap';
import { LiveSeatLoad } from '@/components/realtime/LiveSeatLoad';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore, useBookingStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, ArrowRight, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo } from 'react';

type SeatLockRow = {
  seat_number: string;
  status: 'available' | 'selected' | 'booked' | 'locked';
  locked_by: string | null;
};

export default function SelectSeatsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 bg-secondary/20 py-12 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium font-sans">Loading seat layout...</p>
      </div>
    }>
      <SelectSeatsContent />
    </Suspense>
  );
}

function SelectSeatsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const scheduleId = searchParams.get('id');
  const supabase = useMemo(() => createClient(), []);
  const { user } = useAuthStore();
  const { selectedSchedule, selectedSeats, toggleSeat, searchQuery, setSelectedSeats, passengerDetails, setPassengerDetails } = useBookingStore();
  const passengersCount = searchQuery?.passengers || 1;
  const totalPrice = selectedSchedule ? selectedSeats.length * selectedSchedule.price : 0;

  useEffect(() => {
    // If user refreshes or comes directly here without a schedule selected, redirect back
    if (!selectedSchedule && !scheduleId) {
      router.push('/search');
    }
  }, [selectedSchedule, scheduleId, router]);

  useEffect(() => {
    if (!selectedSchedule?.id || selectedSeats.length === 0) return;

    let cancelled = false;

    const reconcileSelection = async () => {
      const userId = user?.id ?? null;
      const { data, error } = await supabase
        .from('seats')
        .select('seat_number, status, locked_by')
        .eq('schedule_id', selectedSchedule.id)
        .in('seat_number', selectedSeats);

      if (error || cancelled) return;

      const lockedByOwner = ((data ?? []) as SeatLockRow[])
        .filter((seat) => seat.status === 'locked' && (userId ? seat.locked_by === userId : !seat.locked_by))
        .map((seat) => seat.seat_number);

      const allowed = selectedSeats.filter((seat) => lockedByOwner.includes(seat) || !userId).slice(0, passengersCount);
      const toRelease = selectedSeats.filter((seat) => !allowed.includes(seat));

      if (toRelease.length > 0) {
        let releaseQuery = supabase
          .from('seats')
          .update({ status: 'available', locked_by: null, locked_at: null })
          .eq('schedule_id', selectedSchedule.id)
          .in('seat_number', toRelease)
          .eq('status', 'locked');

        if (userId) {
          releaseQuery = releaseQuery.eq('locked_by', userId);
        } else {
          releaseQuery = releaseQuery.is('locked_by', null);
        }

        await releaseQuery;
      }

      if (!cancelled && allowed.join('|') !== selectedSeats.join('|')) {
        setSelectedSeats(allowed);
        if (passengerDetails.length) {
          setPassengerDetails(passengerDetails.filter((p) => allowed.includes(p.seat)));
        }
      }
    };

    reconcileSelection();

    return () => {
      cancelled = true;
    };
  }, [passengersCount, passengerDetails, selectedSchedule?.id, selectedSeats, setPassengerDetails, setSelectedSeats, supabase, user?.id]);

  useEffect(() => {
    if (!selectedSchedule?.id) return;

    const LOCK_TIMEOUT_MS = 10 * 60 * 1000;
    let cancelled = false;

    const releaseStaleLocks = async () => {
      const cutoff = new Date(Date.now() - LOCK_TIMEOUT_MS).toISOString();
      await supabase
        .from('seats')
        .update({ status: 'available', locked_by: null, locked_at: null })
        .eq('schedule_id', selectedSchedule.id)
        .eq('status', 'locked')
        .lt('locked_at', cutoff);
    };

    releaseStaleLocks();
    const timer = setInterval(() => {
      if (!cancelled) releaseStaleLocks();
    }, 60000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [selectedSchedule?.id, supabase]);

  const handleContinue = () => {
    if (selectedSeats.length === 0) return;
    router.push('/booking/details');
  };

  if (!selectedSchedule) {
    return <div className="p-24 text-center">Loading schedule data...</div>;
  }

  return (
    <div className="flex-1 bg-secondary/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <Link href="/search" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Search Results
          </Link>
          <h1 className="text-3xl font-bold mt-4">Select Your Seats</h1>
          <p className="text-muted-foreground mt-1">Choose {passengersCount} seat{passengersCount > 1 ? 's' : ''} for your journey.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Seat Map Area */}
          <div className="flex-1 flex justify-center bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <SeatMap 
              scheduleId={selectedSchedule.id} 
              busId={selectedSchedule.bus_id}
              totalSeats={selectedSchedule.totalSeats}
              seatLayout={selectedSchedule.seatLayout}
              selectedSeats={selectedSeats}
              onSeatToggle={toggleSeat}
              maxSeats={passengersCount}
            />
          </div>

          {/* Booking Summary Sidebar */}
          <div className="w-full lg:w-96 shrink-0">
            <div className="sticky top-24">
              <Card className="border-none shadow-md rounded-2xl overflow-hidden">
                <div className="bg-primary p-6 text-white">
                  <h3 className="font-semibold text-lg mb-4">Journey Summary</h3>
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-blue-100">{selectedSchedule.operator}</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{selectedSchedule.type}</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-lg mt-4">
                    <span>{searchQuery?.origin || 'Kuala Lumpur'}</span>
                    <ArrowRight className="h-4 w-4 text-accent" />
                    <span>{searchQuery?.destination || 'Penang'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-100 mt-2">
                    <Clock className="h-4 w-4" /> {selectedSchedule.departureTime} - {selectedSchedule.arrivalTime}
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <LiveSeatLoad scheduleId={selectedSchedule.id} compact />
                    <div className="flex justify-between items-center pb-4 border-b">
                      <span className="text-muted-foreground">Selected Seats</span>
                      <span className="font-medium">
                        {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center pb-4 border-b">
                      <span className="text-muted-foreground">Price per seat</span>
                      <span className="font-medium">RM {selectedSchedule.price.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="font-bold text-lg">Total Amount</span>
                      <span className="font-bold text-2xl text-primary">RM {totalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-8 h-12 text-lg rounded-xl" 
                    disabled={selectedSeats.length === 0 || selectedSeats.length !== passengersCount}
                    onClick={handleContinue}
                  >
                    Continue to Details
                  </Button>
                  
                  {selectedSeats.length > 0 && selectedSeats.length < passengersCount && (
                    <p className="text-center text-sm text-orange-500 mt-3">
                      Please select {passengersCount - selectedSeats.length} more seat{passengersCount - selectedSeats.length > 1 ? 's' : ''}.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
