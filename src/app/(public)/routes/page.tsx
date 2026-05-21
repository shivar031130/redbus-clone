'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, ArrowRight, Compass, Shield, Star, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

const POPULAR_ROUTES = [
  {
    title: "Kuala Lumpur",
    origin: "Penang",
    destination: "KL Sentral",
    price: "45.00",
    image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2000&auto=format&fit=crop" 
  },
  {
    title: "Johor Bahru",
    origin: "Kuala Lumpur",
    destination: "Larkin Sentral",
    price: "35.00",
    image: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=2000&auto=format&fit=crop" 
  },
  {
    title: "Penang Island",
    origin: "Johor Bahru",
    destination: "Sungai Nibong",
    price: "85.00",
    image: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=2000&auto=format&fit=crop" 
  },
  {
    title: "Malacca",
    origin: "Kuala Lumpur",
    destination: "Melaka Sentral",
    price: "25.00",
    image: "https://images.unsplash.com/photo-1584661156681-540e140faa3f?q=80&w=2000&auto=format&fit=crop" 
  },
  {
    title: "Ipoh",
    origin: "Penang",
    destination: "Amanjaya",
    price: "30.00",
    image: "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?q=80&w=2000&auto=format&fit=crop" 
  },
  {
    title: "Genting Highlands",
    origin: "Kuala Lumpur",
    destination: "Awana Bus Terminal",
    price: "15.00",
    image: "https://images.unsplash.com/photo-1610423086918-1c4b12dc1b9a?q=80&w=2000&auto=format&fit=crop" 
  }
];

export default function RoutesPage() {
  const [liveRoutes, setLiveRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchRoutes() {
      try {
        const { data, error } = await supabase.from('routes').select('*').eq('is_active', true);
        if (error) throw error;
        setLiveRoutes(data || []);
      } catch (err) {
        console.error("Failed to fetch live routes", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRoutes();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-background">
      {/* Hero Section */}
      <section className="relative w-full h-[50vh] min-h-[400px] flex flex-col items-center justify-center">
        <div className="absolute inset-0 z-0 bg-black overflow-hidden">
          <Image 
            src="https://images.unsplash.com/photo-1506521781263-d8422e82f27a?q=80&w=3000&auto=format&fit=crop" 
            alt="Travel Routes" 
            fill 
            priority
            className="object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-zinc-50 dark:to-background"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full text-center">
          <h1 className="text-5xl md:text-6xl font-light tracking-tighter text-white mb-6">
            Explore All <span className="font-bold">Routes</span>
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto font-light leading-relaxed">
            Discover breathtaking destinations and seamless connections across Malaysia. Your next journey starts here.
          </p>
        </div>
      </section>

      {/* Featured Editorial Routes */}
      <section className="py-20 -mt-20 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {POPULAR_ROUTES.slice(0, 3).map((route, idx) => (
              <Link href={`/search?origin=${encodeURIComponent(route.origin)}&destination=${encodeURIComponent(route.destination)}`} key={idx}>
                <div className="group cursor-pointer relative rounded-2xl overflow-hidden h-[400px] shadow-lg hover:shadow-2xl transition-all duration-700">
                  <Image 
                    src={route.image} 
                    alt={route.title}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100"></div>
                  
                  <div className="absolute inset-0 p-8 flex flex-col justify-end">
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <p className="text-amber-400 text-xs font-bold tracking-widest uppercase mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                        From RM {route.price}
                      </p>
                      <h4 className="text-white font-medium text-3xl tracking-tight mb-4">
                        {route.title}
                      </h4>
                      <div className="flex items-center gap-4 text-white/80 text-sm font-light">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-white/50" /> {route.origin}
                        </span>
                        <div className="w-8 h-[1px] bg-white/30"></div>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-white/50" /> {route.destination}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Live Operator Routes */}
      <section className="py-16 bg-white dark:bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-light tracking-tight mb-4">Live <span className="font-bold">Operator Network</span></h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Real-time routes currently serviced by our premium partners.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size={32} />
            </div>
          ) : liveRoutes.length === 0 ? (
            <div className="text-center py-12 bg-secondary/30 rounded-2xl border border-dashed border-border">
              <Compass className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No live routes broadcasted at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveRoutes.map((route) => (
                <Card key={route.id} className="p-6 border-none shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2 text-primary">
                      <Compass className="h-5 w-5" />
                      <span className="font-semibold text-sm tracking-wider uppercase">Active Route</span>
                    </div>
                    <Link href={`/search?origin=${encodeURIComponent(route.origin)}&destination=${encodeURIComponent(route.destination)}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-2">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="flex items-center justify-between relative mb-6">
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Origin</div>
                      <div className="font-bold text-xl">{route.origin}</div>
                    </div>
                    
                    <div className="w-12 h-[2px] bg-border mx-4 relative">
                      <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full"></div>
                    </div>

                    <div className="flex-1 text-right">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Destination</div>
                      <div className="font-bold text-xl">{route.destination}</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex justify-between items-center text-sm text-muted-foreground">
                    <span>{route.boarding_points?.length || 0} Boarding Points</span>
                    <span>{route.dropoff_points?.length || 0} Dropoff Points</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* More Inspiration */}
      <section className="py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-sm font-bold tracking-[0.2em] text-primary uppercase mb-3">More Inspiration</h2>
            <h3 className="text-3xl font-light tracking-tight">Expand your <span className="font-bold">horizons.</span></h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {POPULAR_ROUTES.map((route, idx) => (
              <Link href={`/search?origin=${encodeURIComponent(route.origin)}&destination=${encodeURIComponent(route.destination)}`} key={`insp-${idx}`}>
                <div className="group overflow-hidden rounded-xl bg-white shadow-sm hover:shadow-lg transition-all border border-transparent hover:border-primary/20">
                  <div className="relative h-48">
                    <Image 
                      src={route.image} 
                      alt={route.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" /> {route.origin} to
                    </div>
                    <h4 className="font-bold text-lg mb-4">{route.destination}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-primary">From RM {route.price}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
