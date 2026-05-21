import { createClient } from './client';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OperatorRecord {
  id: string;
  profile_id: string;
  company_name: string;
  registration_number: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: 'pending' | 'approved' | 'suspended';
  created_at: string;
}

export interface BusRecord {
  id: string;
  operator_id: string;
  plate_number: string;
  bus_type: string;
  total_seats: number;
  amenities: string[];
  image_url: string | null;
  interior_image_url: string | null;
  exterior_image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface RouteRecord {
  id: string;
  operator_id: string;
  origin: string;
  destination: string;
  boarding_points: string[];
  dropoff_points: string[];
  estimated_duration?: string | null;
  assigned_buses: string[];
  is_active: boolean;
  created_at: string;
}

export interface ScheduleRecord {
  id: string;
  route_id: string;
  bus_id: string;
  departure_time: string;
  arrival_time: string;
  base_price: number;
  status: 'scheduled' | 'departed' | 'arrived' | 'cancelled';
  estimated_departure_time?: string | null;
  estimated_arrival_time?: string | null;
  delay_minutes?: number | null;
  live_status?: string | null;
  last_update_at?: string | null;
  routes?: { origin: string; destination: string } | null;
  buses?: { plate_number: string; bus_type: string; total_seats: number } | null;
}

export interface OperatorBooking {
  id: string;
  booking_reference: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  client_id: string;
  profiles: { email: string; full_name: string | null } | null;
  schedules: {
    departure_time: string;
    routes: { origin: string; destination: string } | null;
  } | null;
  booking_passengers: {
    id: string;
    passenger_name: string;
    passenger_ic: string | null;
    seats: { seat_number: string } | null;
  }[];
}

export interface OperatorDashboardMetrics {
  totalBuses: number;
  activeBuses: number;
  totalRoutes: number;
  todaySchedules: number;
  totalBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  upcomingSchedules: ScheduleRecord[];
  recentBookings: OperatorBooking[];
}

// ─── Resolve Operator ID from current user ───────────────────────────────────

export async function getMyOperatorId(): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('operators')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle();
  return data?.id ?? null;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function fetchOperatorDashboard(operatorId: string): Promise<OperatorDashboardMetrics> {
  const supabase = createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [
    { count: totalBuses },
    { count: activeBuses },
    { count: totalRoutes },
    { count: todaySchedules },
    { count: totalBookings },
    { count: confirmedBookings },
    { data: revenueData },
    { data: upcomingSchedules },
    { data: recentBookings },
  ] = await Promise.all([
    supabase.from('buses').select('*', { count: 'exact', head: true }).eq('operator_id', operatorId),
    supabase.from('buses').select('*', { count: 'exact', head: true }).eq('operator_id', operatorId).eq('is_active', true),
    supabase.from('routes').select('*', { count: 'exact', head: true }).eq('operator_id', operatorId),
    supabase.from('schedules').select('*', { count: 'exact', head: true })
      .gte('departure_time', todayStart.toISOString())
      .lte('departure_time', todayEnd.toISOString()),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabase.from('payments').select('amount').eq('status', 'success'),
    supabase.from('schedules')
      .select('id, route_id, bus_id, departure_time, arrival_time, base_price, status, estimated_departure_time, estimated_arrival_time, delay_minutes, live_status, last_update_at, routes(origin, destination), buses(plate_number, bus_type, total_seats)')
      .gte('departure_time', new Date().toISOString())
      .order('departure_time', { ascending: true })
      .limit(5),
    supabase.from('bookings')
      .select('id, booking_reference, total_amount, status, created_at, client_id, profiles(email, full_name), schedules(departure_time, routes(origin, destination)), booking_passengers(id, passenger_name, passenger_ic, seats(seat_number))')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const totalRevenue = (revenueData ?? []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  return {
    totalBuses: totalBuses ?? 0,
    activeBuses: activeBuses ?? 0,
    totalRoutes: totalRoutes ?? 0,
    todaySchedules: todaySchedules ?? 0,
    totalBookings: totalBookings ?? 0,
    confirmedBookings: confirmedBookings ?? 0,
    totalRevenue,
    upcomingSchedules: (upcomingSchedules as unknown as ScheduleRecord[]) ?? [],
    recentBookings: (recentBookings as unknown as OperatorBooking[]) ?? [],
  };
}

// ─── Buses ────────────────────────────────────────────────────────────────────

export async function fetchBuses(operatorId: string): Promise<BusRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('buses')
    .select('*')
    .eq('operator_id', operatorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((b: any) => ({
    ...b,
    amenities: Array.isArray(b.amenities) ? b.amenities : [],
  })) as BusRecord[];
}

export async function addBus(operatorId: string, payload: {
  plate_number: string;
  bus_type: string;
  total_seats: number;
  amenities: string[];
  interior_image_url?: string | null;
  exterior_image_url?: string | null;
}) {
  const supabase = createClient();
  const { data, error } = await supabase.from('buses').insert({ ...payload, operator_id: operatorId }).select().single();
  if (error) throw error;
  return data;
}

export async function updateBus(busId: string, payload: Partial<Omit<BusRecord, 'id' | 'operator_id' | 'created_at'>>) {
  const supabase = createClient();
  const { error } = await supabase.from('buses').update(payload).eq('id', busId);
  if (error) throw error;
}

export async function deleteBus(busId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('buses').delete().eq('id', busId);
  if (error) throw error;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function fetchRoutes(operatorId: string): Promise<RouteRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .eq('operator_id', operatorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    ...r,
    boarding_points: Array.isArray(r.boarding_points) ? r.boarding_points : [],
    dropoff_points: Array.isArray(r.dropoff_points) ? r.dropoff_points : [],
    assigned_buses: Array.isArray(r.assigned_buses) ? r.assigned_buses : [],
  })) as RouteRecord[];
}

export async function addRoute(operatorId: string, payload: {
  origin: string;
  destination: string;
  boarding_points: string[];
  dropoff_points: string[];
  estimated_duration?: string | null;
  assigned_buses?: string[];
}) {
  const supabase = createClient();
  const { data, error } = await supabase.from('routes').insert({ ...payload, operator_id: operatorId }).select().single();
  if (error) throw error;
  return data;
}

export async function updateRoute(routeId: string, payload: Partial<Omit<RouteRecord, 'id' | 'operator_id' | 'created_at'>>) {
  const supabase = createClient();
  const { error } = await supabase.from('routes').update(payload).eq('id', routeId);
  if (error) throw error;
}

export async function deleteRoute(routeId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('routes').delete().eq('id', routeId);
  if (error) throw error;
}

// ─── Schedules ────────────────────────────────────────────────────────────────

export async function fetchSchedules(operatorId: string): Promise<ScheduleRecord[]> {
  const supabase = createClient();
  // Get all route IDs for this operator first
  const { data: routes } = await supabase.from('routes').select('id').eq('operator_id', operatorId);
  const routeIds = (routes ?? []).map((r: any) => r.id);
  if (!routeIds.length) return [];

  const { data, error } = await supabase
    .from('schedules')
    .select('id, route_id, bus_id, departure_time, arrival_time, base_price, status, estimated_departure_time, estimated_arrival_time, delay_minutes, live_status, last_update_at, routes(origin, destination), buses(plate_number, bus_type, total_seats)')
    .in('route_id', routeIds)
    .order('departure_time', { ascending: false });
  if (error) throw error;
  return (data as unknown as ScheduleRecord[]) ?? [];
}

export async function addSchedule(payload: {
  route_id: string;
  bus_id: string;
  departure_time: string;
  arrival_time: string;
  base_price: number;
}) {
  const supabase = createClient();
  const { data, error } = await supabase.from('schedules').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateSchedule(scheduleId: string, payload: Partial<Omit<ScheduleRecord, 'id' | 'routes' | 'buses'>>) {
  const supabase = createClient();
  const { error } = await supabase.from('schedules').update(payload).eq('id', scheduleId);
  if (error) throw error;
}

export async function publishScheduleUpdate(payload: {
  schedule_id: string;
  status: string;
  message?: string | null;
  estimated_departure_time?: string | null;
  estimated_arrival_time?: string | null;
  delay_minutes?: number | null;
  created_by?: string | null;
}) {
  const supabase = createClient();

  const updatePayload = {
    estimated_departure_time: payload.estimated_departure_time ?? null,
    estimated_arrival_time: payload.estimated_arrival_time ?? null,
    delay_minutes: payload.delay_minutes ?? 0,
    live_status: payload.status,
    last_update_at: new Date().toISOString(),
  };

  const { error: scheduleError } = await supabase
    .from('schedules')
    .update(updatePayload)
    .eq('id', payload.schedule_id);
  if (scheduleError) throw scheduleError;

  const { error: updateError } = await supabase
    .from('schedule_updates')
    .insert({
      schedule_id: payload.schedule_id,
      status: payload.status,
      message: payload.message ?? null,
      estimated_departure_time: payload.estimated_departure_time ?? null,
      estimated_arrival_time: payload.estimated_arrival_time ?? null,
      delay_minutes: payload.delay_minutes ?? 0,
      created_by: payload.created_by ?? null,
    });
  if (updateError) throw updateError;
}

export async function publishBusLocation(payload: {
  schedule_id: string;
  bus_id?: string | null;
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed_kmh?: number | null;
}) {
  const supabase = createClient();
  const { error } = await supabase.from('bus_locations').insert({
    schedule_id: payload.schedule_id,
    bus_id: payload.bus_id ?? null,
    latitude: payload.latitude,
    longitude: payload.longitude,
    heading: payload.heading ?? null,
    speed_kmh: payload.speed_kmh ?? null,
  });
  if (error) throw error;
}

export async function cancelSchedule(scheduleId: string) {
  return updateSchedule(scheduleId, { status: 'cancelled' });
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export async function fetchOperatorBookings(operatorId: string, search?: string, statusFilter?: string): Promise<OperatorBooking[]> {
  const supabase = createClient();
  // Get route IDs for this operator
  const { data: routes } = await supabase.from('routes').select('id').eq('operator_id', operatorId);
  const routeIds = (routes ?? []).map((r: any) => r.id);
  if (!routeIds.length) return [];

  // Get schedule IDs in those routes
  const { data: schedules } = await supabase.from('schedules').select('id').in('route_id', routeIds);
  const scheduleIds = (schedules ?? []).map((s: any) => s.id);
  if (!scheduleIds.length) return [];

  let query = supabase
    .from('bookings')
    .select('id, booking_reference, total_amount, status, created_at, client_id, profiles(email, full_name), schedules(departure_time, routes(origin, destination)), booking_passengers(id, passenger_name, passenger_ic, seats(seat_number))')
    .in('schedule_id', scheduleIds)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.ilike('booking_reference', `%${search}%`);
  }
  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as OperatorBooking[]) ?? [];
}

export async function updateBookingStatus(bookingId: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed') {
  const supabase = createClient();
  const { error } = await supabase.from('bookings').update({ status }).eq('id', bookingId);
  if (error) throw error;
  
  if (status === 'cancelled') {
    // get passengers to free their seats
    const { data: passengers } = await supabase.from('booking_passengers').select('seat_id').eq('booking_id', bookingId);
    if (passengers && passengers.length > 0) {
      const seatIds = passengers.map((p: any) => p.seat_id).filter(Boolean);
      if (seatIds.length > 0) {
        await supabase.from('seats').update({ status: 'available' }).in('id', seatIds);
      }
    }
  }
}
