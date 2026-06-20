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
  deleteUser,
  fetchUsers,
  updateUserRole,
  type AdminProfile,
} from '@/lib/supabase/admin-queries';
import { format } from 'date-fns';
import {
  Download,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const roleBadge: Record<string, string> = {
  admin: 'bg-purple-50 text-purple-700 border-purple-200',
  client: 'bg-blue-50 text-blue-700 border-blue-200',
  operator: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // View modal
  const [viewUser, setViewUser] = useState<AdminProfile | null>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<AdminProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Role change
  const [roleTarget, setRoleTarget] = useState<AdminProfile | null>(null);
  const [newRole, setNewRole] = useState<'admin' | 'client' | 'operator'>('client');
  const [savingRole, setSavingRole] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUsers(search || undefined);
      setUsers(data);
    } catch (err: any) {
      toast.error('Failed to load users: ' + (err.message ?? 'Error'));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => load(), 400);
    return () => clearTimeout(t);
  }, [load]);

  // Export as CSV
  const handleExport = () => {
    const header = 'ID,Email,Full Name,Role,Phone,Joined\n';
    const rows = users
      .map(
        (u) =>
          `"${u.id}","${u.email}","${u.full_name ?? ''}","${u.role}","${u.phone_number ?? ''}","${u.created_at}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `redBus-users-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  };

  // Confirm delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      toast.success(`User ${deleteTarget.email} deleted.`);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error('Delete failed: ' + (err.message ?? 'Error'));
    } finally {
      setDeleting(false);
    }
  };

  // Save role change
  const handleRoleSave = async () => {
    if (!roleTarget) return;
    setSavingRole(true);
    try {
      await updateUserRole(roleTarget.id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === roleTarget.id ? { ...u, role: newRole } : u))
      );
      toast.success(`Role updated to "${newRole}" for ${roleTarget.email}.`);
      setRoleTarget(null);
    } catch (err: any) {
      toast.error('Role update failed: ' + (err.message ?? 'Error'));
    } finally {
      setSavingRole(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage client accounts, roles, and permissions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport} className="gap-2" disabled={!users.length}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          {/* Search */}
          <div className="relative max-w-md w-full mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-4 font-medium">User</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium">Phone</th>
                    <th className="px-6 py-4 font-medium">Joined</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{u.full_name ?? '—'}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={roleBadge[u.role]}>
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {u.phone_number ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">
                        {format(new Date(u.created_at), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {/* View */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1"
                            onClick={() => setViewUser(u)}
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          {/* Change Role */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                            onClick={() => { setRoleTarget(u); setNewRole(u.role); }}
                          >
                            <ShieldCheck className="h-4 w-4" />
                            Role
                          </Button>
                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteTarget(u)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View User Modal */}
      <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Profile information for this user.</DialogDescription>
          </DialogHeader>
          {viewUser && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-xs truncate max-w-[60%] text-right">{viewUser.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{viewUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Full Name</span>
                <span className="font-medium">{viewUser.full_name ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <Badge variant="outline" className={roleBadge[viewUser.role]}>{viewUser.role}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span>{viewUser.phone_number ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Joined</span>
                <span>{format(new Date(viewUser.created_at), 'dd MMM yyyy, HH:mm')}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewUser(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Modal */}
      <Dialog open={!!roleTarget} onOpenChange={() => setRoleTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for <strong>{roleTarget?.email}</strong>.
            </DialogDescription>
          </DialogHeader>
          <Select value={newRole} onValueChange={(v) => setNewRole(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="operator">Operator</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleTarget(null)}>Cancel</Button>
            <Button onClick={handleRoleSave} disabled={savingRole} className="gap-2">
              {savingRole && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete{' '}
              <strong>{deleteTarget?.email}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="gap-2"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
