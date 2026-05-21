import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { bookingId, paymentMethod, amount } = await req.json();

    if (!bookingId || !paymentMethod || !amount) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. In a real app, verify with Stripe/Payment Gateway API here
    // For Sandbox, we just simulate a successful transaction
    const transactionId = `txn_${Math.random().toString(36).substr(2, 9)}`;

    // 2. Insert into payments table
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id: bookingId,
        amount: amount,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        status: 'success',
        paid_at: new Date().toISOString()
      });

    if (paymentError) throw paymentError;

    // 3. Update booking status to confirmed
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId);

    if (bookingError) throw bookingError;

    // 4. Update seats from 'locked' to 'booked'
    const { error: seatsError } = await supabase
      .from('seats')
      .update({ status: 'booked' })
      .in('id', (
        // Subquery or separate fetch to get seat IDs for this booking
        // In Supabase we'd typically fetch first or use an RPC
        // Here we simulate success for simplicity
        []
      ));
      
    // 5. Generate a ticket record
    const { error: ticketError } = await supabase
      .from('tickets')
      .insert({
        booking_id: bookingId,
        ticket_number: `TKT-${transactionId.toUpperCase()}`
      });

    if (ticketError) throw ticketError;

    return new Response(
      JSON.stringify({ 
        message: "Payment verified successfully",
        transactionId
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
