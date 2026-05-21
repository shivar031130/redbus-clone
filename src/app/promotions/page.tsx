import Link from 'next/link';
import { Tag, Clock, ArrowRight, Star } from 'lucide-react';

const promotions = [
  {
    id: 1,
    badge: '🔥 Flash Sale',
    title: '30% Off Penang Routes',
    desc: 'Book KL–Penang or Penang–KL this weekend and save up to RM 10 per ticket. Use code PENANG30 at checkout.',
    code: 'PENANG30',
    discount: '30%',
    validUntil: '25 May 2026',
    routeFrom: 'Kuala Lumpur',
    routeTo: 'Penang',
    color: 'from-blue-600 to-blue-800',
  },
  {
    id: 2,
    badge: '🌙 Weekend Special',
    title: 'Midnight Express — 20% Off',
    desc: 'Travel in comfort on late-night departures from KL to JB. Premium sleeper seats at economy prices.',
    code: 'NIGHT20',
    discount: '20%',
    validUntil: '31 May 2026',
    routeFrom: 'Kuala Lumpur',
    routeTo: 'Johor Bahru',
    color: 'from-violet-600 to-purple-800',
  },
  {
    id: 3,
    badge: '🎉 New User Offer',
    title: 'RM 5 Off Your First Booking',
    desc: 'New to BusSphere? Get RM 5 off your very first ticket booking. No minimum spend required.',
    code: 'NEWUSER5',
    discount: 'RM 5',
    validUntil: '30 Jun 2026',
    routeFrom: 'Any',
    routeTo: 'Any',
    color: 'from-emerald-600 to-teal-800',
  },
  {
    id: 4,
    badge: '👨‍👩‍👧‍👦 Group Deal',
    title: 'Buy 4, Get 1 Free',
    desc: 'Travelling with family or friends? Book 4 tickets on the same schedule and the cheapest one is free.',
    code: 'GROUP4FREE',
    discount: '1 Free',
    validUntil: '15 Jun 2026',
    routeFrom: 'Any',
    routeTo: 'Any',
    color: 'from-orange-500 to-red-700',
  },
];

export default function PromotionsPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-[#0A2540] text-white">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h1 className="text-5xl font-bold mb-4">Promotions &amp; Deals</h1>
          <p className="text-white/70 text-xl max-w-xl mx-auto">
            Exclusive discounts and limited-time offers for BusSphere passengers.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-8">
        {promotions.map((promo) => (
          <div key={promo.id} className="rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-lg transition-all group">
            {/* Gradient Banner */}
            <div className={`bg-gradient-to-br ${promo.color} p-8 text-white relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full translate-x-16 -translate-y-16" />
              <span className="text-sm font-semibold bg-white/20 border border-white/30 rounded-full px-3 py-1 inline-block mb-4">{promo.badge}</span>
              <h2 className="text-2xl font-bold mb-2">{promo.title}</h2>
              <p className="text-white/80 text-sm leading-relaxed">{promo.desc}</p>

              <div className="mt-6 flex items-center gap-4">
                <div className="bg-white/20 border border-white/30 rounded-xl px-4 py-2 font-mono font-bold tracking-widest text-sm">
                  {promo.code}
                </div>
                <span className="text-white/60 text-xs">Copy &amp; paste at checkout</span>
              </div>
            </div>

            {/* Card Footer */}
            <div className="bg-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> Valid until {promo.validUntil}
                </span>
                {promo.routeFrom !== 'Any' && (
                  <span className="flex items-center gap-1">
                    <ArrowRight className="h-4 w-4" /> {promo.routeFrom} → {promo.routeTo}
                  </span>
                )}
              </div>
              <Link
                href={`/search${promo.routeFrom !== 'Any' ? `?origin=${encodeURIComponent(promo.routeFrom)}&destination=${encodeURIComponent(promo.routeTo)}` : ''}`}
                className="flex items-center gap-1 text-primary font-semibold text-sm hover:underline"
              >
                Book Now <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </section>

      <section className="bg-primary/5 border-t border-primary/10">
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <Star className="h-8 w-8 text-amber-400 fill-amber-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-slate-900 mb-3">More deals coming soon</h3>
          <p className="text-slate-600 mb-6">Create a free account to get notified about exclusive member-only promotions and flash sales.</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors">
            Sign Up Free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
