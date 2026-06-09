'use client';

import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useState, useRef } from 'react';
import { Compass, Gauge, MapPin, Navigation, Navigation2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface BusLocation {
  id: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  speed_kmh: number | null;
  recorded_at: string;
}

interface ScheduleDetails {
  id: string;
  departure_time: string;
  arrival_time: string;
  live_status?: string | null;
  routes?: {
    origin: string;
    destination: string;
  } | null;
  buses?: {
    plate_number: string;
    bus_type: string;
  } | null;
}

interface LiveBusTrackingProps {
  scheduleId: string;
  className?: string;
}

// ─── Malaysian City Coordinates database ───
export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Kuala Lumpur': { lat: 3.1390, lng: 101.6869 },
  'KL': { lat: 3.1390, lng: 101.6869 },
  'Penang': { lat: 5.4141, lng: 100.3288 },
  'George Town': { lat: 5.4141, lng: 100.3288 },
  'Johor Bahru': { lat: 1.4927, lng: 103.7414 },
  'JB': { lat: 1.4927, lng: 103.7414 },
  'Melaka': { lat: 2.1896, lng: 102.2501 },
  'Malacca': { lat: 2.1896, lng: 102.2501 },
  'Ipoh': { lat: 4.5921, lng: 101.0901 },
  'Genting Highlands': { lat: 3.4241, lng: 101.7928 },
  'Cameron Highlands': { lat: 4.4721, lng: 101.3801 },
  'Kuantan': { lat: 3.8077, lng: 103.3260 },
  'Singapore': { lat: 1.3521, lng: 103.8198 },
  'Alor Setar': { lat: 6.1210, lng: 100.3601 },
  'Kuala Terengganu': { lat: 5.3302, lng: 103.1408 },
  'Kota Bharu': { lat: 6.1254, lng: 102.2381 },
};

