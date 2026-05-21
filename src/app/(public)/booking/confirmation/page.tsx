'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBookingStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Download, Home, QrCode, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { generateTicketPDF, generateInvoicePDF } from '@/lib/pdf';
import { ScheduleUpdatesPanel } from '@/components/realtime/ScheduleUpdatesPanel';
import { LiveBusTracking } from '@/components/realtime/LiveBusTracking';
import { ChatPanel } from '@/components/realtime/ChatPanel';
import { toast } from 'sonner';

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 bg-secondary/20 py-12 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium font-sans">Loading details...</p>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}

function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const { clearBooking } = useBookingStore();
  
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [downloadingTicket, setDownloadingTicket] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  useEffect(() => {
    // Clear booking state from store upon successful completion so they can't double-checkout
    clearBooking();
  }, [clearBooking]);

  useEffect(() => {
    async function fetchBookingDetails() {
      if (!bookingId) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            profiles (
              email,
              full_name
            ),
            schedules (
              id,
              bus_id,
              departure_time,
              arrival_time,
              base_price,
              routes (
                origin,
                destination,
                boarding_points,
                dropoff_points,
                operator_id
              )
            ),
            booking_passengers (
              passenger_name,
              passenger_ic,
              seats (
                seat_number
              )
            ),
            payments (
              amount,
              payment_method,
              transaction_id,
              status,
              paid_at
            ),
            tickets (
              ticket_number,
              qr_code_url
            )
          `)
          .eq('id', bookingId)
          .single();

        if (error) throw error;
        setBooking(data);
      } catch (err: any) {
        console.error('Error fetching booking details:', err);
        toast.error('Failed to load booking details from database.');
      } finally {
        setLoading(false);
      }
    }

    fetchBookingDetails();
  }, [bookingId]);

  const handleDownloadTicket = async () => {
    if (!booking) return;
    setDownloadingTicket(true);
    try {
      await generateTicketPDF(booking);
      toast.success('Ticket PDF downloaded successfully!');
    } catch (err) {
      console.error('Failed to generate ticket PDF:', err);
      toast.error('Failed to generate ticket PDF.');
    } finally {
      setDownloadingTicket(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!booking) return;
    setDownloadingInvoice(true);
    try {
      await generateInvoicePDF(booking);
      toast.success('Invoice/Bill PDF downloaded successfully!');
    } catch (err) {
      console.error('Failed to generate invoice PDF:', err);
      toast.error('Failed to generate invoice PDF.');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-secondary/20 py-12 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Fetching your ticket details...</p>
      </div>
    );
  }

  if (!bookingId || !booking) {
    return (
      <div className="flex-1 bg-secondary/20 py-12 flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full mx-auto px-4 text-center">
          <Card className="border-none shadow-xl rounded-2xl p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">No Booking Found</h1>
            <p className="text-muted-foreground mb-6">
              We couldn't retrieve any booking details. Please check the URL or return to home.
            </p>
            <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white">
              <Link href="/" className="flex items-center justify-center w-full h-full">
                <Home className="mr-2 h-4 w-4" /> Go to Home
              </Link>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const departureDate = new Date(booking.schedules?.departure_time || Date.now());
  const dateString = departureDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeString = departureDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  const seatNumbers = booking.booking_passengers?.map((p: any) => p.seats?.seat_number).join(', ') || 'N/A';

  return (
    <>
    <div className="flex-1 bg-secondary/20 py-12 flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto px-4">
        
        <Card className="border-none shadow-xl rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-2 bg-green-500"></div>
          
          <CardContent className="p-8 text-center pt-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-muted-foreground mb-8">
              Your payment was successful and your seats are secured. A confirmation email has been sent to <span className="font-semibold text-foreground">{booking.profiles?.email || 'your email'}</span>.
            </p>
            
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 mb-8 text-left relative overflow-hidden">
              <div className="flex justify-between items-center mb-6 pb-6 border-b border-dashed border-gray-300">
                <div>
                  <div className="text-sm text-muted-foreground">Booking Ref</div>
                  <div className="font-mono font-bold text-xl text-primary">{booking.booking_reference}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="font-bold text-green-600 uppercase flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Paid
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Route Journey</span>
                  <span className="font-semibold text-base text-gray-900 font-medium">
                    {booking.schedules?.routes?.origin} → {booking.schedules?.routes?.destination}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Departure Date & Time</span>
                  <span className="font-semibold text-gray-900 font-medium">{dateString} at {timeString}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Selected Seats</span>
                  <span className="font-semibold text-base text-rose-600 font-mono font-bold">{seatNumbers}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Amount Paid</span>
                  <span className="font-bold text-base text-gray-900 font-medium">RM {Number(booking.total_amount).toFixed(2)}</span>
                </div>
                {booking.profiles?.full_name && (
                  <div className="md:col-span-2">
                    <span className="text-xs text-muted-foreground block">Passenger Contact</span>
                    <span className="font-semibold text-gray-900 font-medium">{booking.profiles.full_name} ({booking.profiles.email})</span>
                  </div>
                )}
              </div>

              {booking.booking_passengers && booking.booking_passengers.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <span className="text-xs text-muted-foreground block mb-2">Traveler Breakdown</span>
                  <div className="space-y-2">
                    {booking.booking_passengers.map((p: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <div>
                          <div className="font-semibold text-sm text-gray-800">{p.passenger_name}</div>
                          <div className="text-xs text-gray-400">IC/Passport: {p.passenger_ic || 'N/A'}</div>
                        </div>
                        <div className="bg-rose-50 text-rose-600 border border-rose-100 rounded-full px-3 py-1 font-mono font-bold text-xs">
                          Seat {p.seats?.seat_number || 'TBA'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col items-center justify-center gap-2 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="p-3 border-4 border-gray-900 rounded-2xl bg-white">
                  <QrCode className="w-24 h-24 text-gray-900" />
                </div>
                <span className="text-[10px] tracking-widest uppercase font-mono text-muted-foreground">Digital Boarding Pass</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" className="h-12 rounded-xl flex-1 border-gray-200 hover:bg-gray-50">
                <Link href="/" className="flex items-center justify-center w-full h-full">
                  <Home className="mr-2 h-4 w-4 text-muted-foreground" /> Return Home
                </Link>
              </Button>
              
              <Button 
                onClick={handleDownloadTicket} 
                disabled={downloadingTicket}
                className="h-12 rounded-xl flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                {downloadingTicket ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" /> E-Ticket (PDF)
                  </>
                )}
              </Button>

              <Button 
                onClick={handleDownloadInvoice} 
                disabled={downloadingInvoice}
                className="h-12 rounded-xl flex-1 bg-slate-800 hover:bg-slate-900 text-white font-semibold"
              >
                {downloadingInvoice ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" /> E-Bill (PDF)
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        
      </div>
    </div>
    {booking?.schedules?.id && (
      <div className="max-w-6xl w-full mx-auto px-4 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ScheduleUpdatesPanel
          scheduleId={booking.schedules.id}
          scheduledDeparture={booking.schedules.departure_time}
          scheduledArrival={booking.schedules.arrival_time}
          className="lg:col-span-2"
        />
        <LiveBusTracking scheduleId={booking.schedules.id} />
        <ChatPanel bookingId={booking.id} className="lg:col-span-3" />
      </div>
    )}
    </>
  );
}
