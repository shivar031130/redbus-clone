'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import {
  fetchSchedules,
  getMyOperatorId,
  publishBusLocation,
  publishScheduleUpdate,
  type ScheduleRecord,
} from '@/lib/supabase/operator-queries';
import { createClient } from '@/lib/supabase/client';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  ArrowRight, 
  Bus, 
  MapPin, 
  Navigation, 
  CheckCircle,
  AlertCircle,
  FastForward,
  Gauge
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CITY_COORDINATES, getDistance } from '@/components/realtime/LiveBusTracking';

const statusColors: Record<string, string> = {
  scheduled: 'bg-gray-100 text-gray-700 border-gray-200',
  departed: 'bg-blue-100 text-blue-700 border-blue-200',
  arrived: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

// Math helper for bearing (direction)
function getBearing(startLat: number, startLng: number, destLat: number, destLng: number) {
  const dLng = (destLng - startLng) * Math.PI / 180;
  const sLat = startLat * Math.PI / 180;
  const dLat = destLat * Math.PI / 180;

  const y = Math.sin(dLng) * Math.cos(dLat);
  const x = Math.cos(sLat) * Math.sin(dLat) - Math.sin(sLat) * Math.cos(dLat) * Math.cos(dLng);
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return Math.round((bearing + 360) % 360);
}

export default function OperatorTrackingPage() {
  const { user } = useAuthStore();
  const supabase = useMemo(() => createClient(), []);

  const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleRecord | null>(null);
  const [operatorId, setOperatorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Map state
  const [mapReady, setMapReady] = useState(false);
  const mapContainerId = 'operator-tracking-map';
  const mapRef = useRef<any>(null);
  const busMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);

  // Simulation State
  const [isPlaying, setIsPlaying] = useState(false);
  const [simSpeed, setSimSpeed] = useState<number>(1); // 1x, 2x, 5x, 10x speed multiplier
  const [simPercent, setSimPercent] = useState<number>(0);
  const [simLocation, setSimLocation] = useState<[number, number] | null>(null);
  const [simSpeedKmh, setSimSpeedKmh] = useState<number>(0);
  const [simHeading, setSimHeading] = useState<number>(0);

  // Load Leaflet CDN Scripts
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

  // Fetch operator schedules
  const loadSchedules = async () => {
    setLoading(true);
    try {
      const opId = operatorId ?? await getMyOperatorId();
      if (!opId) {
        toast.error('Operator profile not found.');
        setLoading(false);
        return;
      }
      setOperatorId(opId);
      const data = await fetchSchedules(opId);
      
      // Filter schedules: only active/scheduled departures from today onwards
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const filtered = data.filter(s => new Date(s.departure_time) >= today);
      setSchedules(filtered);
    } catch (err: any) {
      toast.error('Failed to load active schedules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  // Resolve active schedule route coordinates
  const activeRoute = useMemo(() => {
    if (!selectedSchedule?.routes) return null;
    const origin = selectedSchedule.routes.origin;
    const destination = selectedSchedule.routes.destination;

    const originKey = Object.keys(CITY_COORDINATES).find(key => 
      origin.toLowerCase().includes(key.toLowerCase())
    );
    const destKey = Object.keys(CITY_COORDINATES).find(key => 
      destination.toLowerCase().includes(key.toLowerCase())
    );

    const start = originKey ? CITY_COORDINATES[originKey] : CITY_COORDINATES['Kuala Lumpur'];
    const end = destKey ? CITY_COORDINATES[destKey] : CITY_COORDINATES['Penang'];

    return { start, end };
  }, [selectedSchedule]);

  // Set initial simulation percent when schedule selection changes
  useEffect(() => {
    if (!selectedSchedule) {
      setIsPlaying(false);
      setSimPercent(0);
      setSimLocation(null);
      return;
    }

    const loadLatestCoordinates = async () => {
      // Query the database for the latest recorded coordinates
      const { data, error } = await supabase
        .from('bus_locations')
        .select('latitude, longitude, heading, speed_kmh')
        .eq('schedule_id', selectedSchedule.id)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data && activeRoute) {
        // Calculate progress percentage based on latest coordinates
        const remaining = getDistance({ lat: data.latitude, lng: data.longitude }, activeRoute.end);
        const total = getDistance(activeRoute.start, activeRoute.end);
        const calculatedPercent = Math.min(Math.max(100 - (remaining / total) * 100, 0), 100);

        setSimPercent(Math.round(calculatedPercent));
        setSimLocation([data.latitude, data.longitude]);
        setSimSpeedKmh(data.speed_kmh ?? 0);
        setSimHeading(data.heading ?? 0);
      } else if (activeRoute) {
        // Start from origin
        setSimPercent(0);
        setSimLocation([activeRoute.start.lat, activeRoute.start.lng]);
        setSimSpeedKmh(0);
        setSimHeading(getBearing(activeRoute.start.lat, activeRoute.start.lng, activeRoute.end.lat, activeRoute.end.lng));
      }
    };

    loadLatestCoordinates();
  }, [selectedSchedule, activeRoute, supabase]);

  // Map Initialization & Updates
  useEffect(() => {
    if (!mapReady || !selectedSchedule || !activeRoute) return;

    const L = (window as any).L;
    if (!L) return;

    const { start, end } = activeRoute;
    const currentPos = simLocation ?? [start.lat, start.lng];

    if (!mapRef.current) {
      const map = L.map(mapContainerId, {
        zoomControl: false,
        attributionControl: false,
      }).setView(currentPos, 8);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Manual coordinate override on map click
      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;
        // Pause simulation
        setIsPlaying(false);
        setSimLocation([lat, lng]);

        // Calculate new heading
        const heading = getBearing(lat, lng, end.lat, end.lng);
        setSimHeading(heading);
        setSimSpeedKmh(85);

        // Update percent
        const remaining = getDistance({ lat, lng }, end);
        const total = getDistance(start, end);
        const percent = Math.min(Math.max(100 - (remaining / total) * 100, 0), 100);
        setSimPercent(Math.round(percent));

        // Publish to Supabase immediately
        try {
          await publishBusLocation({
            schedule_id: selectedSchedule.id,
            bus_id: selectedSchedule.bus_id,
            latitude: lat,
            longitude: lng,
            heading,
            speed_kmh: 85,
          });

          await publishScheduleUpdate({
            schedule_id: selectedSchedule.id,
            status: 'en_route',
            message: `Operator manual coordinate shift to [${lat.toFixed(4)}, ${lng.toFixed(4)}]`,
            delay_minutes: selectedSchedule.delay_minutes ?? 0,
            created_by: user?.id ?? null,
          });
          toast.info(`Manual coordinate override published: [${lat.toFixed(4)}, ${lng.toFixed(4)}]`);
        } catch (err) {
          toast.error('Manual location update failed.');
        }
      });

      mapRef.current = map;

      // Draw start marker
      const startIcon = L.divIcon({
        html: `<div class="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white shadow flex items-center justify-center text-[10px] font-bold text-white">A</div>`,
        className: 'custom-pin-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      L.marker([start.lat, start.lng], { icon: startIcon }).addTo(map)
        .bindPopup(`<b>Boarding Point:</b> ${selectedSchedule.routes?.origin}`);

      // Draw end marker
      const endIcon = L.divIcon({
        html: `<div class="w-6 h-6 rounded-full bg-primary border-2 border-white shadow flex items-center justify-center text-[10px] font-bold text-white">B</div>`,
        className: 'custom-pin-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      L.marker([end.lat, end.lng], { icon: endIcon }).addTo(map)
        .bindPopup(`<b>Dropoff Point:</b> ${selectedSchedule.routes?.destination}`);

      // Draw dashed path
      const line = L.polyline([[start.lat, start.lng], [end.lat, end.lng]], {
        color: '#2563EB',
        weight: 3,
        dashArray: '8, 8',
        opacity: 0.6,
      }).addTo(map);
      routePolylineRef.current = line;
    }

    // Bus rendering
    const busHtml = `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping"></div>
        <div class="relative w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white shadow-lg transition-transform duration-500" style="transform: rotate(${simHeading}deg)">
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
      busMarkerRef.current = L.marker(currentPos, { icon: busIcon }).addTo(mapRef.current);
    } else {
      busMarkerRef.current.setLatLng(currentPos);
      busMarkerRef.current.setIcon(busIcon);
    }
  }, [mapReady, selectedSchedule, activeRoute, simLocation, simHeading]);

  // Clean map container when selected schedule changes
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        busMarkerRef.current = null;
        routePolylineRef.current = null;
      }
    };
  }, [selectedSchedule]);

  // Simulator core Loop
  useEffect(() => {
    if (!isPlaying || !selectedSchedule || !activeRoute) return;

    const interval = setInterval(async () => {
      const { start, end } = activeRoute;
      const nextPercent = Math.min(simPercent + (0.5 * simSpeed), 100);

      // Interpolate next position
      const nextLat = start.lat + (end.lat - start.lat) * (nextPercent / 100);
      const nextLng = start.lng + (end.lng - start.lng) * (nextPercent / 100);
      const heading = getBearing(nextLat, nextLng, end.lat, end.lng);
      
      // Speed fluctuations
      const speed = nextPercent >= 100 ? 0 : Math.round(85 + (Math.random() * 15));

      setSimPercent(nextPercent);
      setSimLocation([nextLat, nextLng]);
      setSimHeading(heading);
      setSimSpeedKmh(speed);

      // Publish to Supabase
      try {
        await publishBusLocation({
          schedule_id: selectedSchedule.id,
          bus_id: selectedSchedule.bus_id,
          latitude: nextLat,
          longitude: nextLng,
          heading,
          speed_kmh: speed,
        });

        if (nextPercent >= 100) {
          setIsPlaying(false);
          await publishScheduleUpdate({
            schedule_id: selectedSchedule.id,
            status: 'arrived',
            message: 'Trip completed safely at destination.',
            delay_minutes: selectedSchedule.delay_minutes ?? 0,
            created_by: user?.id ?? null,
          });
          toast.success('Simulation Completed! Trip set to arrived.');
          await loadSchedules();
        } else {
          // Keep schedule en_route
          await publishScheduleUpdate({
            schedule_id: selectedSchedule.id,
            status: 'en_route',
            message: `Bus simulator running. Coordinates [${nextLat.toFixed(5)}, ${nextLng.toFixed(5)}]`,
            delay_minutes: selectedSchedule.delay_minutes ?? 0,
            created_by: user?.id ?? null,
          });
        }
      } catch (err) {
        console.error('Simulator publish failure:', err);
      }
    }, 5000); // 5 seconds interval for natural telemetry streams

    return () => clearInterval(interval);
  }, [isPlaying, simPercent, simSpeed, selectedSchedule, activeRoute, user]);

  const handleStartTrip = async () => {
    if (!selectedSchedule) return;
    try {
      setIsPlaying(true);
      await publishScheduleUpdate({
        schedule_id: selectedSchedule.id,
        status: 'departed',
        message: 'The bus has departed the origin terminal and is en route.',
        delay_minutes: selectedSchedule.delay_minutes ?? 0,
        created_by: user?.id ?? null,
      });
      toast.success('Trip started! GPS coordinates are streaming.');
      await loadSchedules();
    } catch (err) {
      toast.error('Failed to initiate trip departure.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-sans">Live Bus Tracking &amp; Simulator</h1>
        <p className="text-muted-foreground mt-1">
          Monitor your active fleet and simulate real-time GPS telemetry paths.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Schedules Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-none shadow-sm h-[600px] flex flex-col">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Active Schedules</CardTitle>
                <Button variant="ghost" size="sm" onClick={loadSchedules} disabled={loading}>
                  <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                </Button>
              </div>
              <CardDescription>Select a today's trip to view tracking or simulator.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {loading ? (
                <div className="flex justify-center items-center h-48 text-muted-foreground text-sm gap-2">
                  <RefreshCw className="animate-spin h-4 w-4" /> Loading fleet...
                </div>
              ) : schedules.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  No active schedules found for today.
                </div>
              ) : (
                <div className="divide-y">
                  {schedules.map((s) => {
                    const isSelected = selectedSchedule?.id === s.id;
                    const status = s.live_status ?? s.status ?? 'scheduled';
                    return (
                      <div
                        key={s.id}
                        onClick={() => setSelectedSchedule(s)}
                        className={cn(
                          'p-4 cursor-pointer hover:bg-slate-50 transition-colors border-l-4',
                          isSelected ? 'bg-blue-50/50 border-l-blue-600' : 'border-l-transparent'
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-sm">
                            {format(new Date(s.departure_time), 'HH:mm')}
                          </span>
                          <Badge variant="outline" className={cn('capitalize text-[10px]', statusColors[status])}>
                            {status}
                          </Badge>
                        </div>
                        <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 mb-2 truncate">
                          {s.routes?.origin}
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          {s.routes?.destination}
                        </div>
                        <div className="flex justify-between text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Bus className="h-3.5 w-3.5" /> {s.buses?.plate_number}
                          </span>
                          <span>RM {Number(s.base_price).toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tracking Console */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedSchedule ? (
            <Card className="h-[600px] border-none shadow-sm flex flex-col items-center justify-center text-muted-foreground text-center p-6">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
                <Navigation className="h-8 w-8 animate-pulse" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">No Schedule Selected</h3>
              <p className="text-sm max-w-sm mt-1">
                Select an active schedule from the list on the left to initialize the tracking map and telemetry dashboard.
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Telemetry Indicator */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-none shadow-sm bg-white p-4 flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                    <Gauge className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-mono block">GPS SPEED</span>
                    <span className="text-lg font-bold text-slate-800">{simSpeedKmh} km/h</span>
                  </div>
                </Card>

                <Card className="border-none shadow-sm bg-white p-4 flex items-center gap-4">
                  <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                    <FastForward className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-mono block">PROGRESS</span>
                    <span className="text-lg font-bold text-slate-800">{simPercent}%</span>
                  </div>
                </Card>

                <Card className="border-none shadow-sm bg-white p-4 flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-mono block">STATUS</span>
                    <span className="text-sm font-bold text-slate-800 capitalize leading-none block mt-1">
                      {selectedSchedule.live_status ?? selectedSchedule.status ?? 'scheduled'}
                    </span>
                  </div>
                </Card>
              </div>

              {/* Map Canvas */}
              <Card className="border-none shadow-sm overflow-hidden flex flex-col bg-white">
                <div className="p-4 border-b flex justify-between items-center text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {selectedSchedule.buses?.plate_number}
                    </Badge>
                    <span className="text-slate-600">
                      {selectedSchedule.routes?.origin} → {selectedSchedule.routes?.destination}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-normal">
                    Click anywhere on the map to manually override bus coordinates
                  </span>
                </div>
                <div className="h-[380px] w-full relative">
                  <div id={mapContainerId} className="w-full h-full relative z-0" />
                </div>
              </Card>

              {/* Simulator Dashboard */}
              <Card className="border-none shadow-sm bg-white">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Play className="h-4.5 w-4.5 text-blue-600" /> GPS Telemetry Route Simulator
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex gap-2">
                      <Button
                        onClick={handleStartTrip}
                        disabled={isPlaying || selectedSchedule.live_status === 'arrived'}
                        className="gap-2 shrink-0 bg-blue-600 hover:bg-blue-700"
                      >
                        <Play className="h-4 w-4" /> Start Trip / Stream
                      </Button>
                      
                      {isPlaying ? (
                        <Button variant="outline" onClick={() => setIsPlaying(false)} className="gap-2 text-amber-600 border-amber-200 bg-amber-50">
                          <Pause className="h-4 w-4" /> Pause Simulation
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          onClick={() => setIsPlaying(true)} 
                          disabled={simPercent >= 100 || selectedSchedule.live_status === 'arrived'}
                          className="gap-2"
                        >
                          <Play className="h-4 w-4" /> Resume Simulation
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <span className="text-xs font-semibold text-slate-600 shrink-0">Sim Speed:</span>
                      <div className="flex bg-slate-100 rounded-lg p-0.5 w-full sm:w-48">
                        {[1, 2, 5, 10].map(s => (
                          <button
                            key={s}
                            onClick={() => setSimSpeed(s)}
                            className={cn(
                              'flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all',
                              simSpeed === s ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            )}
                          >
                            {s}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Progress Indicator Slider */}
                  <div className="space-y-2 border-t pt-4 border-dashed">
                    <div className="flex justify-between items-center text-xs text-muted-foreground font-semibold">
                      <span>Departed Terminal (0%)</span>
                      <span className="font-mono text-blue-600">Simulating journey: {simPercent}%</span>
                      <span>Arrived Destination (100%)</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={simPercent}
                      disabled={isPlaying}
                      onChange={(e) => {
                        const pct = Number(e.target.value);
                        setSimPercent(pct);
                        if (activeRoute) {
                          const { start, end } = activeRoute;
                          const nextLat = start.lat + (end.lat - start.lat) * (pct / 100);
                          const nextLng = start.lng + (end.lng - start.lng) * (pct / 100);
                          setSimLocation([nextLat, nextLng]);
                          setSimHeading(getBearing(nextLat, nextLng, end.lat, end.lng));
                          setSimSpeedKmh(pct >= 100 ? 0 : 85);
                        }
                      }}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
