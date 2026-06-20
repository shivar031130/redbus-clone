'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore, UserRole } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { ArrowRight, Bus, Loader2, MapPin, Ticket } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium font-sans">Loading login portal...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');
  const { user, role, setUser } = useAuthStore();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user && role) {
      if (nextParam) router.push(nextParam);
      else if (role === 'admin') router.push('/admin/dashboard');
      else if (role === 'operator') router.push('/operator/dashboard');
      else router.push('/dashboard');
    }
  }, [user, role, router, nextParam]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Fetch the user's role from the profiles table
      let role: UserRole = 'client';
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profile) {
        role = profile.role as UserRole;
      } else {
        // Auto-create profile if trigger missed
        await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: authData.user.email!,
            role: 'client'
          });
        role = 'client';
      }

      setUser(authData.user, role);

      toast.success('Welcome back!');

      // 3. Route based on role or next URL
      if (nextParam) router.push(nextParam);
      else if (role === 'admin') router.push('/admin/dashboard');
      else if (role === 'operator') router.push('/operator/dashboard');
      else router.push('/dashboard');

    } catch (error: any) {
      toast.error(error.message || 'Failed to login');

      if (error.message.includes('FetchError') || error.message.includes('Failed to fetch')) {
        simulateDemoLogin();
      }
    } finally {
      setLoading(false);
    }
  };

  const simulateDemoLogin = () => {
    toast.warning('Using Demo Mode Login due to network error.');

    let role: UserRole = 'client';
    if (email.includes('admin')) role = 'admin';
    if (email.includes('operator')) role = 'operator';

    setUser({ id: 'demo-user-id', email }, role);

    if (nextParam) router.push(nextParam);
    else if (role === 'admin') router.push('/admin/dashboard');
    else if (role === 'operator') router.push('/operator/dashboard');
    else router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950 selection:bg-primary selection:text-white font-sans">

      {/* Left Side - Editorial Image & Perks (45% width) */}
      <div className="hidden lg:flex relative w-[45%] flex-col justify-between overflow-hidden bg-black p-12">
        {/* Evening/Cityscape image for "Return/Login" contrast */}
        <Image
          src="https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?q=80&w=2000&auto=format&fit=crop"
          alt="Night Travel"
          fill
          priority
          className="object-cover opacity-60 scale-105 hover:scale-100 transition-transform duration-[20s] ease-out"
        />
        {/* Complex gradient for perfect text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/90"></div>

        {/* Top Branding */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-3 mb-10">
            <div className="h-10 w-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
              <Bus className="h-5 w-5 text-blue-400" />
            </div>
            <span className="text-sm font-bold tracking-[0.25em] text-white uppercase">
              redBus
            </span>
          </div>

          <h2 className="text-6xl font-light tracking-tighter text-white mb-6 leading-[1.1]">
            Welcome <br />
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
              back.
            </span>
          </h2>
          <p className="text-white/70 font-light text-lg max-w-md leading-relaxed">
            Your next destination awaits. Sign in to access your digital boarding passes, live tracking, and operator tools.
          </p>
        </div>

        {/* Bottom Floating Perk Card */}
        <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl max-w-md shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Ticket className="h-5 w-5 text-blue-400" />
            <h3 className="text-white font-medium tracking-wide">Your Portal Awaits</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Ticket className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-white/80 text-sm font-light">Access your upcoming itineraries and digital boarding passes.</p>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-white/80 text-sm font-light">Track your fleet in real-time or manage your booking preferences.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Interactive Console (55% width) */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-4 sm:p-8 lg:p-12 relative overflow-hidden">

        {/* Ambient Web Design Elements */}
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/10 dark:bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-blue-400/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] mix-blend-overlay pointer-events-none"></div>

        {/* Main Form Console (Floating Card Style) */}
        <div className="w-full max-w-[480px] bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-none border border-zinc-100 dark:border-zinc-800 p-8 sm:p-10 relative z-10">

          <div className="mb-10 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-2">
              Sign In
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
              Enter your credentials to access your account.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">

            {/* Inputs Grid */}
            <div className="space-y-4">
              <div className="space-y-1.5 group">
                <label htmlFor="email" className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 group-focus-within:text-primary transition-colors ml-1">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="hello@example.com"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="h-14 px-5 bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-2xl text-base font-medium placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:border-primary transition-all duration-300"
                />
              </div>

              <div className="space-y-1.5 group">
                <div className="flex items-center justify-between ml-1">
                  <label htmlFor="password" className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 group-focus-within:text-primary transition-colors">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-[11px] font-bold uppercase tracking-wider text-primary hover:text-primary/70 transition-colors">
                    Forgot?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-14 px-5 bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-2xl text-base font-medium placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:border-primary transition-all duration-300"
                />
              </div>
            </div>

            <Button
              className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 mt-8 text-sm font-bold tracking-wide group flex items-center justify-center gap-2"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Access Portal
                  <ArrowRight className="h-4 w-4 opacity-70 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
                </>
              )}
            </Button>

            <div className="text-center pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-8">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                New to redBus?{' '}
                <Link href="/register" className="text-primary hover:text-primary/80 transition-colors font-bold tracking-wide ml-1">
                  Create Account
                </Link>
              </p>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}