'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, ShieldCheck, Users, Activity, ArrowUpRight, Loader2, RefreshCw, CalendarCheck } from 'lucide-react';
import { fetchDashboardMetrics, type DashboardMetrics } from '@/lib/supabase/admin-queries';
import { toast } from 'sonner';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
};

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchDashboardMetrics();
      setMetrics(data);
    } catch (err: any) {
      toast.error('Failed to load metrics: ' + (err.message ?? 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const fmt = (n: number) =>
    n >= 1_000_000
      ? `RM ${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
      ? `RM ${(n / 1_000).toFixed(1)}K`
      : `RM ${n.toFixed(2)}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Platform overview and real-time metrics.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="gap-2 self-start sm:self-auto">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Total Revenue',
            value: metrics ? fmt(metrics.totalRevenue) : '—',
            sub: `from confirmed payments`,
            icon: DollarSign,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Active Users',
            value: loading ? '…' : (metrics?.totalUsers ?? 0).toLocaleString(),
            sub: 'registered clients',
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Partner Operators',
            value: loading ? '…' : (metrics?.totalOperators ?? 0).toLocaleString(),
            sub: `${metrics?.pendingOperators ?? 0} pending approval`,
            icon: ShieldCheck,
            color: 'text-violet-600',
            bg: 'bg-violet-50',
          },
          {
            label: 'Total Bookings',
            value: loading ? '…' : (metrics?.totalBookings ?? 0).toLocaleString(),
            sub: `${metrics?.confirmedBookings ?? 0} confirmed`,
            icon: Activity,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
          },
        ].map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm relative overflow-hidden">
            <div className={`absolute top-4 right-4 p-3 rounded-xl ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <CardContent className="p-6 pt-5">
              <div className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</div>
              <div className="text-3xl font-bold mb-1">
                {loading ? <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /> : stat.value}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <ArrowUpRight className={`h-4 w-4 ${stat.color}`} />
                {stat.sub}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Recent Bookings */}
        <Card className="border-none shadow-sm">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" /> Recent Bookings
            </h2>
            <Link href="/admin/bookings" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              View All
            </Link>
          </div>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !metrics?.recentBookings.length ? (
              <div className="text-center py-10 text-muted-foreground text-sm">No bookings yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {metrics.recentBookings.map((b) => (
                  <div key={b.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors gap-4">
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{b.booking_reference}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {b.profiles?.email ?? b.client_id}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {b.schedules?.routes?.origin} → {b.schedules?.routes?.destination}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant="outline" className={statusColors[b.status]}>
                        {b.status}
                      </Badge>
                      <span className="text-xs font-semibold text-slate-700">
                        RM {Number(b.total_amount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Operator Registrations */}
        <Card className="border-none shadow-sm">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Recent Operator Registrations
            </h2>
            <Link href="/admin/operators" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              View All
            </Link>
          </div>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !metrics?.recentOperators.length ? (
              <div className="text-center py-10 text-muted-foreground text-sm">No operators yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {metrics.recentOperators.map((op) => (
                  <div key={op.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors gap-4">
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{op.company_name}</div>
                      <div className="text-xs text-muted-foreground truncate">{op.contact_email}</div>
                    </div>
                    <Badge variant="outline" className={statusColors[op.status]}>
                      {op.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
