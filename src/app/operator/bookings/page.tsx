'use client';

import { ChatPanel } from '@/components/realtime/ChatPanel';
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
import { generateInvoicePDF, generateTicketPDF } from '@/lib/pdf';
import {
    fetchOperatorBookings,
    getMyOperatorId,
    updateBookingStatus,
    type OperatorBooking,
} from '@/lib/supabase/operator-queries';
import { format } from 'date-fns';
import { ArrowRight, Download, Eye, FileText, Loader2, Printer, RefreshCw, Search, Ticket } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const statusBadge: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-none',
  confirmed: 'bg-green-100 text-green-700 border-none',
  cancelled: 'bg-red-100 text-red-700 border-none',
  completed: 'bg-blue-100 text-blue-700 border-none',
};

export default function OperatorBookingsPage() {
  const [bookings, setBookings] = useState<OperatorBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [operatorId, setOperatorId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewTarget, setViewTarget] = useState<OperatorBooking | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const opId = operatorId ?? await getMyOperatorId();
      if (!opId) { toast.error('Operator profile not found.'); setLoading(false); return; }
      setOperatorId(opId);
      const data = await fetchOperatorBookings(opId, search || undefined, statusFilter);
      setBookings(data);
    } catch (err: any) {
      toast.error('Failed to load bookings: ' + (err.message ?? 'Error'));
    } finally {
      setLoading(false);
    }
  }, [operatorId, search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => load(), 400);
    return () => clearTimeout(t);
  }, [load]);

  // Export CSV
  const handleExport = () => {
    const header = 'Reference,Passenger,IC,Seat,Route,Departure,Amount,Status\n';
    const rows = bookings.flatMap((b) =>
      b.booking_passengers.map((p) =>
        `"${b.booking_reference}","${p.passenger_name}","${p.passenger_ic ?? ''}","${p.seats?.seat_number ?? ''}","${b.schedules?.routes?.origin ?? ''} → ${b.schedules?.routes?.destination ?? ''}","${b.schedules?.departure_time ? format(new Date(b.schedules.departure_time), 'dd MMM yyyy HH:mm') : ''}","${b.total_amount}","${b.status}"`
      )
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manifest-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Manifest exported!');
  };

  // Print Manifest
  const handlePrint = () => {
    const content = bookings.flatMap((b) =>
      b.booking_passengers.map((p) =>
        `${b.booking_reference} | ${p.passenger_name} | ${p.passenger_ic ?? '—'} | Seat: ${p.seats?.seat_number ?? '—'} | ${b.schedules?.routes?.origin ?? ''} → ${b.schedules?.routes?.destination ?? ''} | ${b.status}`
      )
    ).join('\n');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<pre style="font-family:monospace;padding:20px">PASSENGER MANIFEST\n${'='.repeat(60)}\n${content}</pre>`);
    win.print();
    win.close();
  };

  const handleStatusChange = async (newStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed') => {
    if (!viewTarget) return;
    try {
      setUpdatingStatus(true);
      await updateBookingStatus(viewTarget.id, newStatus);
      setViewTarget({ ...viewTarget, status: newStatus });
      setBookings(prev => prev.map(b => b.id === viewTarget.id ? { ...b, status: newStatus } : b));
      toast.success(`Booking marked as ${newStatus}`);
    } catch (err: any) {
      toast.error('Failed to update status: ' + (err.message ?? 'Error'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Booking Management</h1>
          <p className="text-muted-foreground mt-1">View passenger manifests and manage ticket status.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" onClick={handlePrint} className="gap-2" disabled={!bookings.length}>
            <Printer className="h-4 w-4" /> Print Manifest
          </Button>
          <Button variant="outline" onClick={handleExport} className="gap-2" disabled={!bookings.length}>
            <Download className="h-4 w-4" /> Export CSV
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
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
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
                <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b">
                  <tr>
                    <th className="px-6 py-4 font-medium">Booking Ref</th>
                    <th className="px-6 py-4 font-medium">Passengers</th>
                    <th className="px-6 py-4 font-medium">Route</th>
                    <th className="px-6 py-4 font-medium">Departure</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-xs">{b.booking_reference}</td>
                      <td className="px-6 py-4">
                        {b.booking_passengers.length > 0 ? (
                          <div>
                            <div className="font-medium">{b.booking_passengers[0].passenger_name}</div>
                            {b.booking_passengers.length > 1 && (
                              <div className="text-xs text-muted-foreground">+{b.booking_passengers.length - 1} more</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {b.schedules?.routes ? (
                          <span className="flex items-center gap-1 text-sm">
                            {b.schedules.routes.origin}
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            {b.schedules.routes.destination}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {b.schedules?.departure_time
                          ? format(new Date(b.schedules.departure_time), 'dd MMM, HH:mm')
                          : '—'}
                      </td>
                      <td className="px-6 py-4 font-semibold">RM {Number(b.total_amount).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <Badge className={statusBadge[b.status]}>{b.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="gap-1" onClick={() => setViewTarget(b)}>
                          <Eye className="h-4 w-4" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Booking / Passenger Manifest Modal */}
      <Dialog open={!!viewTarget} onOpenChange={() => setViewTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>Passenger manifest for this booking.</DialogDescription>
          </DialogHeader>
          {viewTarget && (
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-mono font-semibold">{viewTarget.booking_reference}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <Select 
                    disabled={updatingStatus} 
                    value={viewTarget.status} 
                    onValueChange={(val: any) => handleStatusChange(val)}
                  >
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Booked By</span>
                  <span>{viewTarget.profiles?.email ?? viewTarget.client_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Route</span>
                  <span>{viewTarget.schedules?.routes?.origin ?? '—'} → {viewTarget.schedules?.routes?.destination ?? '—'}</span>
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
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-semibold">RM {Number(viewTarget.total_amount).toFixed(2)}</span>
                </div>
              </div>

              {/* Passengers */}
              <div>
                <h4 className="font-semibold text-sm mb-3">Passenger Manifest ({viewTarget.booking_passengers.length})</h4>
                {viewTarget.booking_passengers.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No passenger details recorded.</p>
                ) : (
                  <div className="divide-y border rounded-lg overflow-hidden">
                    {viewTarget.booking_passengers.map((p, i) => (
                      <div key={p.id} className="p-3 flex items-center justify-between text-sm bg-white">
                        <div>
                          <div className="font-medium">{p.passenger_name}</div>
                          <div className="text-xs text-muted-foreground">{p.passenger_ic ?? 'IC not provided'}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-semibold text-xs">Seat {p.seats?.seat_number ?? '—'}</div>
                          <div className="text-xs text-muted-foreground">Pax {i + 1}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <ChatPanel bookingId={viewTarget.id} />
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-between sm:justify-between w-full mt-6">
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={() => viewTarget && generateTicketPDF(viewTarget)}>
                <Ticket className="h-4 w-4" /> Ticket
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => viewTarget && generateInvoicePDF(viewTarget)}>
                <FileText className="h-4 w-4" /> Invoice
              </Button>
            </div>
            <Button variant="outline" onClick={() => setViewTarget(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
