'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bus, Loader2, ArrowRight, User, Briefcase, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, role: authRole } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'client' | 'operator'>('client');

  useEffect(() => {
    if (user && authRole) {
      if (authRole === 'admin') router.push('/admin/dashboard');
      else if (authRole === 'operator') router.push('/operator/dashboard');
      else router.push('/dashboard');
    }
  }, [user, authRole, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role, 
          }
        }
      });

      if (authError) throw authError;

      toast.success('Registration successful! Please sign in.');
      router.push('/login');

    } catch (error: any) {
      toast.error(error.message || 'Failed to register');
      
      if (error.message.includes('FetchError') || error.message.includes('Failed to fetch')) {
        toast.warning('Demo Mode: Simulating successful registration.');
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950 selection:bg-primary selection:text-white font-sans">
      
      {/* Left Side - Editorial Image & Perks (45% width) */}
      <div className="hidden lg:flex relative w-[45%] flex-col justify-between overflow-hidden bg-black p-12">
        <Image 
          src="https://images.unsplash.com/photo-1494783367193-149034c05e8f?q=80&w=2000&auto=format&fit=crop" 
          alt="Morning Travel" 
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
              <Bus className="h-5 w-5 text-amber-400" />
            </div>
            <span className="text-sm font-bold tracking-[0.25em] text-white uppercase">
              BusSphere
            </span>
          </div>
          
          <h2 className="text-6xl font-light tracking-tighter text-white mb-6 leading-[1.1]">
            Unlock the <br />
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
              peninsula.
            </span>
          </h2>
          <p className="text-white/70 font-light text-lg max-w-md leading-relaxed">
            Join Malaysia&apos;s premier transport network. Experience seamless booking and unparalleled operational tools.
          </p>
        </div>

        {/* Bottom Floating Perk Card */}
        <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl max-w-md shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h3 className="text-white font-medium tracking-wide">Membership Benefits</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-white/80 text-sm font-light">Priority seat selection and instant digital boarding passes.</p>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-white/80 text-sm font-light">Bank-grade encryption and secure passenger manifests.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Interactive Console (55% width) */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-4 sm:p-8 lg:p-12 relative overflow-hidden">
        
        {/* Ambient Web Design Elements */}
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/10 dark:bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-amber-400/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] mix-blend-overlay pointer-events-none"></div>

        {/* Main Form Console (Floating Card Style) */}
        <div className="w-full max-w-[480px] bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-none border border-zinc-100 dark:border-zinc-800 p-8 sm:p-10 relative z-10">
          
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-2">
              Create an account
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
              Join as a traveller or register your bus fleet.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            
            {/* Ultra-Premium Animated Role Selector */}
            <div className="relative flex p-1.5 bg-zinc-100 dark:bg-zinc-950 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 shadow-inner">
              {/* Sliding Pill Background */}
              <div 
                className={`absolute inset-y-1.5 w-[calc(50%-6px)] bg-white dark:bg-zinc-800 rounded-xl shadow-sm transition-all duration-500 ease-out ${
                  role === 'client' ? 'left-1.5' : 'left-[calc(50%+1.5px)]'
                }`}
              />
              
              <button
                type="button"
                onClick={() => setRole('client')}
                className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-colors duration-300 rounded-xl ${
                  role === 'client' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                }`}
              >
                <User className={`h-4 w-4 transition-transform duration-300 ${role === 'client' ? 'scale-110 text-primary' : ''}`} /> 
                Traveller
              </button>
              
              <button
                type="button"
                onClick={() => setRole('operator')}
                className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-colors duration-300 rounded-xl ${
                  role === 'operator' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                }`}
              >
                <Briefcase className={`h-4 w-4 transition-transform duration-300 ${role === 'operator' ? 'scale-110 text-primary' : ''}`} /> 
                Operator
              </button>
            </div>

            {/* Inputs Grid */}
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5 group">
                <label htmlFor="fullName" className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 group-focus-within:text-primary transition-colors ml-1">
                  {role === 'client' ? 'Full Name' : 'Company Name'}
                </label>
                <Input 
                  id="fullName" 
                  type="text" 
                  placeholder={role === 'client' ? "e.g. Sarah Jenkins" : "e.g. Express Transport Ltd."}
                  required 
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="h-14 px-5 bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-2xl text-base font-medium placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:border-primary transition-all duration-300"
                />
              </div>

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
                <label htmlFor="password" className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 group-focus-within:text-primary transition-colors ml-1">
                  Password
                </label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Minimum 6 characters"
                  required 
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-14 px-5 bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-2xl text-base font-medium placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:border-primary transition-all duration-300"
                />
              </div>
            </div>
            
            <Button 
              className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 mt-6 text-sm font-bold tracking-wide group flex items-center justify-center gap-2" 
              type="submit" 
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-4 w-4 opacity-70 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
                </>
              )}
            </Button>
            
            <div className="text-center pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-8">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:text-primary/80 transition-colors font-bold tracking-wide ml-1">
                  Sign In
                </Link>
              </p>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}