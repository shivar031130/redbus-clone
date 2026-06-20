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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  fetchBookings,
  updateBookingStatus,
  type AdminBooking,
} from '@/lib/supabase/admin-queries';
import { format } from 'date-fns';
import { CheckCircle, Download, Eye, Loader2, RefreshCw, Search, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const statusBadge: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [viewTarget, setViewTarget] = useState<AdminBooking | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchBookings(search || undefined, statusFilter);
      setBookings(data);
    } catch (err: any) {
      toast.error('Failed to load bookings: ' + (err.message ?? 'Error'));
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => load(), 400);
    return () => clearTimeout(t);
  }, [load]);

  const changeStatus = async (
    booking: AdminBooking,
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  ) => {
    setActionLoading(booking.id);
    try {
      await updateBookingStatus(booking.id, status);
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, status } : b))
      );
      toast.success(`Booking ${booking.booking_reference} marked as "${status}".`);
    } catch (err: any) {
      toast.error('Action failed: ' + (err.message ?? 'Error'));
    } finally {
      setActionLoading(null);
    }
  };

  // Export CSV
  const handleExport = () => {
    const header = 'Reference,User,Route,Amount,Status,Created\n';
    const rows = bookings
      .map(
        (b) =>
          `"${b.booking_reference}","${b.profiles?.email ?? b.client_id}","${b.schedules?.routes?.origin ?? ''
          } → ${b.schedules?.routes?.destination ?? ''}","${b.total_amount}","${b.status}","${b.created_at}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `redBus-bookings-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Booking Management</h1>
          <p className="text-muted-foreground mt-1">
            View, manage, and update all platform bookings.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport} className="gap-2" disabled={!bookings.length}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by booking reference…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'all')}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">No bookings found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-4 font-medium">Reference</th>
                    <th className="px-6 py-4 font-medium">User</th>
                    <th className="px-6 py-4 font-medium">Route</th>
                    <th className="px-6 py-4 font-medium">Departure</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bookings.map((b) => {
                    const busy = actionLoading === b.id;
                    return (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-700">
                          {b.booking_reference}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium">{b.profiles?.full_name ?? '—'}</div>
                          <div className="text-xs text-muted-foreground">{b.profiles?.email ?? b.client_id}</div>
                        </td>
                        <td className="px-6 py-4">
                          {b.schedules?.routes ? (
                            <span>
                              {b.schedules.routes.origin}{' '}
                              <span className="text-muted-foreground">→</span>{' '}
                              {b.schedules.routes.destination}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          {b.schedules?.departure_time
                            ? format(new Date(b.schedules.departure_time), 'dd MMM yyyy, HH:mm')
                            : '—'}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          RM {Number(b.total_amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={statusBadge[b.status]}>
                            {b.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 flex-wrap">
                            {/* View */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1"
                              onClick={() => setViewTarget(b)}
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            {/* Confirm */}
                            {b.status === 'pending' && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white gap-1"
                                disabled={busy}
                                onClick={() => changeStatus(b, 'confirmed')}
                              >
                                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                Confirm
                              </Button>
                            )}
                            {/* Complete */}
                            {b.status === 'confirmed' && (
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
                                disabled={busy}
                                onClick={() => changeStatus(b, 'completed')}
                              >
                                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                Complete
                              </Button>
                            )}
                            {/* Cancel */}
                            {(b.status === 'pending' || b.status === 'confirmed') && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
                                disabled={busy}
                                onClick={() => changeStatus(b, 'cancelled')}
                              >
                                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                Cancel
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Booking Modal */}
      <Dialog open={!!viewTarget} onOpenChange={() => setViewTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>Full information for this booking.</DialogDescription>
          </DialogHeader>
          {viewTarget && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono font-semibold">{viewTarget.booking_reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className={statusBadge[viewTarget.status]}>
                  {viewTarget.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">User Email</span>
                <span>{viewTarget.profiles?.email ?? viewTarget.client_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">User Name</span>
                <span>{viewTarget.profiles?.full_name ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Route</span>
                <span>
                  {viewTarget.schedules?.routes?.origin ?? '—'} →{' '}
                  {viewTarget.schedules?.routes?.destination ?? '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Departure</span>
                <span>
                  {viewTarget.schedules?.departure_time
                    ? format(new Date(viewTarget.schedules.departure_time), 'dd MMM yyyy, HH:mm')
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Arrival</span>
                <span>
                  {viewTarget.schedules?.arrival_time
                    ? format(new Date(viewTarget.schedules.arrival_time), 'dd MMM yyyy, HH:mm')
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-semibold text-slate-800">
                  RM {Number(viewTarget.total_amount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Booked On</span>
                <span>{format(new Date(viewTarget.created_at), 'dd MMM yyyy, HH:mm')}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewTarget(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
