'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2, User, Lock, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function ProfileSettingsPage() {
  const { user, clearUser } = useAuthStore();
  const supabase = createClient();

  const [profile, setProfile] = useState({ full_name: '', phone_number: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Load profile
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoadingProfile(true);
      const { data } = await supabase.from('profiles').select('full_name, phone_number, email').eq('id', user.id).single();
      if (data) setProfile({ full_name: data.full_name ?? '', phone_number: data.phone_number ?? '', email: data.email });
      setLoadingProfile(false);
    };
    load();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: profile.full_name, phone_number: profile.phone_number })
        .eq('id', user.id);
      if (error) throw error;
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error('Update failed: ' + (err.message ?? 'Error'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) { toast.error('New passwords do not match.'); return; }
    if (pwForm.newPw.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    setSavingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.newPw });
      if (error) throw error;
      toast.success('Password changed successfully!');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err: any) {
      toast.error('Password change failed: ' + (err.message ?? 'Error'));
    } finally {
      setSavingPw(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      // Delete profile (cascade removes all data)
      await supabase.from('profiles').delete().eq('id', user?.id);
      await supabase.auth.signOut();
      clearUser();
      toast.success('Account deleted.');
      window.location.href = '/';
    } catch (err: any) {
      toast.error('Delete failed: ' + (err.message ?? 'Error'));
    } finally {
      setDeletingAccount(false);
      setDeleteDialog(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
      </div>

      {/* Personal Info */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg"><User className="h-5 w-5 text-primary" /></div>
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your name, phone, and contact details.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} placeholder="Your full name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={profile.email} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Email cannot be changed. Contact support for help.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" value={profile.phone_number} onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })} placeholder="+60 12 345 6789" />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg"><Lock className="h-5 w-5 text-blue-600" /></div>
            <div>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="newPw">New Password</Label>
              <Input id="newPw" type="password" value={pwForm.newPw} onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })} placeholder="Min. 6 characters" minLength={6} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPw">Confirm New Password</Label>
              <Input id="confirmPw" type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} placeholder="Repeat new password" minLength={6} />
            </div>
            <Button type="submit" variant="outline" disabled={savingPw} className="gap-2">
              {savingPw && <Loader2 className="h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-100 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-red-50 p-2 rounded-lg"><Trash2 className="h-5 w-5 text-red-600" /></div>
            <div>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>Permanently delete your account and all associated data.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setDeleteDialog(true)}>Delete My Account</Button>
        </CardContent>
      </Card>

      {/* Delete Confirm */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This will permanently delete your account, booking history, and all personal data. This action <strong>cannot be undone</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deletingAccount} className="gap-2">
              {deletingAccount && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
