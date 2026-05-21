'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingStore, useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Lock, CheckCircle2, ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

export default function CheckoutPage() {
  const router = useRouter();
  const { selectedSchedule, selectedSeats, passengerDetails, contactEmail, contactPhone, clearBooking } = useBookingStore();
  const { user, isLoading: authLoading } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'fpx'>('card');

  useEffect(() => {
    if (!selectedSchedule || selectedSeats.length === 0) {
      router.push('/');
      return;
    }

    if (!authLoading && !user) {
      toast.error('Please log in to complete your booking.');
      router.push('/login?next=/booking/checkout');
    }
  }, [selectedSchedule, selectedSeats, user, authLoading, router]);

  if (!selectedSchedule || authLoading || !user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Checking auth session...</p>
      </div>
    );
  }

  const totalPrice = selectedSeats.length * selectedSchedule.price;

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const supabase = createClient();
      const bookingRef = `BSM-${Math.floor(100000 + Math.random() * 900000)}`;

      // 1. Create Booking
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          client_id: user.id,
          schedule_id: selectedSchedule.id,
          booking_reference: bookingRef,
          total_amount: totalPrice,
          status: 'confirmed'
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // 2. Fetch seats or insert if missing
      const { data: seatsData, error: seatsError } = await supabase
        .from('seats')
        .select('id, seat_number')
        .eq('schedule_id', selectedSchedule.id)
        .in('seat_number', selectedSeats);

      if (seatsError) throw seatsError;

      const seatMap: { [key: string]: string } = {};
      seatsData?.forEach(s => {
        seatMap[s.seat_number] = s.id;
      });

      // Insert any missing seats first
      const missingSeats = selectedSeats.filter(num => !seatMap[num]);
      if (missingSeats.length > 0) {
        const newSeatsToInsert = missingSeats.map(num => ({
          schedule_id: selectedSchedule.id,
          bus_id: selectedSchedule.bus_id || null,
          seat_number: num,
          status: 'booked' as const
        }));
        const { data: insertedSeats, error: insertSeatsError } = await supabase
          .from('seats')
          .insert(newSeatsToInsert)
          .select();
        
        if (insertSeatsError) throw insertSeatsError;
        
        insertedSeats?.forEach(s => {
          seatMap[s.seat_number] = s.id;
        });
      }

      // Update seat statuses to booked
      const { error: updateSeatsError } = await supabase
        .from('seats')
        .update({ status: 'booked' })
        .eq('schedule_id', selectedSchedule.id)
        .in('seat_number', selectedSeats);

      if (updateSeatsError) throw updateSeatsError;

      // 3. Insert Passengers
      const passengersToInsert = selectedSeats.map((seatNum, idx) => {
        const details = passengerDetails?.find(p => p.seat === seatNum) || passengerDetails?.[idx] || { name: `Passenger ${idx + 1}`, icPassport: 'N/A' };
        return {
          booking_id: bookingData.id,
          seat_id: seatMap[seatNum],
          passenger_name: details.name || `Passenger ${idx + 1}`,
          passenger_ic: details.icPassport || 'N/A'
        };
      });

      const { error: passengersError } = await supabase
        .from('booking_passengers')
        .insert(passengersToInsert);

      if (passengersError) throw passengersError;

      // 4. Insert Payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          booking_id: bookingData.id,
          amount: totalPrice,
          payment_method: paymentMethod,
          transaction_id: `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`,
          status: 'success',
          paid_at: new Date().toISOString()
        });

      if (paymentError) throw paymentError;

      // 5. Insert Ticket
      const { error: ticketError } = await supabase
        .from('tickets')
        .insert({
          booking_id: bookingData.id,
          qr_code_url: `QR-${bookingRef}`,
          ticket_number: `TKT-${Math.floor(10000000 + Math.random() * 90000000)}`
        });

      if (ticketError) throw ticketError;

      toast.success('Payment successful!');
      router.push(`/booking/confirmation?booking_id=${bookingData.id}`);

    } catch (err: any) {
      console.error('Checkout failed:', err);
      toast.error(err.message || 'Payment/Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-secondary/20 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Secure Checkout</h1>
          <p className="text-muted-foreground mt-2 flex items-center justify-center gap-2">
            <Lock className="h-4 w-4 text-green-600" /> Sandbox Mode Enabled
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="md:col-span-2 space-y-6">
            <Card className="border-none shadow-sm rounded-xl overflow-hidden">
              <div className="bg-primary/5 p-4 border-b flex gap-4">
                <button 
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors ${paymentMethod === 'card' ? 'bg-white shadow border border-primary text-primary' : 'hover:bg-white/50 text-muted-foreground'}`}
                >
                  <CreditCard className="inline-block mr-2 h-5 w-5" /> Credit/Debit Card
                </button>
                <button 
                  type="button"
                  onClick={() => setPaymentMethod('fpx')}
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors ${paymentMethod === 'fpx' ? 'bg-white shadow border border-primary text-primary' : 'hover:bg-white/50 text-muted-foreground'}`}
                >
                  FPX (Online Banking)
                </button>
              </div>
              
              <CardContent className="p-6">
                <form id="payment-form" onSubmit={handlePayment} className="space-y-4">
                  {paymentMethod === 'card' ? (
                    <>
                      <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm mb-4 flex items-start gap-2">
                        <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                        <p>This is a simulated sandbox environment. Do not enter real credit card numbers. Any 16-digit number will work.</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Card Number</label>
                        <Input required placeholder="4242 4242 4242 4242" maxLength={19} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Expiry Date</label>
                          <Input required placeholder="MM/YY" maxLength={5} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">CVC</label>
                          <Input required placeholder="123" maxLength={4} type="password" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Name on Card</label>
                        <Input required placeholder="John Doe" />
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      <p>You will be redirected to your bank's portal to complete the payment.</p>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-1">
            <Card className="border-none shadow-md rounded-2xl sticky top-24">
              <div className="bg-primary p-6 text-white rounded-t-2xl">
                <h3 className="font-semibold mb-2">Order Summary</h3>
                <div className="text-2xl font-bold">RM {totalPrice.toFixed(2)}</div>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bus Fare</span>
                  <span>RM {totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm pb-4 border-b">
                  <span className="text-muted-foreground">Processing Fee</span>
                  <span>RM 0.00</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>Total</span>
                  <span>RM {totalPrice.toFixed(2)}</span>
                </div>

                <Button 
                  type="submit" 
                  form="payment-form" 
                  className="w-full h-12 text-lg rounded-xl mt-4"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : `Pay RM ${totalPrice.toFixed(2)}`}
                </Button>
                
                <p className="text-xs text-center text-muted-foreground mt-4 flex items-center justify-center gap-1">
                  <Lock className="h-3 w-3" /> Secure Encrypted Payment
                </p>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
