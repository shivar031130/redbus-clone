'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/lib/store';
import {
    addSchedule,
    cancelSchedule,
    fetchBuses,
    fetchRoutes,
    fetchSchedules,
    getMyOperatorId,
    publishBusLocation,
    publishScheduleUpdate,
    updateSchedule,
    type BusRecord,
    type RouteRecord,
    type ScheduleRecord,
} from '@/lib/supabase/operator-queries';
import { format } from 'date-fns';
import { Activity, ArrowRight, Bus, Calendar, Loader2, Pencil, Plus, RefreshCw, Tag, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const statusColor: Record<string, string> = {
  scheduled: 'bg-gray-100 text-gray-700',
  departed: 'bg-blue-100 text-blue-700',
  arrived: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const emptyForm = { route_id: '', bus_id: '', departure_time: '', arrival_time: '', base_price: 0 };

export default function OperatorSchedulesPage() {
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);
  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [buses, setBuses] = useState<BusRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [operatorId, setOperatorId] = useState<string | null>(null);

  const [showDialog, setShowDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<ScheduleRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [cancelTarget, setCancelTarget] = useState<ScheduleRecord | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const { user } = useAuthStore();
  const [liveTarget, setLiveTarget] = useState<ScheduleRecord | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [liveForm, setLiveForm] = useState({
    status: 'scheduled',
    message: '',
    eta_departure: '',
    eta_arrival: '',
    delay_minutes: 0,
    latitude: '',
    longitude: '',
    heading: '',
    speed_kmh: '',
  });

  const toLocalInput = (iso?: string | null) => {
    if (!iso) return '';
    try {
      return new Date(iso).toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const opId = operatorId ?? await getMyOperatorId();
      if (!opId) { toast.error('Operator profile not found.'); setLoading(false); return; }
      setOperatorId(opId);
      const [s, r, b] = await Promise.all([fetchSchedules(opId), fetchRoutes(opId), fetchBuses(opId)]);
      setSchedules(s);
      setRoutes(r);
      setBuses(b);
    } catch (err: any) {
      toast.error('Failed to load schedules: ' + (err.message ?? 'Error'));
    } finally {
      setLoading(false);
    }
  }, [operatorId]);

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setShowDialog(true);
  };
  const openEdit = (s: ScheduleRecord) => {
    setEditTarget(s);
    setForm({
      route_id: s.route_id ?? '',
      bus_id: s.bus_id ?? '',
      departure_time: s.departure_time.slice(0, 16),
      arrival_time: s.arrival_time.slice(0, 16),
      base_price: s.base_price,
    });
    setShowDialog(true);
  };

  const openLiveOps = (s: ScheduleRecord) => {
    setLiveTarget(s);
    setLiveForm({
      status: s.live_status ?? s.status ?? 'scheduled',
      message: '',
      eta_departure: toLocalInput(s.estimated_departure_time ?? null),
      eta_arrival: toLocalInput(s.estimated_arrival_time ?? null),
      delay_minutes: s.delay_minutes ?? 0,
      latitude: '',
      longitude: '',
      heading: '',
      speed_kmh: '',
    });
  };

  const handleSave = async () => {
    if (!form.route_id || !form.bus_id || !form.departure_time || !form.arrival_time || !form.base_price) {
      toast.error('Please fill all fields.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        route_id: form.route_id,
        bus_id: form.bus_id,
        departure_time: new Date(form.departure_time).toISOString(),
        arrival_time: new Date(form.arrival_time).toISOString(),
        base_price: form.base_price,
      };
      if (editTarget) {
        await updateSchedule(editTarget.id, payload);
        toast.success('Schedule updated!');
      } else {
        await addSchedule(payload);
        toast.success('Schedule created!');
      }
      setShowDialog(false);
      await load();
    } catch (err: any) {
      toast.error('Save failed: ' + (err.message ?? 'Error'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await cancelSchedule(cancelTarget.id);
      setSchedules((prev) => prev.map((s) => s.id === cancelTarget.id ? { ...s, status: 'cancelled' } : s));
      toast.success('Schedule cancelled.');
      setCancelTarget(null);
    } catch (err: any) {
      toast.error('Cancel failed: ' + (err.message ?? 'Error'));
    } finally {
      setCancelling(false);
    }
  };

  const handlePublishLiveOps = async () => {
    if (!liveTarget) return;
    if (!liveForm.status) {
      toast.error('Please select a live status.');
      return;
    }

    setPublishing(true);
    try {
      const etaDeparture = liveForm.eta_departure
        ? new Date(liveForm.eta_departure).toISOString()
        : null;
      const etaArrival = liveForm.eta_arrival
        ? new Date(liveForm.eta_arrival).toISOString()
        : null;

      await publishScheduleUpdate({
        schedule_id: liveTarget.id,
        status: liveForm.status,
        message: liveForm.message || null,
        estimated_departure_time: etaDeparture,
        estimated_arrival_time: etaArrival,
        delay_minutes: Number(liveForm.delay_minutes) || 0,
        created_by: user?.id ?? null,
      });

      if (liveForm.latitude && liveForm.longitude) {
        await publishBusLocation({
          schedule_id: liveTarget.id,
          bus_id: liveTarget.bus_id,
          latitude: Number(liveForm.latitude),
          longitude: Number(liveForm.longitude),
          heading: liveForm.heading ? Number(liveForm.heading) : null,
          speed_kmh: liveForm.speed_kmh ? Number(liveForm.speed_kmh) : null,
        });
      }

      setSchedules((prev) =>
        prev.map((s) =>
          s.id === liveTarget.id
            ? {
                ...s,
                live_status: liveForm.status,
                estimated_departure_time: etaDeparture,
                estimated_arrival_time: etaArrival,
                delay_minutes: Number(liveForm.delay_minutes) || 0,
                last_update_at: new Date().toISOString(),
              }
            : s
        )
      );

      toast.success('Live update published.');
      setLiveTarget(null);
    } catch (err: any) {
      toast.error('Live update failed: ' + (err.message ?? 'Error'));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Schedules &amp; Pricing</h1>
          <p className="text-muted-foreground mt-1">Manage departure times, assign buses, and set ticket prices.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={openAdd} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" /> Create Schedule
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">No schedules yet. Create your first schedule.</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {schedules.map((s) => (
            <Card key={s.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary p-2 rounded-lg">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold">{format(new Date(s.departure_time), 'EEEE, dd MMM yyyy')}</h3>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-medium ${statusColor[s.status]}`}>
                    {s.status}
                  </span>
                </div>

                {/* Route Timeline */}
                <div className="flex items-center justify-between bg-secondary/30 p-4 rounded-xl border border-dashed border-border/60 mb-6">
                  <div className="text-center">
                    <div className="font-bold text-xl">{format(new Date(s.departure_time), 'HH:mm')}</div>
                    <div className="text-xs text-muted-foreground">{s.routes?.origin ?? '—'}</div>
                  </div>
                  <div className="flex-1 flex items-center justify-center px-4">
                    <div className="h-px bg-border flex-1" />
                    <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />
                    <div className="h-px bg-border flex-1" />
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-xl">{format(new Date(s.arrival_time), 'HH:mm')}</div>
                    <div className="text-xs text-muted-foreground">{s.routes?.destination ?? '—'}</div>
                  </div>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <Bus className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground block text-xs">Assigned Bus</span>
                      <span className="font-medium">
                        {s.buses?.plate_number ?? '—'} ({s.buses?.bus_type ?? '—'})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground block text-xs">Base Price</span>
                      <span className="font-bold text-primary">RM {Number(s.base_price).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm mb-6">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground block text-xs">Live Status</span>
                    <span className="font-medium">
                      {s.live_status ?? s.status}
                      {s.delay_minutes ? ` (+${s.delay_minutes}m delay)` : ''}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-dashed">
                  <Button
                    variant="outline"
                    className="flex-1 gap-1"
                    onClick={() => openEdit(s)}
                    disabled={s.status === 'cancelled'}
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-1"
                    onClick={() => openLiveOps(s)}
                    disabled={s.status === 'cancelled'}
                  >
                    <Activity className="h-4 w-4" /> Live Ops
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={s.status === 'cancelled' || s.status === 'arrived'}
                    onClick={() => setCancelTarget(s)}
                  >
                    <XCircle className="h-4 w-4" /> Cancel Trip
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Schedule' : 'Create Schedule'}</DialogTitle>
            <DialogDescription>Assign a route, bus, times, and price.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Route *</Label>
              <Select value={form.route_id ?? ''} onValueChange={(v) => setForm({ ...form, route_id: v ?? '' })}>
                <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                <SelectContent>
                  {routes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.origin} → {r.destination}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Bus *</Label>
              <Select value={form.bus_id ?? ''} onValueChange={(v) => setForm({ ...form, bus_id: v ?? '' })}>
                <SelectTrigger><SelectValue placeholder="Select bus" /></SelectTrigger>
                <SelectContent>
                  {buses.filter((b) => b.is_active).map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.plate_number} ({b.bus_type}, {b.total_seats} seats)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Departure *</Label>
                <Input type="datetime-local" value={form.departure_time} onChange={(e) => setForm({ ...form, departure_time: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Arrival *</Label>
                <Input type="datetime-local" value={form.arrival_time} onChange={(e) => setForm({ ...form, arrival_time: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Base Price (RM) *</Label>
              <Input type="number" min={0} step={0.50} placeholder="e.g. 45.00" value={form.base_price || ''} onChange={(e) => setForm({ ...form, base_price: Number(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editTarget ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        
      {/* Live Ops */}
      <Dialog open={!!liveTarget} onOpenChange={() => setLiveTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Live Operations Update</DialogTitle>
            <DialogDescription>Publish ETA updates and optional bus location.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Live Status *</Label>
              <Select
                value={liveForm.status}
                onValueChange={(v) => setLiveForm({ ...liveForm, status: v ?? 'scheduled' })}
              >
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="boarding">Boarding</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="departed">Departed</SelectItem>
                  <SelectItem value="en_route">En Route</SelectItem>
                  <SelectItem value="arrived">Arrived</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ETA Departure</Label>
                <Input
                  type="datetime-local"
                  value={liveForm.eta_departure}
                  onChange={(e) => setLiveForm({ ...liveForm, eta_departure: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>ETA Arrival</Label>
                <Input
                  type="datetime-local"
                  value={liveForm.eta_arrival}
                  onChange={(e) => setLiveForm({ ...liveForm, eta_arrival: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Delay (minutes)</Label>
                <Input
                  type="number"
                  min={0}
                  value={liveForm.delay_minutes}
                  onChange={(e) => setLiveForm({ ...liveForm, delay_minutes: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Input
                  value={liveForm.message}
                  onChange={(e) => setLiveForm({ ...liveForm, message: e.target.value })}
                  placeholder="Optional update message"
                />
              </div>
            </div>

            <div className="border-t border-dashed pt-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Live Location (optional)
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input
                    type="number"
                    step="0.00001"
                    value={liveForm.latitude}
                    onChange={(e) => setLiveForm({ ...liveForm, latitude: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input
                    type="number"
                    step="0.00001"
                    value={liveForm.longitude}
                    onChange={(e) => setLiveForm({ ...liveForm, longitude: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="space-y-2">
                  <Label>Heading</Label>
                  <Input
                    type="number"
                    step="1"
                    value={liveForm.heading}
                    onChange={(e) => setLiveForm({ ...liveForm, heading: e.target.value })}
                    placeholder="Degrees"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Speed (km/h)</Label>
                  <Input
                    type="number"
                    step="1"
                    value={liveForm.speed_kmh}
                    onChange={(e) => setLiveForm({ ...liveForm, speed_kmh: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLiveTarget(null)}>Cancel</Button>
            <Button onClick={handlePublishLiveOps} disabled={publishing} className="gap-2">
              {publishing && <Loader2 className="h-4 w-4 animate-spin" />}
              Publish Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirm */}
      <Dialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Schedule</DialogTitle>
            <DialogDescription>
              Cancel the trip on{' '}
              <strong>
                {cancelTarget ? format(new Date(cancelTarget.departure_time), 'dd MMM yyyy, HH:mm') : ''}
              </strong>
              ? Passengers with bookings may need to be refunded.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>Keep</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelling} className="gap-2">
              {cancelling && <Loader2 className="h-4 w-4 animate-spin" />}
              Cancel Trip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
