import { ArrowRight, Bus, MapPin, ShieldCheck, Star, Users } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-[#0A2540] text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
        <div className="relative max-w-6xl mx-auto px-6 py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-6">
            <Bus className="h-4 w-4 text-blue-300" /> Malaysia's Premier Bus Network
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Connecting Every Corner<br />of <span className="text-blue-300">Malaysia</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            redBuswas built to make inter-city travel simple, transparent, and accessible for every Malaysian — whether you're a daily commuter or a weekend explorer.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary text-white">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '50+', label: 'Partner Operators' },
            { value: '200+', label: 'Routes Nationwide' },
            { value: '1M+', label: 'Tickets Booked' },
            { value: '4.8★', label: 'Average Rating' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-bold mb-1">{s.value}</div>
              <div className="text-sm text-white/70">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-4xl font-bold text-slate-900 mb-6 leading-tight">Our Mission</h2>
          <p className="text-slate-600 text-lg leading-relaxed mb-6">
            We believe that buying a bus ticket should be as simple as buying a coffee. No queues, no uncertainty — just seamless travel from point A to point B.
          </p>
          <p className="text-slate-600 leading-relaxed mb-8">
            redBusconnects travellers with Malaysia's top-rated bus operators through a single, unified platform. Real-time seat availability, instant digital tickets, and live journey updates — all in your pocket.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
          >
            Find Your Route <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Users, title: 'Passenger First', desc: 'Every feature is designed around the traveller experience.' },
            { icon: ShieldCheck, title: 'Safe & Secure', desc: 'Bank-grade encryption for all bookings and payments.' },
            { icon: MapPin, title: 'Nationwide Coverage', desc: 'Routes from Perlis to Johor and everywhere in between.' },
            { icon: Star, title: 'Verified Operators', desc: 'All operators go through a strict vetting and approval process.' },
          ].map((item) => (
            <div key={item.title} className="bg-slate-50 rounded-2xl p-6">
              <div className="bg-primary/10 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team CTA */}
      <section className="bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Built by Malaysians, for Malaysians</h2>
          <p className="text-slate-600 text-lg mb-8 leading-relaxed">
            Our team is passionate about improving transportation infrastructure for everyone. We're headquartered in Kuala Lumpur and driven by a vision of effortless connectivity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors">
              Get in Touch
            </Link>
            <Link href="/operator-join" className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 font-semibold px-6 py-3 rounded-xl hover:bg-white transition-colors">
              Partner With Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
