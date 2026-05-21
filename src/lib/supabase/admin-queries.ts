import { createClient } from './client';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AdminProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'client' | 'operator';
  phone_number: string | null;
  created_at: string;
}

export interface AdminOperator {
  id: string;
  profile_id: string;
  company_name: string;
  registration_number: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: 'pending' | 'approved' | 'suspended';
  created_at: string;
}

export interface AdminBooking {
  id: string;
  booking_reference: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  client_id: string;
  profiles: { email: string; full_name: string | null } | null;
  schedules: {
    departure_time: string;
    arrival_time: string;
    base_price: number;
    routes: { origin: string; destination: string } | null;
  } | null;
}

export interface DashboardMetrics {
  totalUsers: number;
  totalOperators: number;
  pendingOperators: number;
  totalBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  recentBookings: AdminBooking[];
  recentOperators: AdminOperator[];
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = createClient();

  const [
    { count: totalUsers },
    { count: totalOperators },
    { count: pendingOperators },
    { count: totalBookings },
    { count: confirmedBookings },
    { data: revenueData },
    { data: recentBookings },
    { data: recentOperators },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
    supabase.from('operators').select('*', { count: 'exact', head: true }),
    supabase.from('operators').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabase.from('payments').select('amount').eq('status', 'success'),
    supabase
      .from('bookings')
      .select(`id, booking_reference, total_amount, status, created_at, client_id, profiles(email, full_name), schedules(departure_time, arrival_time, base_price, routes(origin, destination))`)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('operators').select('*').order('created_at', { ascending: false }).limit(5),
  ]);

  const totalRevenue = (revenueData ?? []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  return {
    totalUsers: totalUsers ?? 0,
    totalOperators: totalOperators ?? 0,
    pendingOperators: pendingOperators ?? 0,
    totalBookings: totalBookings ?? 0,
    confirmedBookings: confirmedBookings ?? 0,
    totalRevenue,
    recentBookings: (recentBookings as unknown as AdminBooking[]) ?? [],
    recentOperators: (recentOperators ?? []) as AdminOperator[],
  };
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function fetchUsers(search?: string): Promise<AdminProfile[]> {
  const supabase = createClient();
  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as AdminProfile[];
}

export async function updateUserRole(userId: string, role: 'admin' | 'client' | 'operator') {
  const supabase = createClient();
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
  if (error) throw error;
}

export async function deleteUser(userId: string) {
  const supabase = createClient();
  // Deletes from profiles; cascade removes auth.users via trigger
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  if (error) throw error;
}

// ─── Operators ────────────────────────────────────────────────────────────────

export async function fetchOperators(search?: string, statusFilter?: string): Promise<AdminOperator[]> {
  const supabase = createClient();
  let query = supabase.from('operators').select('*').order('created_at', { ascending: false });
  if (search) {
    query = query.or(`company_name.ilike.%${search}%,contact_email.ilike.%${search}%`);
  }
  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as AdminOperator[];
}

export async function updateOperatorStatus(operatorId: string, status: 'approved' | 'suspended' | 'pending') {
  const supabase = createClient();
  const { error } = await supabase.from('operators').update({ status }).eq('id', operatorId);
  if (error) throw error;
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export async function fetchBookings(search?: string, statusFilter?: string): Promise<AdminBooking[]> {
  const supabase = createClient();
  let query = supabase
    .from('bookings')
    .select(`id, booking_reference, total_amount, status, created_at, client_id, profiles(email, full_name), schedules(departure_time, arrival_time, base_price, routes(origin, destination))`)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.ilike('booking_reference', `%${search}%`);
  }
  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as AdminBooking[]) ?? [];
}

export async function updateBookingStatus(bookingId: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed') {
  const supabase = createClient();
  const { error } = await supabase.from('bookings').update({ status }).eq('id', bookingId);
  if (error) throw error;
}
