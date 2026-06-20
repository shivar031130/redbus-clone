'use client';

import { CheckCircle, Clock, Loader2, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSent(true);
    toast.success('Message sent! We\'ll get back to you within 24 hours.');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#0A2540] text-white">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-4">Contact Us</h1>
          <p className="text-xl text-white/70 max-w-xl mx-auto">
            Have a question, feedback, or need help? We're here for you.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-3 gap-12">
        {/* Info Cards */}
        <div className="space-y-6">
          {[
            { icon: Mail, title: 'Email Support', value: 'support@redBus.my', sub: 'Response within 24 hours' },
            { icon: Phone, title: 'Phone', value: '+60 3-2345 6789', sub: 'Mon–Fri, 8am–8pm' },
            { icon: MapPin, title: 'Headquarters', value: 'Level 12, Menara TM', sub: 'Jalan Pantai Baru, KL' },
            { icon: Clock, title: 'Office Hours', value: 'Mon – Fri: 9am – 6pm', sub: 'Weekends: Online only' },
          ].map((item) => (
            <div key={item.title} className="flex gap-4 p-5 bg-slate-50 rounded-2xl">
              <div className="bg-primary/10 w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{item.title}</p>
                <p className="text-slate-800 font-medium mt-0.5">{item.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2 bg-slate-50 rounded-3xl p-8 md:p-10">
          {sent ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-12 text-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <h2 className="text-2xl font-bold text-slate-900">Message Sent!</h2>
              <p className="text-slate-600 max-w-sm">Thank you for reaching out. Our team will respond to your enquiry within 24 hours.</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Send us a message</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name *</label>
                    <input
                      required
                      className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      placeholder="e.g. Ahmad Fauzi"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address *</label>
                    <input
                      required
                      type="email"
                      className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject *</label>
                  <input
                    required
                    className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    placeholder="e.g. Booking issue, refund request..."
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Message *</label>
                  <textarea
                    required
                    rows={5}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                    placeholder="Describe your issue or question in detail..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-13 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all py-3.5"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Send className="h-4 w-4" /> Send Message</>}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
