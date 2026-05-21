'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bus, Loader2, KeyRound } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    // Check if the user is currently engaged in a password recovery session
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      setVerifying(false);
      // Supabase's auth.resetPasswordForEmail automatically signs the user in 
      // if they click the magic link, so they should have a session here.
      if (error || !session) {
        toast.error('Invalid or expired recovery link.');
        router.push('/login');
      }
    };
    checkSession();
  }, [supabase, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast.success('Password updated successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950 selection:bg-primary selection:text-white font-sans">
      
      {/* Left Side */}
      <div className="hidden lg:flex relative w-[45%] flex-col justify-between overflow-hidden bg-black p-12">
        <Image 
          src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2000&auto=format&fit=crop" 
          alt="Secure Journey" 
          fill
          priority
          className="object-cover opacity-60 scale-105 hover:scale-100 transition-transform duration-[20s] ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/90"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-3 mb-10">
            <div className="h-10 w-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
              <Bus className="h-5 w-5 text-blue-400" />
            </div>
            <span className="text-sm font-bold tracking-[0.25em] text-white uppercase">
              BusSphere
            </span>
          </div>
          
          <h2 className="text-6xl font-light tracking-tighter text-white mb-6 leading-[1.1]">
            Secure <br />
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
              your account.
            </span>
          </h2>
          <p className="text-white/70 font-light text-lg max-w-md leading-relaxed">
            Create a strong new password to protect your bookings, payment details, and travel history.
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-4 sm:p-8 lg:p-12 relative overflow-hidden">
        
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/10 dark:bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-blue-400/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="w-full max-w-[480px] bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-none border border-zinc-100 dark:border-zinc-800 p-8 sm:p-10 relative z-10">
          
          <div className="mb-10 text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <KeyRound className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-2">
              Set New Password
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
              Please enter your new password below.
            </p>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5 group">
                <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 group-focus-within:text-primary transition-colors ml-1">
                  New Password
                </label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-14 px-5 bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-2xl text-base font-medium placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:border-primary transition-all duration-300"
                />
              </div>
              
              <div className="space-y-1.5 group">
                <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 group-focus-within:text-primary transition-colors ml-1">
                  Confirm Password
                </label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="h-14 px-5 bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-2xl text-base font-medium placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:border-primary transition-all duration-300"
                />
              </div>
            </div>
            
            <Button 
              className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 mt-8 text-sm font-bold tracking-wide flex items-center justify-center" 
              type="submit" 
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Update Password'}
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
}
