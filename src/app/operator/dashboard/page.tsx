'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, BusFront, CalendarClock, Loader2, RefreshCw, ArrowRight, BookOpen } from 'lucide-react';
import {
  fetchOperatorDashboard,
  getMyOperatorId,
  type OperatorDashboardMetrics,
} from '@/lib/supabase/operator-queries';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';

const scheduleStatusColor: Record<string, string> = {
  scheduled: 'bg-gray-100 text-gray-700',
  departed: 'bg-blue-100 text-blue-700',
  arrived: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const bookingStatusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
};

export default function OperatorDashboardPage() {
  const [metrics, setMetrics] = useState<OperatorDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [operatorId, setOperatorId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const opId = await getMyOperatorId();
      if (!opId) {
        toast.error('Operator profile not found. Please contact admin.');
        setLoading(false);
        return;
      }
      setOperatorId(opId);
      const data = await fetchOperatorDashboard(opId);
      setMetrics(data);
    } catch (err: any) {
      toast.error('Failed to load dashboard: ' + (err.message ?? 'Error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const fmt = (n: number) =>
    n >= 1_000_000 ? `RM ${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000 ? `RM ${(n / 1_000).toFixed(1)}K`
    : `RM ${n.toFixed(2)}`;

  const stats = metrics
    ? [
        { label: 'Total Revenue', value: fmt(metrics.totalRevenue), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Total Bookings', value: metrics.totalBookings.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Active Buses', value: `${metrics.activeBuses} / ${metrics.totalBuses}`, icon: BusFront, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: "Today's Schedules", value: metrics.todaySchedules.toLocaleString(), icon: CalendarClock, color: 'text-purple-600', bg: 'bg-purple-50' },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Operator Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your operations and revenue.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="gap-2 self-start sm:self-auto">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-none shadow-sm">
                <CardContent className="p-6 flex items-center justify-center h-28">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ))
          : stats.map((stat) => (
              <Card key={stat.label} className="border-none shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${stat.bg} p-3 rounded-xl`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">{stat.label}</div>
                  <div className="text-3xl font-bold mt-1">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Upcoming Schedules + Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Upcoming Schedules */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Upcoming Schedules</h2>
            <Link href="/operator/schedules" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              View All
            </Link>
          </div>
          <Card className="border-none shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !metrics?.upcomingSchedules.length ? (
              <div className="text-center py-10 text-muted-foreground text-sm">No upcoming schedules.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b">
                    <tr>
                      <th className="px-6 py-4 font-medium">Departure</th>
                      <th className="px-6 py-4 font-medium">Route</th>
                      <th className="px-6 py-4 font-medium">Bus</th>
                      <th className="px-6 py-4 font-medium">Price</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {metrics.upcomingSchedules.map((s) => (
                      <tr key={s.id} className="hover:bg-secondary/20">
                        <td className="px-6 py-4 font-bold">
                          {format(new Date(s.departure_time), 'dd MMM, HH:mm')}
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-1">
                            {s.routes?.origin ?? '—'}
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            {s.routes?.destination ?? '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {s.buses?.plate_number ?? '—'} ({s.buses?.bus_type ?? '—'})
                        </td>
                        <td className="px-6 py-4 font-semibold text-primary">
                          RM {Number(s.base_price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${scheduleStatusColor[s.status]}`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Recent Bookings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Recent Bookings</h2>
            <Link href="/operator/bookings" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              View All
            </Link>
          </div>
          <Card className="border-none shadow-sm">
            <CardContent className="p-0 divide-y divide-border">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !metrics?.recentBookings.length ? (
                <div className="text-center py-10 text-muted-foreground text-sm">No recent bookings.</div>
              ) : (
                metrics.recentBookings.map((b) => (
                  <div key={b.id} className="p-4 flex gap-3 items-start hover:bg-secondary/10">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      b.status === 'confirmed' ? 'bg-green-500'
                      : b.status === 'pending' ? 'bg-yellow-500'
                      : b.status === 'cancelled' ? 'bg-red-500'
                      : 'bg-blue-500'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm font-mono">{b.booking_reference}</div>
                      <div className="text-xs text-muted-foreground truncate">{b.profiles?.email ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">
                        {b.schedules?.routes?.origin} → {b.schedules?.routes?.destination}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded font-medium shrink-0 ${bookingStatusColor[b.status]}`}>
                      {b.status}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
