'use client';

import { LiveSeatLoad } from '@/components/realtime/LiveSeatLoad';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBookingStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { seedDatabase } from '@/lib/supabase/seed';
import { ArrowRight, Bus, CheckCircle, Clock, Database, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Schedule {
  id: string;
  bus_id: string;
  departure_time: string;
  arrival_time: string;
  base_price: number;
  status: string;
  buses: {
    plate_number: string;
    bus_type: string;
    amenities: string[];
    total_seats?: number;
    exterior_image_url?: string | null;
    interior_image_url?: string | null;
  };
  routes: {
    origin: string;
    destination: string;
  };
  schedule_metrics?: {
    total_seats: number;
    booked_seats: number;
    locked_seats: number;
    available_seats: number;
  } | null;
}

const formatTripTime = (isoString: string) => {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return isoString;
  }
};

const resolveSeatLayout = (busType?: string) => {
  const type = (busType ?? '').toLowerCase();
  if (type.includes('economy') || type.includes('standard')) return '2-2';
  if (type.includes('vip') || type.includes('executive')) return '2-1';
  return '2-1';
};

export default function SearchResultsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 bg-secondary/20 py-12 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <LoadingSpinner className="h-12 w-12 text-primary" />
        <p className="text-muted-foreground font-medium font-sans">Searching best schedules...</p>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const { searchQuery, setSelectedSchedule } = useBookingStore();
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const supabase = createClient();

  const origin = searchParams.get('origin') || searchQuery?.origin || 'Kuala Lumpur';
  const destination = searchParams.get('destination') || searchQuery?.destination || 'Penang';
  const date = searchParams.get('date') || (searchQuery?.date ? new Date(searchQuery.date).toISOString().split('T')[0] : 'Today');

  const fetchLiveSchedules = async () => {
    setLoading(true);
    try {
      // Fetch schedules matching routes from database
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          id,
          bus_id,
          departure_time,
          arrival_time,
          base_price,
          status,
          schedule_metrics (
            total_seats,
            booked_seats,
            locked_seats,
            available_seats
          ),
          buses (
            plate_number,
            bus_type,
            amenities,
            total_seats,
            exterior_image_url,
            interior_image_url
          ),
          routes (
            origin,
            destination
          )
        `);

      if (error) throw error;

      // Filter local matches for robust handling
      const formatted = (data || [])
        .map((s: any) => {
          const metrics = Array.isArray(s.schedule_metrics)
            ? s.schedule_metrics[0] ?? null
            : s.schedule_metrics ?? null;
          return {
          id: s.id,
          bus_id: s.bus_id,
          departure_time: s.departure_time,
          arrival_time: s.arrival_time,
          base_price: Number(s.base_price),
          status: s.status,
          buses: s.buses || { plate_number: 'Unknown', bus_type: 'Standard', amenities: [], total_seats: 0 },
          routes: s.routes || { origin: 'Kuala Lumpur', destination: 'Penang' },
          schedule_metrics: metrics,
          };
        })
        .filter((s: Schedule) => 
          s.routes.origin.toLowerCase().includes(origin.toLowerCase()) &&
          s.routes.destination.toLowerCase().includes(destination.toLowerCase())
        );

      setSchedules(formatted);
    } catch (err: any) {
      console.error("DB Fetch Error, falling back to mock UI:", err);
      toast.error("Database table missing or empty. Please run initial migration first!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveSchedules();
  }, [origin, destination]);

  useEffect(() => {
    if (schedules.length === 0) return;

    const ids = schedules.map((s) => s.id).join(',');
    const channel = supabase
      .channel('schedule_metrics_feed')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedule_metrics',
          filter: `schedule_id=in.(${ids})`,
        },
        (payload) => {
          const next = payload.new as any;
          if (!next?.schedule_id) return;
          setSchedules((current) =>
            current.map((s) =>
              s.id === next.schedule_id
                ? { ...s, schedule_metrics: next }
                : s
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [schedules, supabase]);

  const handleSeed = async () => {
    setSeeding(true);
    toast.loading("Generating real buses, routes, schedules and seat mappings in your Supabase DB...");
    const res = await seedDatabase();
    toast.dismiss();
    
    if (res.success) {
      toast.success(res.message);
      fetchLiveSchedules(); // Reload live data
    } else {
      toast.error(res.error || "Seeding failed. Make sure you are signed in first!");
    }
    setSeeding(false);
  };

  const handleSelectSchedule = (schedule: Schedule) => {
    const availableSeats = schedule.schedule_metrics?.available_seats
      ?? schedule.buses.total_seats
      ?? 0;
    const totalSeats = schedule.buses.total_seats
      ?? schedule.schedule_metrics?.total_seats
      ?? 0;
    const seatLayout = resolveSeatLayout(schedule.buses.bus_type);

    setSelectedSchedule({
      id: schedule.id,
      bus_id: schedule.bus_id,
      totalSeats,
      seatLayout,
      operator: schedule.buses.bus_type,
      type: schedule.buses.bus_type,
      departureTime: formatTripTime(schedule.departure_time),
      arrivalTime: formatTripTime(schedule.arrival_time),
      price: schedule.base_price,
      availableSeats,
      duration: '5h 0m'
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-24">
        <LoadingSpinner size={48} />
        <p className="mt-4 text-muted-foreground font-medium animate-pulse">Quering live Supabase schedules...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-secondary/20 min-h-screen">
      {/* Search Header Info */}
      <div className="bg-primary text-white py-8 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 text-xl font-medium">
            <span>{origin}</span>
            <ArrowRight className="h-5 w-5 text-accent" />
            <span>{destination}</span>
          </div>
          <div className="flex items-center gap-6 text-blue-100 text-sm">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {date}</span>
            <span className="flex items-center gap-1"><Bus className="h-4 w-4" /> {schedules.length} Live Buses</span>
          </div>
          <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20 transition-all rounded-full">
            Modify Search
          </Button>
        </div>
      </div>

      {/* Results Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Filters Sidebar */}
        <div className="w-full lg:w-64 shrink-0 space-y-6">
          <Card className="p-5 border-none shadow-sm rounded-2xl bg-white">
            <h3 className="font-semibold text-lg mb-4">Filters</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Departure Time</label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="rounded" /> Morning (00:00 - 11:59)</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="rounded" /> Afternoon (12:00 - 17:59)</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="rounded" /> Night (18:00 - 23:59)</label>
                </div>
              </div>
              <div className="pt-4 border-t">
                <label className="text-sm font-medium text-muted-foreground">Bus Type</label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="rounded" /> Executive VIP</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="rounded" /> Economy</label>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Bus List */}
        <div className="flex-1 space-y-6">
          {schedules.length === 0 ? (
            <Card className="border-2 border-dashed border-primary/20 bg-white/50 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
              <Database className="h-16 w-16 text-primary/30 mb-4 animate-bounce" />
              <h3 className="text-2xl font-bold text-foreground">No Live Buses Listed Yet</h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                Your database is connected but hasn't been populated with routes or buses matching this route yet.
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={handleSeed}
                  disabled={seeding}
                  className="bg-primary hover:bg-primary/95 text-white font-bold h-12 px-8 rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  <Sparkles className="mr-2 h-5 w-5 text-accent animate-pulse" />
                  {seeding ? 'Generating Live Data...' : 'Populate Live DB (Superb Seed)'}
                </Button>
              </div>
            </Card>
          ) : (
            schedules.map((schedule) => (
              <Card key={schedule.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl bg-white border-l-4 border-primary">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Timing & Operator Info */}
                    <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-border/50">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-4 items-center">
                          {schedule.buses.exterior_image_url ? (
                            <img src={schedule.buses.exterior_image_url} alt="Bus" className="w-16 h-16 rounded-xl object-cover shadow-sm border" />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
                              <Bus className="h-8 w-8" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-xl text-foreground">{schedule.buses.bus_type}</h4>
                            <span className="text-sm text-muted-foreground font-mono">{schedule.buses.plate_number}</span>
                          </div>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-none font-semibold px-3 py-1 rounded-full">
                          Live Verified
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between relative">
                        <div className="text-center relative z-10 bg-white pr-4">
                          <div className="font-bold text-2xl text-primary">{formatTripTime(schedule.departure_time)}</div>
                          <div className="text-sm text-muted-foreground">{origin}</div>
                        </div>
                        
                        <div className="flex-1 border-t-2 border-dashed border-gray-200 relative mx-4">
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2 text-xs text-muted-foreground flex flex-col items-center">
                            <span>Standard Duration</span>
                          </div>
                        </div>

                        <div className="text-center relative z-10 bg-white pl-4">
                          <div className="font-bold text-2xl text-primary">{formatTripTime(schedule.arrival_time)}</div>
                          <div className="text-sm text-muted-foreground">{destination}</div>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex flex-wrap gap-3">
                        {(schedule.buses.amenities || []).map((amenity: string) => (
                          <div key={amenity} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/70 px-3 py-1 rounded-full">
                            <CheckCircle className="h-3 w-3 text-primary" /> {amenity}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div className="p-6 md:w-56 bg-secondary/10 flex flex-col items-center justify-center gap-4">
                      <LiveSeatLoad
                        scheduleId={schedule.id}
                        compact
                        initialMetrics={schedule.schedule_metrics}
                        className="w-full"
                      />
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">Base Fare</div>
                        <div className="text-3xl font-extrabold text-primary">RM {schedule.base_price.toFixed(2)}</div>
                      </div>
                      <Button 
                        className="w-full rounded-full h-11 font-semibold"
                        onClick={() => handleSelectSchedule(schedule)}
                      >
                        <Link href={`/booking/seats?id=${schedule.id}`} className="w-full h-full flex items-center justify-center">
                          Select Seats
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
