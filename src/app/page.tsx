import { SearchForm } from '@/components/booking/SearchForm';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Star, Shield, Clock, ArrowRight, Compass, Award, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-background selection:bg-primary selection:text-white">
      
{/* 1. CINEMATIC HERO SECTION */}
      {/* REMOVE overflow-hidden from this section tag */}
      <section className="relative w-full h-[90vh] min-h-[700px] flex flex-col items-center justify-center">
        
        {/* ADD overflow-hidden to this background container instead! */}
        <div className="absolute inset-0 z-0 bg-black overflow-hidden">
          <Image 
            src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=3000&auto=format&fit=crop" 
            alt="Premium Travel" 
            fill 
            priority
            className="object-cover opacity-70 scale-105 hover:scale-100 transition-transform duration-[20s] ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-zinc-50 dark:to-background"></div>
        </div>
        
        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full pt-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="h-[1px] w-8 bg-amber-400"></div>
              <span className="text-xs font-bold tracking-[0.2em] text-amber-400 uppercase">
                Malaysia&apos;s Premier Network
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-light tracking-tighter text-white mb-6 leading-[1.1]">
              Elevate your <br />
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-rose-200">
                journey.
              </span>
            </h1>
            
            <p className="text-lg text-white/80 max-w-xl font-light leading-relaxed mb-12">
              Experience ground travel reimagined. Seamless booking, first-class comfort, and uncompromising safety across every mile.
            </p>
          </div>
        </div>
        
        {/* Floating Booking Console */}
        <div className="absolute bottom-0 left-0 right-0 z-20 px-4 translate-y-1/2 flex justify-center w-full">
          <div className="w-full max-w-6xl">
            {/* Console Header Tabs (Airline Style) */}
            <div className="flex gap-1 px-6">
              <div className="bg-background px-6 py-3 rounded-t-xl font-medium text-sm flex items-center gap-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] border-t border-x border-border/50 relative z-10">
                <Compass className="w-4 h-4 text-primary" /> Book Travel
              </div>
              <Link href="/login" className="bg-background/40 backdrop-blur-md px-6 py-3 rounded-t-xl font-medium text-sm text-muted-foreground flex items-center gap-2 hover:bg-background/60 transition-colors border-t border-x border-white/10">
                <Award className="w-4 h-4" /> Manage Booking
              </Link>
            </div>
            {/* Console Body */}
            <div className="p-4 md:p-6 rounded-b-2xl rounded-tr-2xl bg-background border border-border shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] relative z-20">
              <SearchForm />
            </div>
          </div>
        </div>
      </section>

      {/* Spacer for floating console */}
      <div className="h-40 md:h-32"></div>

      {/* 2. FEATURED DESTINATIONS (Editorial Style) */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16">
            <div className="max-w-2xl">
              <h2 className="text-sm font-bold tracking-[0.2em] text-primary uppercase mb-3">Curated Destinations</h2>
              <h3 className="text-3xl md:text-5xl font-light tracking-tight text-foreground">
                Where will your next <span className="font-bold">story begin?</span>
              </h3>
            </div>
            <Link href="/routes" className="group hidden md:inline-flex items-center text-sm font-semibold uppercase tracking-widest hover:text-primary transition-colors pb-2 border-b border-foreground/20 hover:border-primary">
              Explore All <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {POPULAR_ROUTES.map((route, idx) => (
              <div key={idx} className="group cursor-pointer relative rounded-2xl overflow-hidden h-[450px] shadow-lg hover:shadow-2xl transition-all duration-700">
                <Image 
                  src={route.image} 
                  alt={route.title}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                
                {/* Elegant gradient - darker at bottom for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100"></div>
                
                {/* Content */}
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
            ))}
          </div>
        </div>
      </section>

      {/* 3. THE EXPERIENCE (Split Layout) */}
      <section className="py-24 bg-[#1a0308] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left: Premium Image */}
            <div className="relative h-[600px] rounded-3xl overflow-hidden shadow-2xl">
              <Image 
                src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2000&auto=format&fit=crop" 
                alt="Premium Bus Interior" 
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 border border-white/10 rounded-3xl z-10"></div>
              {/* Glass card overlaid on image */}
              <div className="absolute bottom-8 left-8 right-8 bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl z-20">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-amber-400/20 flex items-center justify-center">
                    <Star className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-wider mb-1">5-Star Operators</p>
                    <p className="text-xs text-white/70 font-light">Excellence in every journey</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Copy & Features */}
            <div>
              <h2 className="text-xs font-bold tracking-[0.2em] text-amber-400 uppercase mb-4">The RedBus Experience</h2>
              <h3 className="text-4xl md:text-5xl font-light tracking-tight mb-8">
                Redefining <span className="font-bold">ground travel.</span>
              </h3>
              <p className="text-white/60 text-lg font-light leading-relaxed mb-12">
                We believe the journey should be as magnificent as the destination. Enjoy world-class amenities, punctual schedules, and unparalleled service from boarding to arrival.
              </p>

              <div className="space-y-8">
                <div className="flex gap-4">
                  <CheckCircle2 className="h-6 w-6 text-amber-400 shrink-0" />
                  <div>
                    <h4 className="text-xl font-medium mb-2">Live Seat Selection</h4>
                    <p className="text-white/60 font-light leading-relaxed">Choose your preferred seating in real-time. Whether you prefer the panoramic front view or the quiet rear, the choice is yours.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <CheckCircle2 className="h-6 w-6 text-amber-400 shrink-0" />
                  <div>
                    <h4 className="text-xl font-medium mb-2">Instant Confirmation</h4>
                    <p className="text-white/60 font-light leading-relaxed">No waiting. No uncertainty. Receive your digital boarding pass instantly upon secure checkout.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <CheckCircle2 className="h-6 w-6 text-amber-400 shrink-0" />
                  <div>
                    <h4 className="text-xl font-medium mb-2">Secure & Seamless</h4>
                    <p className="text-white/60 font-light leading-relaxed">Bank-grade encryption protects your transactions, offering you complete peace of mind while booking.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}

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
];