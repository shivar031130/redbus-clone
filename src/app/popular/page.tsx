import Link from 'next/link';
import { ArrowRight, MapPin, Star, Clock } from 'lucide-react';

const popularRoutes = [
  { from: 'Kuala Lumpur', to: 'Penang', duration: '4–5 hrs', from_short: 'KL', to_short: 'PNG', price: 35, rating: 4.8, trips: 120 },
  { from: 'Kuala Lumpur', to: 'Johor Bahru', duration: '4–5 hrs', from_short: 'KL', to_short: 'JB', price: 30, rating: 4.7, trips: 95 },
  { from: 'Kuala Lumpur', to: 'Ipoh', duration: '2.5–3 hrs', from_short: 'KL', to_short: 'IPH', price: 20, rating: 4.9, trips: 80 },
  { from: 'Penang', to: 'Kuala Lumpur', duration: '4–5 hrs', from_short: 'PNG', to_short: 'KL', price: 35, rating: 4.8, trips: 115 },
  { from: 'Johor Bahru', to: 'Kuala Lumpur', duration: '4–5 hrs', from_short: 'JB', to_short: 'KL', price: 30, rating: 4.6, trips: 90 },
  { from: 'Kuala Lumpur', to: 'Kota Bharu', duration: '7–8 hrs', from_short: 'KL', to_short: 'KB', price: 55, rating: 4.5, trips: 42 },
  { from: 'Kuala Lumpur', to: 'Kuantan', duration: '3–4 hrs', from_short: 'KL', to_short: 'KTN', price: 25, rating: 4.7, trips: 60 },
  { from: 'Ipoh', to: 'Penang', duration: '2 hrs', from_short: 'IPH', to_short: 'PNG', price: 18, rating: 4.8, trips: 55 },
  { from: 'Kuala Lumpur', to: 'Malacca', duration: '2 hrs', from_short: 'KL', to_short: 'MLK', price: 15, rating: 4.9, trips: 70 },
];

export default function PopularRoutesPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-[#0A2540] text-white">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h1 className="text-5xl font-bold mb-4">Popular Routes</h1>
          <p className="text-white/70 text-xl max-w-xl mx-auto">
            Discover the most travelled bus routes across Malaysia, with the best operators and fares.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularRoutes.map((route) => (
            <Link
              key={`${route.from}-${route.to}`}
              href={`/search?origin=${encodeURIComponent(route.from)}&destination=${encodeURIComponent(route.to)}`}
              className="group bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              {/* Card header */}
              <div className="bg-gradient-to-br from-primary/5 to-blue-50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 text-xl font-bold text-slate-900">
                    <span>{route.from_short}</span>
                    <ArrowRight className="h-5 w-5 text-primary" />
                    <span>{route.to_short}</span>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-1 rounded-full">
                    {route.trips} trips/wk
                  </span>
                </div>
                <div className="text-sm text-slate-500">
                  {route.from} → {route.to}
                </div>
              </div>

              {/* Card body */}
              <div className="p-5 flex items-center justify-between">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Clock className="h-4 w-4" />
                    {route.duration}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                    {route.rating}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">From</div>
                  <div className="text-xl font-bold text-primary">RM {route.price}</div>
                </div>
              </div>

              <div className="px-5 pb-5">
                <div className="w-full bg-primary text-white text-sm font-semibold py-2.5 rounded-xl text-center group-hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                  Search Tickets <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
