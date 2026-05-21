'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, User as UserIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function OperatorSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [operator, setOperator] = useState<any>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profileData) {
          setProfile(profileData);
          setAvatarUrl(profileData.avatar_url);
        }

        const { data: operatorData } = await supabase.from('operators').select('*').eq('profile_id', user.id).maybeSingle();
        if (operatorData) {
          setOperator(operatorData);
        } else {
          // Initialize empty operator object so form is always visible
          setOperator({
            company_name: '',
            registration_number: '',
            contact_email: '',
            contact_phone: ''
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
      
      setAvatarUrl(publicUrl);
      toast.success('Avatar updated successfully!');
    } catch (error: any) {
      toast.error('Error uploading avatar: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (profile) {
        await supabase.from('profiles').update({
          full_name: profile.full_name,
          phone_number: profile.phone_number
        }).eq('id', profile.id);
      }
      
      if (operator) {
        if (operator.id) {
          await supabase.from('operators').update({
            company_name: operator.company_name,
            registration_number: operator.registration_number,
            contact_email: operator.contact_email,
            contact_phone: operator.contact_phone
          }).eq('id', operator.id);
        } else {
          // Create new operator row
          const { data: newOp, error: insertError } = await supabase.from('operators').insert({
            profile_id: profile.id,
            company_name: operator.company_name,
            registration_number: operator.registration_number,
            contact_email: operator.contact_email,
            contact_phone: operator.contact_phone,
            status: 'pending'
          }).select().single();
          
          if (insertError) throw insertError;
          setOperator(newOp);
        }
      }
      
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error('Failed to update profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and company profile.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="relative h-32 w-32 rounded-full overflow-hidden bg-secondary border-4 border-white shadow-lg flex items-center justify-center group">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <UserIcon className="h-12 w-12 text-muted-foreground" />
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white flex-col gap-1">
                  {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                  <span className="text-xs">Upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                </label>
              </div>
              <p className="text-sm text-center text-muted-foreground">Click image to update your avatar</p>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
              <CardDescription>Update your personal information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input 
                    value={profile?.full_name || ''} 
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input 
                    value={profile?.phone_number || ''} 
                    onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profile?.email || ''} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Email cannot be changed directly.</p>
              </div>
            </CardContent>
          </Card>

          {operator !== null && (
            <Card>
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
                <CardDescription>Update your business information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input 
                      value={operator.company_name || ''} 
                      onChange={(e) => setOperator({ ...operator, company_name: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Registration Number</Label>
                    <Input 
                      value={operator.registration_number || ''} 
                      onChange={(e) => setOperator({ ...operator, registration_number: e.target.value })} 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Support Email</Label>
                    <Input 
                      value={operator.contact_email || ''} 
                      onChange={(e) => setOperator({ ...operator, contact_email: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Support Phone</Label>
                    <Input 
                      value={operator.contact_phone || ''} 
                      onChange={(e) => setOperator({ ...operator, contact_phone: e.target.value })} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
