'use client';

import { ArrowRight, BarChart3, BusFront, CheckCircle, Headphones, Loader2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

const benefits = [
  { icon: BarChart3, title: 'Grow Your Revenue', desc: 'Tap into redBus\'s growing user base of 1M+ travellers and fill more seats on every trip.' },
  { icon: ShieldCheck, title: 'Easy Fleet Management', desc: 'Manage your buses, routes, schedules, and bookings from one powerful operator dashboard.' },
  { icon: BarChart3, title: 'Real-time Analytics', desc: 'Track occupancy rates, revenue trends, and passenger data with live reporting tools.' },
  { icon: Headphones, title: 'Dedicated Support', desc: 'Your own account manager and priority support line to resolve any operational issue fast.' },
];

const steps = [
  { step: '01', title: 'Submit Application', desc: 'Fill in your company details, registration number, and fleet information below.' },
  { step: '02', title: 'Verification', desc: 'Our team reviews your application within 2–5 business days and may request documents.' },
  { step: '03', title: 'Onboarding', desc: 'Get access to the operator portal, set up your routes and buses, and start selling tickets.' },
  { step: '04', title: 'Go Live', desc: 'Your routes appear on redBusinstantly — start earning from day one.' },
];

export default function OperatorJoinPage() {
  const [form, setForm] = useState({ company: '', reg: '', email: '', phone: '', fleetSize: '', routes: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    setLoading(false);
    setSubmitted(true);
    toast.success('Application received! We\'ll be in touch within 5 business days.');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#0A2540] text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-6">
              <BusFront className="h-4 w-4 text-blue-300" /> For Bus Operators
            </div>
            <h1 className="text-5xl font-bold leading-tight mb-6">
              Partner with redBus.<br />
              <span className="text-blue-300">Grow your fleet.</span>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mb-8">
              Join Malaysia's leading bus booking platform and reach millions of travellers. Manage everything in one place — from seat inventory to real-time bookings.
            </p>
            <a href="#apply" className="inline-flex items-center gap-2 bg-white text-[#0A2540] font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors">
              Apply Now <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="hidden lg:grid grid-cols-2 gap-4">
            {[
              { label: 'Active Partners', value: '50+' },
              { label: 'Routes on Platform', value: '200+' },
              { label: 'Monthly Passengers', value: '80K+' },
              { label: 'Avg. Seat Fill Rate', value: '78%' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 border border-white/20 rounded-2xl p-6 backdrop-blur-sm">
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Why partner with us?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b) => (
            <div key={b.title} className="bg-slate-50 rounded-2xl p-6">
              <div className="bg-primary/10 w-11 h-11 rounded-xl flex items-center justify-center mb-4">
                <b.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{b.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">How it works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <div key={s.step} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-full w-full h-px bg-slate-200 -translate-x-1/2 z-0" />
                )}
                <div className="relative bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <div className="text-4xl font-black text-primary/20 mb-3">{s.step}</div>
                  <h3 className="font-bold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="apply" className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Apply to Become a Partner</h2>
          <p className="text-slate-600">Fill in the form and our team will review your application within 5 business days.</p>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center gap-5 py-16 text-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h3 className="text-2xl font-bold text-slate-900">Application Received!</h3>
            <p className="text-slate-600 max-w-md">Thank you for your interest. Our partnership team will contact you at the email provided within 5 business days.</p>
            <Link href="/" className="text-primary font-semibold hover:underline">Back to Home</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-slate-50 rounded-3xl p-8 md:p-10 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { label: 'Company Name *', key: 'company', placeholder: 'e.g. Aeroline Express Sdn Bhd', type: 'text' },
                { label: 'Company Registration No. *', key: 'reg', placeholder: 'e.g. 1234567-X', type: 'text' },
                { label: 'Business Email *', key: 'email', placeholder: 'business@yourcompany.com', type: 'email' },
                { label: 'Contact Phone *', key: 'phone', placeholder: '+60 3-XXXX XXXX', type: 'tel' },
                { label: 'Fleet Size (No. of Buses)', key: 'fleetSize', placeholder: 'e.g. 10', type: 'number' },
              ].map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{field.label}</label>
                  <input
                    required={field.label.includes('*')}
                    type={field.type}
                    placeholder={field.placeholder}
                    className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    value={(form as any)[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Primary Routes Operated</label>
              <textarea
                rows={3}
                placeholder="e.g. KL – Penang, KL – Johor Bahru, Penang – Ipoh"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                value={form.routes}
                onChange={(e) => setForm({ ...form, routes: e.target.value })}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ArrowRight className="h-4 w-4" /> Submit Application</>}
            </button>
            <p className="text-xs text-slate-500 text-center">
              By submitting, you agree to our{' '}
              <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and{' '}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </form>
        )}
      </section>
    </div>
  );
}