// ─── Haversine Formula for Distance Calculation ───
export function getDistance(c1: { lat: number; lng: number }, c2: { lat: number; lng: number }) {
  const R = 6371; // Earth's radius in km
  const dLat = (c2.lat - c1.lat) * Math.PI / 180;
  const dLng = (c2.lng - c1.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(c1.lat * Math.PI / 180) * Math.cos(c2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const formatTime = (iso?: string | null) => {
  if (!iso) return 'TBA';
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso ?? 'TBA';
  }
};

export function LiveBusTracking({ scheduleId, className }: LiveBusTrackingProps) {
  const supabase = useMemo(() => createClient(), []);
  
  const [location, setLocation] = useState<BusLocation | null>(null);
  const [schedule, setSchedule] = useState<ScheduleDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'telemetry'>('map');

  const mapContainerId = useMemo(() => `map-${scheduleId}`, [scheduleId]);
  const mapRef = useRef<any>(null);
  const busMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);

  // Load Leaflet CDN script & stylesheet client-side
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

  // Fetch initial schedule details & location
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        // Fetch schedule & route details
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('schedules')
          .select('id, departure_time, arrival_time, live_status, routes(origin, destination), buses(plate_number, bus_type)')
          .eq('id', scheduleId)
          .maybeSingle();

        if (scheduleError) throw scheduleError;
        if (scheduleData && isMounted) {
          setSchedule(scheduleData as unknown as ScheduleDetails);
        }

        // Fetch latest location
        const { data: locationData, error: locationError } = await supabase
          .from('bus_locations')
          .select('id, latitude, longitude, heading, speed_kmh, recorded_at')
          .eq('schedule_id', scheduleId)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (locationError) throw locationError;
        if (locationData && isMounted) {
          setLocation(locationData as BusLocation);
        }
      } catch (err: any) {
        console.error('Failed to load tracking data:', err);
        toast.error('Could not initialize Live tracking data.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    // Subscribe to real-time location inserts
    const channel = supabase
      .channel(`bus_locations_passenger_${scheduleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bus_locations',
          filter: `schedule_id=eq.${scheduleId}`,
        },
        (payload) => {
          if (isMounted) {
            const newLoc = payload.new as BusLocation;
            setLocation(newLoc);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [scheduleId, supabase]);

  // Resolve Route Coordinates
  const routeCoords = useMemo(() => {
    if (!schedule?.routes) return null;
    const origin = schedule.routes.origin;
    const destination = schedule.routes.destination;
    
    // Attempt match origin/destination
    const originKey = Object.keys(CITY_COORDINATES).find(key => 
      origin.toLowerCase().includes(key.toLowerCase())
    );
    const destKey = Object.keys(CITY_COORDINATES).find(key => 
      destination.toLowerCase().includes(key.toLowerCase())
    );

    const start = originKey ? CITY_COORDINATES[originKey] : CITY_COORDINATES['Kuala Lumpur'];
    const end = destKey ? CITY_COORDINATES[destKey] : CITY_COORDINATES['Penang'];

    return { start, end };
  }, [schedule]);

  // Calculate distances & ETA
  const telemetry = useMemo(() => {
    if (!routeCoords) return null;
    const { start, end } = routeCoords;
    const current = location ? { lat: location.latitude, lng: location.longitude } : start;

    const totalDistance = getDistance(start, end);
    const remainingDistance = getDistance(current, end);
    const progress = Math.min(Math.max(100 - (remainingDistance / totalDistance) * 100, 0), 100);

    const speed = location?.speed_kmh ?? 0;
    // Calculate dynamic ETA. If stationary, assume 70 km/h average transit speed for calculation
    const speedForETA = speed > 5 ? speed : 70;
    const etaHours = remainingDistance / speedForETA;
    const etaMinutes = Math.round(etaHours * 60);

    return {
      totalDistance: totalDistance.toFixed(1),
      remainingDistance: remainingDistance.toFixed(1),
      progress: Math.round(progress),
      etaMinutes,
    };
  }, [routeCoords, location]);

  // Initialize and Update Leaflet Map
  useEffect(() => {
    if (!mapReady || loading || !routeCoords) return;

    const L = (window as any).L;
    if (!L) return;

    const { start, end } = routeCoords;
    const currentPos = location ? [location.latitude, location.longitude] : [start.lat, start.lng];

    // Initialize Map if not already created
    if (!mapRef.current) {
      const map = L.map(mapContainerId, {
        zoomControl: false,
        attributionControl: false,
      }).setView(currentPos, 9);

      // CartoDB Positron - High Quality Sleek Tile Style
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Add Zoom Controls to bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapRef.current = map;

      // Draw start marker (boarding)
      const startIcon = L.divIcon({
        html: `<div class="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white shadow-md flex items-center justify-center text-[10px] font-bold text-white">A</div>`,
        className: 'custom-pin-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      L.marker([start.lat, start.lng], { icon: startIcon }).addTo(map)
        .bindPopup(`<b>Boarding Point:</b> ${schedule?.routes?.origin}`);

      // Draw destination marker
      const endIcon = L.divIcon({
        html: `<div class="w-6 h-6 rounded-full bg-primary border-2 border-white shadow-md flex items-center justify-center text-[10px] font-bold text-white">B</div>`,
        className: 'custom-pin-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      L.marker([end.lat, end.lng], { icon: endIcon }).addTo(map)
        .bindPopup(`<b>Dropoff Point:</b> ${schedule?.routes?.destination}`);

      // Plot route polyline
      const line = L.polyline([[start.lat, start.lng], [end.lat, end.lng]], {
        color: '#E11D48',
        weight: 3,
        dashArray: '8, 8',
        opacity: 0.7,
      }).addTo(map);
      routePolylineRef.current = line;
    }

    // Dynamic Bus Icon html
    const heading = location?.heading ?? 0;
    const busHtml = `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 rounded-full bg-rose-500/30 animate-ping"></div>
        <div class="absolute w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20"></div>
        <div class="relative w-8 h-8 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center text-white shadow-lg transition-transform duration-500" style="transform: rotate(${heading}deg)">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-navigation"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
        </div>
      </div>
    `;

    const busIcon = L.divIcon({
      html: busHtml,
      className: 'custom-bus-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    if (!busMarkerRef.current) {
      // Create new bus marker
      const marker = L.marker(currentPos, { icon: busIcon }).addTo(mapRef.current);
      marker.bindPopup(`<b>Live Bus</b><br>Plate: ${schedule?.buses?.plate_number ?? 'N/A'}`);
      busMarkerRef.current = marker;
    } else {
      // Smoothly update marker coordinates
      busMarkerRef.current.setLatLng(currentPos);
      busMarkerRef.current.setIcon(busIcon);
      
      // Pan map smoothly to follow bus
      mapRef.current.panTo(currentPos);
    }
  }, [mapReady, loading, routeCoords, location, schedule, mapContainerId]);

  return (
    <Card className={cn('overflow-hidden border-none shadow-xl bg-white rounded-2xl flex flex-col', className)}>
      {/* Header */}
      <div className="bg-[#0A2540] text-white p-5 flex items-center justify-between">
        <div>
          <span className="text-rose-400 text-xs font-bold uppercase tracking-widest font-mono">Live Tracking</span>
          <h3 className="text-xl font-bold font-sans mt-0.5">Where is my Bus?</h3>
        </div>
        <div className="flex bg-white/10 rounded-xl p-1 shrink-0">
          <button
            onClick={() => setActiveTab('map')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              activeTab === 'map' ? 'bg-white text-[#0A2540] shadow-sm' : 'text-slate-300 hover:text-white'
            )}
          >
            Live Map
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              activeTab === 'telemetry' ? 'bg-white text-[#0A2540] shadow-sm' : 'text-slate-300 hover:text-white'
            )}
          >
            Telemetry
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-72 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-rose-500" />
          <span className="text-sm font-medium">Connecting to bus GPS...</span>
        </div>
      ) : !location ? (
        <div className="h-72 flex flex-col items-center justify-center text-muted-foreground text-center p-6 gap-3">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center shadow-inner">
            <Navigation className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800">Live GPS Pending</h4>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              The operator has not departed yet or GPS signal is offline. Live coordinates will appear here once the trip begins.
            </p>
          </div>
        </div>
      ) : (
        <div className="relative flex-1 flex flex-col">
          {/* Map view */}
          <div className={cn('h-72 w-full', activeTab !== 'map' && 'hidden')}>
            <div id={mapContainerId} className="w-full h-full relative z-0" />
          </div>

          {/* Telemetry view */}
          <div className={cn('p-5 space-y-4 bg-slate-50', activeTab !== 'telemetry' && 'hidden')}>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 rounded-lg text-rose-600">
                  <Gauge className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-mono block">Current Speed</span>
                  <span className="text-lg font-extrabold text-slate-900">{location.speed_kmh ?? 0} km/h</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-mono block">Heading</span>
                  <span className="text-lg font-extrabold text-slate-900">
                    {location.heading ? `${location.heading}°` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Trip Completion</span>
                <span className="font-mono font-bold text-rose-600">{telemetry?.progress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-rose-600 rounded-full transition-all duration-1000 shadow-sm"
                  style={{ width: `${telemetry?.progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground pt-1">
                <span>{schedule?.routes?.origin}</span>
                <span>{schedule?.routes?.destination}</span>
              </div>
            </div>
          </div>

          {/* Live Progress Bar Card (always visible on bottom) */}
          <div className="bg-slate-50 border-t p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                  {schedule?.buses?.plate_number?.slice(0, 3)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 leading-tight">
                    {schedule?.buses?.plate_number}
                  </h4>
                  <span className="text-[10px] text-muted-foreground block uppercase font-mono mt-0.5">
                    {schedule?.buses?.bus_type}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-muted-foreground block font-sans">ETA Remaining</span>
                <span className="text-sm font-extrabold text-rose-600">
                  ~ {telemetry?.etaMinutes} mins
                </span>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-700">
              <div className="bg-white px-3 py-2.5 rounded-xl border flex items-center gap-2 shadow-sm">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[9px] text-muted-foreground block leading-tight font-mono">DIST REMAINING</span>
                  <span className="font-bold truncate block">{telemetry?.remainingDistance} km</span>
                </div>
              </div>
              <div className="bg-white px-3 py-2.5 rounded-xl border flex items-center gap-2 shadow-sm">
                <Navigation2 className="w-4 h-4 text-indigo-500 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[9px] text-muted-foreground block leading-tight font-mono">LAST PING</span>
                  <span className="font-bold truncate block">{formatTime(location.recorded_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
