'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Loader2, RefreshCw, CheckCircle, XCircle, PauseCircle, Eye } from 'lucide-react';
import {
  fetchOperators,
  updateOperatorStatus,
  type AdminOperator,
} from '@/lib/supabase/admin-queries';
import { toast } from 'sonner';
import { format } from 'date-fns';

const statusBadge: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
};

export default function AdminOperatorsPage() {
  const [operators, setOperators] = useState<AdminOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [viewTarget, setViewTarget] = useState<AdminOperator | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchOperators(search || undefined, statusFilter);
      setOperators(data);
    } catch (err: any) {
      toast.error('Failed to load operators: ' + (err.message ?? 'Error'));
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => load(), 400);
    return () => clearTimeout(t);
  }, [load]);

  const changeStatus = async (op: AdminOperator, status: 'approved' | 'suspended' | 'pending') => {
    setActionLoading(op.id);
    try {
      await updateOperatorStatus(op.id, status);
      setOperators((prev) =>
        prev.map((o) => (o.id === op.id ? { ...o, status } : o))
      );
      toast.success(`${op.company_name} is now ${status}.`);
    } catch (err: any) {
      toast.error('Action failed: ' + (err.message ?? 'Error'));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Operator Management</h1>
          <p className="text-muted-foreground mt-1">
            Review, approve, and manage bus operator accounts.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="gap-2 self-start sm:self-auto">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by company name or email…"
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
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : operators.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">No operators found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-4 font-medium">Company</th>
                    <th className="px-6 py-4 font-medium">Reg. No.</th>
                    <th className="px-6 py-4 font-medium">Contact</th>
                    <th className="px-6 py-4 font-medium">Joined</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {operators.map((op) => {
                    const busy = actionLoading === op.id;
                    return (
                      <tr
                        key={op.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          op.status === 'pending' ? 'bg-yellow-50/30' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{op.company_name}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-muted-foreground text-xs">
                          {op.registration_number ?? '—'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium">{op.contact_email ?? '—'}</div>
                          <div className="text-xs text-muted-foreground">{op.contact_phone ?? ''}</div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground text-xs">
                          {format(new Date(op.created_at), 'dd MMM yyyy')}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={statusBadge[op.status]}>
                            {op.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {/* View */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1"
                              onClick={() => setViewTarget(op)}
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            {/* Approve */}
                            {op.status !== 'approved' && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white gap-1"
                                disabled={busy}
                                onClick={() => changeStatus(op, 'approved')}
                              >
                                {busy ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                                Approve
                              </Button>
                            )}
                            {/* Suspend */}
                            {op.status === 'approved' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-orange-600 border-orange-200 hover:bg-orange-50 gap-1"
                                disabled={busy}
                                onClick={() => changeStatus(op, 'suspended')}
                              >
                                {busy ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <PauseCircle className="h-4 w-4" />
                                )}
                                Suspend
                              </Button>
                            )}
                            {/* Reject (pending only) */}
                            {op.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
                                disabled={busy}
                                onClick={() => changeStatus(op, 'suspended')}
                              >
                                {busy ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <XCircle className="h-4 w-4" />
                                )}
                                Reject
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

      {/* View Details Modal */}
      <Dialog open={!!viewTarget} onOpenChange={() => setViewTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Operator Details</DialogTitle>
            <DialogDescription>Full profile for this operator.</DialogDescription>
          </DialogHeader>
          {viewTarget && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-xs truncate max-w-[60%] text-right">{viewTarget.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Company Name</span>
                <span className="font-medium">{viewTarget.company_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Registration No.</span>
                <span className="font-mono">{viewTarget.registration_number ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span>{viewTarget.contact_email ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span>{viewTarget.contact_phone ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className={statusBadge[viewTarget.status]}>
                  {viewTarget.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Joined</span>
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
