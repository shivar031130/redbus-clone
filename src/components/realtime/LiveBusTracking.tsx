'use client';

import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';

interface BusLocation {
  id: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  speed_kmh: number | null;
  recorded_at: string;
}

interface LiveBusTrackingProps {
  scheduleId: string;
  className?: string;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('bus_locations')
        .select('id, latitude, longitude, heading, speed_kmh, recorded_at')
        .eq('schedule_id', scheduleId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data && isMounted) {
        setLocation(data as BusLocation);
      }
      if (isMounted) setLoading(false);
    };

    load();

    const channel = supabase
      .channel(`bus_locations_${scheduleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bus_locations',
          filter: `schedule_id=eq.${scheduleId}`,
        },
        (payload) => {
          setLocation(payload.new as BusLocation);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [scheduleId, supabase]);

  const mapUrl = location
    ? `https://staticmap.openstreetmap.de/staticmap.php?center=${location.latitude},${location.longitude}&zoom=12&size=640x360&markers=${location.latitude},${location.longitude},red-pushpin`
    : null;

  return (
    <Card className={cn('p-5 space-y-4', className)}>
      <div>
        <h3 className="text-lg font-semibold">Live Bus Tracking</h3>
        <p className="text-sm text-muted-foreground">Follow your bus position in real time.</p>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading live location...</div>
      ) : !location ? (
        <div className="text-sm text-muted-foreground">Live tracking is not available yet.</div>
      ) : (
        <div className="space-y-3">
          {mapUrl && (
            <img
              src={mapUrl}
              alt="Live bus location map"
              className="w-full h-56 object-cover rounded-xl border border-border"
            />
          )}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
            <div>
              Lat: {location.latitude.toFixed(5)}, Lng: {location.longitude.toFixed(5)}
            </div>
            <div>
              Speed: {location.speed_kmh ?? 0} km/h | Updated: {formatTime(location.recorded_at)}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
