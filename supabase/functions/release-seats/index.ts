import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

serve(async (req) => {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate time 10 minutes ago
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);
    const tenMinutesAgoISO = tenMinutesAgo.toISOString();

    // Find all seats locked more than 10 mins ago
    const { data: expiredSeats, error: fetchError } = await supabase
      .from('seats')
      .select('id')
      .eq('status', 'locked')
      .lt('locked_at', tenMinutesAgoISO);

    if (fetchError) throw fetchError;

    if (!expiredSeats || expiredSeats.length === 0) {
      return new Response(JSON.stringify({ message: "No expired seats found" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    const seatIds = expiredSeats.map(s => s.id);

    // Update them back to 'available'
    const { error: updateError } = await supabase
      .from('seats')
      .update({
        status: 'available',
        locked_by: null,
        locked_at: null
      })
      .in('id', seatIds);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ message: `Released ${seatIds.length} expired seats.` }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
