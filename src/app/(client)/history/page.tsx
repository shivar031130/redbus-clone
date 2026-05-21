'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { ArrowRight, Download, Loader2, QrCode, RefreshCw, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const statusBadge: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'Upcoming', className: 'bg-primary/10 text-primary border-none' },
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-none' },
  completed: { label: 'Completed', className: 'bg-slate-100 text-slate-700 border-none' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700 border-none' },
};

interface Booking {
  id: string;
  booking_reference: string;
  total_amount: number;
  status: string;
  created_at: string;
  schedules: {
    departure_time: string;
    arrival_time: string;
    routes: { origin: string; destination: string } | null;
    buses: { bus_type: string; plate_number: string } | null;
  } | null;
  booking_passengers: { passenger_name: string; seats: { seat_number: string } | null }[];
}

export default function BookingHistoryPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const supabase = createClient();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [rateTarget, setRateTarget] = useState<Booking | null>(null);
  const [rating, setRating] = useState(0);
  const [ratingNote, setRatingNote] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`id, booking_reference, total_amount, status, created_at,
          schedules(departure_time, arrival_time,
            routes(origin, destination),
            buses(bus_type, plate_number)
          ),
          booking_passengers(passenger_name, seats(seat_number))
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBookings((data ?? []) as unknown as Booking[]);
    } catch (err: any) {
      toast.error('Failed to load bookings: ' + (err.message ?? 'Error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  const handleDownloadTicket = (booking: Booking) => {
    const content = `
BusSphere E-Ticket
==================
Reference: ${booking.booking_reference}
Route: ${booking.schedules?.routes?.origin} → ${booking.schedules?.routes?.destination}
Departure: ${booking.schedules?.departure_time ? format(new Date(booking.schedules.departure_time), 'dd MMM yyyy, HH:mm') : '—'}
Arrival: ${booking.schedules?.arrival_time ? format(new Date(booking.schedules.arrival_time), 'dd MMM yyyy, HH:mm') : '—'}
Bus: ${booking.schedules?.buses?.bus_type} (${booking.schedules?.buses?.plate_number})
Passengers: ${booking.booking_passengers.map((p) => `${p.passenger_name} – Seat ${p.seats?.seat_number ?? '—'}`).join(', ')}
Total: RM ${Number(booking.total_amount).toFixed(2)}
Status: ${booking.status.toUpperCase()}
==================
Thank you for choosing BusSphere!
    `.trim();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${booking.booking_reference}-eticket.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('E-Ticket downloaded!');
  };

  const handleSubmitRating = async () => {
    if (!rateTarget || rating === 0) { toast.error('Please select a star rating.'); return; }
    setSubmittingRating(true);
    try {
      await supabase.from('reviews').insert({
        client_id: user?.id,
        schedule_id: (rateTarget.schedules as any)?.id ?? null,
        rating,
        comment: ratingNote,
      });
      toast.success('Thank you for your review!');
      setRateTarget(null);
      setRating(0);
      setRatingNote('');
    } catch (err: any) {
      toast.error('Failed to submit review: ' + (err.message ?? 'Error'));
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <p className="text-muted-foreground mt-1">View and manage your past and upcoming tickets.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p>No bookings yet.</p>
          <a href="/search" className="text-primary font-semibold hover:underline mt-2 inline-block">Find your first ticket →</a>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => {
            const status = statusBadge[booking.status] ?? { label: booking.status, className: 'bg-gray-100 text-gray-700 border-none' };
            const isUpcoming = booking.status === 'confirmed' || booking.status === 'pending';
            const isCompleted = booking.status === 'completed';

            return (
              <Card
                key={booking.id}
                className={`shadow-sm overflow-hidden relative ${isUpcoming ? 'border-primary/20' : 'border-border/50 opacity-80 hover:opacity-100 transition-opacity'}`}
              >
                {isUpcoming && <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-primary" />}
                <CardContent className="p-0 flex flex-col md:flex-row">
                  <div className="flex-1 p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge className={status.className + ' mb-2'}>{status.label}</Badge>
                        <h3 className="text-lg font-bold">
                          {booking.schedules?.buses?.bus_type ?? 'Bus'} Service
                        </h3>
                        <p className="text-sm text-muted-foreground">{booking.schedules?.buses?.plate_number}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Booking Ref</div>
                        <div className="font-mono font-bold text-sm">{booking.booking_reference}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-secondary/30 p-4 rounded-xl border border-dashed border-border/60">
                      <div className="flex-1 text-center">
                        <div className="font-bold text-xl">
                          {booking.schedules?.departure_time ? format(new Date(booking.schedules.departure_time), 'HH:mm') : '—'}
                        </div>
                        <div className="text-xs text-muted-foreground">{booking.schedules?.routes?.origin ?? '—'}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 text-center">
                        <div className="font-bold text-xl">
                          {booking.schedules?.arrival_time ? format(new Date(booking.schedules.arrival_time), 'HH:mm') : '—'}
                        </div>
                        <div className="text-xs text-muted-foreground">{booking.schedules?.routes?.destination ?? '—'}</div>
                      </div>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {booking.schedules?.departure_time
                          ? format(new Date(booking.schedules.departure_time), 'dd MMM yyyy')
                          : format(new Date(booking.created_at), 'dd MMM yyyy')}
                        {booking.booking_passengers.length > 0 && (
                          <> &bull; Seats: {booking.booking_passengers.map((p) => p.seats?.seat_number ?? '?').join(', ')}</>
                        )}
                      </span>
                      <span className="font-semibold">Total: RM {Number(booking.total_amount).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 border-t md:border-t-0 md:border-l p-6 flex flex-col items-center justify-center gap-3 md:w-48 shrink-0">
                    {isUpcoming && (
                      <>
                        <div className="p-2 border-2 border-gray-900 rounded bg-white">
                          <QrCode className="h-14 w-14" />
                        </div>
                        <Button size="sm" variant="outline" className="w-full" onClick={() => handleDownloadTicket(booking)}>
                          <Download className="mr-2 h-4 w-4" /> e-Ticket
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => router.push(`/booking/confirmation?booking_id=${booking.id}`)}
                        >
                          Live Trip Updates
                        </Button>
                      </>
                    )}
                    {isCompleted && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-amber-600 border-amber-200 hover:bg-amber-50"
                          onClick={() => { setRateTarget(booking); setRating(0); setRatingNote(''); }}
                        >
                          <Star className="mr-2 h-4 w-4" /> Rate Trip
                        </Button>
                        <Button size="sm" variant="ghost" className="w-full text-muted-foreground" onClick={() => handleDownloadTicket(booking)}>
                          <Download className="mr-2 h-4 w-4" /> Receipt
                        </Button>
                      </>
                    )}
                    {booking.status === 'cancelled' && (
                      <span className="text-xs text-red-500 font-medium text-center">This booking was cancelled.</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Rate Trip Dialog */}
      <Dialog open={!!rateTarget} onOpenChange={() => setRateTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate Your Trip</DialogTitle>
            <DialogDescription>
              {rateTarget?.schedules?.routes?.origin} → {rateTarget?.schedules?.routes?.destination}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)} className="transition-transform hover:scale-110">
                  <Star className={`h-8 w-8 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-100'}`} />
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              placeholder="Share your experience (optional)..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={ratingNote}
              onChange={(e) => setRatingNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRateTarget(null)}>Cancel</Button>
            <Button onClick={handleSubmitRating} disabled={submittingRating || rating === 0} className="gap-2">
              {submittingRating && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
