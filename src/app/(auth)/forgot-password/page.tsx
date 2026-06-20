'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Bus, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success('Password reset link sent to your email.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950 selection:bg-primary selection:text-white font-sans">

      {/* Left Side - Editorial Image & Perks */}
      <div className="hidden lg:flex relative w-[45%] flex-col justify-between overflow-hidden bg-black p-12">
        <Image
          src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=2000&auto=format&fit=crop"
          alt="Travel Light"
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
              redBus
            </span>
          </div>

          <h2 className="text-6xl font-light tracking-tighter text-white mb-6 leading-[1.1]">
            Regain <br />
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
              access.
            </span>
          </h2>
          <p className="text-white/70 font-light text-lg max-w-md leading-relaxed">
            Don't let a forgotten password stop your journey. Recover your account securely and get back on the road.
          </p>
        </div>
      </div>

      {/* Right Side - Interactive Console */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-4 sm:p-8 lg:p-12 relative overflow-hidden">

        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/10 dark:bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-blue-400/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="w-full max-w-[480px] bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-none border border-zinc-100 dark:border-zinc-800 p-8 sm:p-10 relative z-10">

          {submitted ? (
            <div className="text-center py-8">
              <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Check your inbox</h2>
              <p className="text-zinc-500 mb-8">We've sent a password reset link to <br /><strong>{email}</strong></p>
              <Link href="/login">
                <Button variant="outline" className="w-full rounded-2xl h-12">
                  Return to Login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-10 text-center">
                <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-2">
                  Reset Password
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleReset} className="space-y-6">
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
                </div>

                <Button
                  className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 mt-8 text-sm font-bold tracking-wide flex items-center justify-center"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send Reset Link'}
                </Button>

                <div className="text-center pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-8">
                  <Link href="/login" className="inline-flex items-center text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-primary transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
                  </Link>
                </div>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
