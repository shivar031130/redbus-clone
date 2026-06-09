'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import {
  MapPin,
  RefreshCw,
  Bus,
  Search,
  Gauge,
  Clock,
  ShieldAlert,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BusLocation {
  id: string;
  schedule_id: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  speed_kmh: number | null;
  recorded_at: string;
}

interface ActiveSchedule {
  id: string;
  departure_time: string;
  status: string;
  live_status?: string | null;
  delay_minutes: number;
  routes: {
    origin: string;
    destination: string;
    operator_id: string;
    operators?: {
      company_name: string;
    } | null;
  } | null;
  buses: {
    plate_number: string;
    bus_type: string;
  } | null;
}

export default function AdminTrackingPage() {
  const supabase = useMemo(() => createClient(), []);

  const [schedules, setSchedules] = useState<ActiveSchedule[]>([]);
  const [locations, setLocations] = useState<Record<string, BusLocation>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Map state
  const [mapReady, setMapReady] = useState(false);
  const mapContainerId = 'admin-global-map';
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});

  // Dynamic script loader for Leaflet
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setMapReady(true);
      document.head.appendChild(script);
    } else {
      setMapReady(true);
    }
  }, []);

  // Fetch all active schedules & GPS locations
  const loadFleetData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch today's schedules with routes, buses & operators details
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedules')
        .select(`
          id,
          departure_time,
          status,
          live_status,
          delay_minutes,
          routes (
            origin,
            destination,
            operator_id,
            operators (
              company_name
            )
          ),
          buses (
            plate_number,
            bus_type
          )
        `)
        .gte('departure_time', today.toISOString());

      if (scheduleError) throw scheduleError;
      setSchedules((scheduleData as unknown as ActiveSchedule[]) ?? []);

      // Fetch recent location updates
      const { data: locationData, error: locationError } = await supabase
        .from('bus_locations')
        .select('id, schedule_id, latitude, longitude, heading, speed_kmh, recorded_at')
        .order('recorded_at', { ascending: false });

      if (locationError) throw locationError;

      // Group location by schedule_id client-side to keep only the latest update per bus
      const latestLocations: Record<string, BusLocation> = {};
      (locationData ?? []).forEach((loc) => {
        if (!latestLocations[loc.schedule_id]) {
          latestLocations[loc.schedule_id] = loc as BusLocation;
        }
      });
      setLocations(latestLocations);
    } catch (err: any) {
      toast.error('Failed to connect to transit operations network.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFleetData();

    // Subscribe to all dynamic bus location updates globally
    const channel = supabase
      .channel('bus_locations_admin_global')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bus_locations',
        },
        (payload) => {
          const newLoc = payload.new as BusLocation;
          setLocations((prev) => ({
            ...prev,
            [newLoc.schedule_id]: newLoc,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Clean map markers on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Filter schedules based on plate or company search term
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const matchSearch =
        searchTerm === '' ||
        s.buses?.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.routes?.operators?.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.routes?.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.routes?.destination.toLowerCase().includes(searchTerm.toLowerCase());

      const status = s.live_status ?? s.status ?? 'scheduled';
      // Only show schedules that are active (scheduled, departed, en_route)
      const isActive = status !== 'cancelled' && status !== 'completed';

      return matchSearch && isActive;
    });
  }, [schedules, searchTerm]);

  // Network metrics aggregates
  const metrics = useMemo(() => {
    const activeBuses = Object.values(locations).filter((loc) => {
      const parentSchedule = schedules.find((s) => s.id === loc.schedule_id);
      if (!parentSchedule) return false;
      const status = parentSchedule.live_status ?? parentSchedule.status;
      return status === 'departed' || status === 'en_route';
    });

    const averageSpeed = activeBuses.length > 0
      ? Math.round(activeBuses.reduce((sum, loc) => sum + (loc.speed_kmh ?? 0), 0) / activeBuses.length)
      : 0;

    const delayAlerts = schedules.filter((s) => s.delay_minutes > 15).length;
    const speedingBuses = activeBuses.filter((loc) => (loc.speed_kmh ?? 0) > 110).length;

    return {
      activeFleetCount: activeBuses.length,
      averageSpeed,
      delayAlerts,
      speedingBuses,
    };
  }, [schedules, locations]);

  // Render Markers on Map Canvas
  useEffect(() => {
    if (!mapReady || loading) return;

    const L = (window as any).L;
    if (!L) return;

    // Initialize Map centered in Malaysia
    if (!mapRef.current) {
      const map = L.map(mapContainerId, {
        zoomControl: false,
        attributionControl: false,
      }).setView([4.2105, 101.9758], 7);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapRef.current = map;
    }

    const currentMarkers = markersRef.current;

    // Clear removed markers
    Object.keys(currentMarkers).forEach((schedId) => {
      const stillActive = filteredSchedules.some((s) => s.id === schedId);
      if (!stillActive || !locations[schedId]) {
        currentMarkers[schedId].remove();
        delete currentMarkers[schedId];
      }
    });

    // Plot markers for active tracked buses
    filteredSchedules.forEach((s) => {
      const loc = locations[s.id];
      if (!loc) return;

      const position: [number, number] = [loc.latitude, loc.longitude];
      const heading = loc.heading ?? 0;
      const speed = loc.speed_kmh ?? 0;
      const isSpeeding = speed > 110;

      const markerHtml = `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full ${isSpeeding ? 'bg-red-500/30' : 'bg-emerald-500/30'} animate-ping"></div>
          <div class="relative w-8 h-8 rounded-full ${isSpeeding ? 'bg-red-600' : 'bg-emerald-600'} border-2 border-white flex items-center justify-center text-white shadow-lg transition-transform duration-500" style="transform: rotate(${heading}deg)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-navigation"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: 'custom-fleet-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const popupHtml = `
        <div class="p-2 space-y-1.5 font-sans min-w-[200px]">
          <div class="flex justify-between items-center border-b pb-1.5 mb-1.5">
            <span class="font-bold text-xs uppercase tracking-wider text-slate-800">${s.buses?.plate_number}</span>
            <span class="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">${s.buses?.bus_type}</span>
          </div>
          <div class="text-[10px] text-muted-foreground uppercase font-mono">Operator</div>
          <div class="text-xs font-bold text-slate-800">${s.routes?.operators?.company_name}</div>
          <div class="text-[10px] text-muted-foreground uppercase font-mono mt-1">Route</div>
          <div class="text-xs font-semibold text-slate-800 flex items-center gap-1">
            ${s.routes?.origin} <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg> ${s.routes?.destination}
          </div>
          <div class="grid grid-cols-2 gap-2 border-t pt-2 mt-2">
            <div>
              <div class="text-[9px] text-muted-foreground uppercase font-mono">Speed</div>
              <div class="text-xs font-extrabold ${isSpeeding ? 'text-red-600' : 'text-slate-800'}">${speed} km/h</div>
            </div>
            <div>
              <div class="text-[9px] text-muted-foreground uppercase font-mono">Last Ping</div>
              <div class="text-xs font-bold text-slate-800">${new Date(loc.recorded_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        </div>
      `;

      if (!currentMarkers[s.id]) {
        const marker = L.marker(position, { icon }).addTo(mapRef.current);
        marker.bindPopup(popupHtml);
        currentMarkers[s.id] = marker;
      } else {
        currentMarkers[s.id].setLatLng(position);
        currentMarkers[s.id].setIcon(icon);
        currentMarkers[s.id].setPopupContent(popupHtml);
      }
    });

  }, [mapReady, loading, filteredSchedules, locations]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-sans">Operations Command Center</h1>
          <p className="text-muted-foreground mt-1">
            Global real-time tracking network and fleet analytics dashboard.
          </p>
        </div>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 self-start sm:self-auto gap-1.5 py-1 px-3 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          Network Operations Online
        </Badge>
      </div>

      {/* Network Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600 shrink-0">
              <Bus className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium block">Active Fleet</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-0.5 block leading-none">
                {metrics.activeFleetCount} <span className="text-xs text-muted-foreground font-normal">vehicles</span>
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-rose-50 rounded-xl text-rose-600 shrink-0">
              <Gauge className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium block">Average Transit Speed</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-0.5 block leading-none">
                {metrics.averageSpeed} <span className="text-xs text-muted-foreground font-normal">km/h</span>
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600 shrink-0">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium block">Active Route Delays</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-0.5 block leading-none">
                {metrics.delayAlerts} <span className="text-xs text-muted-foreground font-normal">delays</span>
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-xl text-red-600 shrink-0 animate-pulse">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium block">Safety Warnings</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-0.5 block leading-none">
                {metrics.speedingBuses} <span className="text-xs text-muted-foreground font-normal">speed warnings</span>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Map Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden flex flex-col bg-white">
            <div className="h-[550px] w-full relative">
              <div id={mapContainerId} className="w-full h-full relative z-0" />
            </div>
          </Card>
        </div>

        {/* Fleet Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-none shadow-sm h-[550px] flex flex-col bg-white">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-blue-600" /> Active Fleet Registry
              </CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vehicle or operator..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {loading ? (
                <div className="flex justify-center items-center h-48 text-muted-foreground text-xs gap-2">
                  <RefreshCw className="animate-spin h-4 w-4" /> Fetching grid...
                </div>
              ) : filteredSchedules.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-xs">
                  No active tracked vehicles matching criteria.
                </div>
              ) : (
                <div className="divide-y text-xs">
                  {filteredSchedules.map((s) => {
                    const loc = locations[s.id];
                    const speed = loc?.speed_kmh ?? 0;
                    const isMoving = speed > 5;
                    const status = s.live_status ?? s.status ?? 'scheduled';
                    return (
                      <div key={s.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 uppercase">{s.buses?.plate_number}</span>
                            <Badge variant="outline" className="text-[9px] scale-95 origin-left">
                              {s.buses?.bus_type}
                            </Badge>
                          </div>
                          <Badge variant="secondary" className="capitalize text-[9px] tracking-wider py-0.5">
                            {status}
                          </Badge>
                        </div>
                        <div className="font-semibold text-slate-700 truncate">
                          {s.routes?.operators?.company_name}
                        </div>
                        <div className="text-[11px] text-slate-600 flex items-center gap-1 font-medium truncate">
                          {s.routes?.origin}
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          {s.routes?.destination}
                        </div>
                        <div className="flex justify-between items-center border-t border-dashed pt-2 mt-1 text-[11px]">
                          <span className="flex items-center gap-1 text-slate-500 font-medium">
                            <Gauge className="h-3.5 w-3.5" />
                            {loc ? `${speed} km/h` : 'Offline'}
                          </span>
                          <span className={cn(
                            'font-bold',
                            s.delay_minutes > 15 ? 'text-amber-600' : 'text-slate-500'
                          )}>
                            {s.delay_minutes > 0 ? `+${s.delay_minutes}m delay` : 'On time'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
