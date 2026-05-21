'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, ArrowRight, MapPin, Pencil, Trash2, Loader2, RefreshCw, ToggleLeft, ToggleRight, X } from 'lucide-react';
import {
  fetchRoutes,
  fetchBuses,
  addRoute,
  updateRoute,
  deleteRoute,
  getMyOperatorId,
  type RouteRecord,
  type BusRecord,
} from '@/lib/supabase/operator-queries';
import { toast } from 'sonner';

const emptyForm = { origin: '', destination: '', boarding_points: [] as string[], dropoff_points: [] as string[], estimated_duration: '', assigned_buses: [] as string[] };

export default function OperatorRoutesPage() {
  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [buses, setBuses] = useState<BusRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [operatorId, setOperatorId] = useState<string | null>(null);

  const [showDialog, setShowDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<RouteRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [boardingInput, setBoardingInput] = useState('');
  const [dropoffInput, setDropoffInput] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<RouteRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const opId = operatorId ?? await getMyOperatorId();
      if (!opId) { toast.error('Operator profile not found.'); setLoading(false); return; }
      setOperatorId(opId);
      const data = await fetchRoutes(opId);
      setRoutes(data);
      const bData = await fetchBuses(opId);
      setBuses(bData);
    } catch (err: any) {
      toast.error('Failed to load routes: ' + (err.message ?? 'Error'));
    } finally {
      setLoading(false);
    }
  }, [operatorId]);

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditTarget(null); setForm(emptyForm); setBoardingInput(''); setDropoffInput(''); setShowDialog(true); };
  const openEdit = (r: RouteRecord) => {
    setEditTarget(r);
    setForm({ origin: r.origin, destination: r.destination, boarding_points: [...r.boarding_points], dropoff_points: [...r.dropoff_points], estimated_duration: r.estimated_duration || '', assigned_buses: [...(r.assigned_buses || [])] });
    setBoardingInput(''); setDropoffInput('');
    setShowDialog(true);
  };

  const addPoint = (type: 'boarding' | 'dropoff') => {
    const val = type === 'boarding' ? boardingInput.trim() : dropoffInput.trim();
    if (!val) return;
    if (type === 'boarding') {
      setForm((f) => ({ ...f, boarding_points: [...f.boarding_points, val] }));
      setBoardingInput('');
    } else {
      setForm((f) => ({ ...f, dropoff_points: [...f.dropoff_points, val] }));
      setDropoffInput('');
    }
  };

  const removePoint = (type: 'boarding' | 'dropoff', idx: number) => {
    if (type === 'boarding') {
      setForm((f) => ({ ...f, boarding_points: f.boarding_points.filter((_, i) => i !== idx) }));
    } else {
      setForm((f) => ({ ...f, dropoff_points: f.dropoff_points.filter((_, i) => i !== idx) }));
    }
  };

  const toggleBus = (busId: string) => {
    setForm(f => ({
      ...f,
      assigned_buses: f.assigned_buses.includes(busId) 
        ? f.assigned_buses.filter(id => id !== busId)
        : [...f.assigned_buses, busId]
    }));
  };

  const handleSave = async () => {
    if (!form.origin || !form.destination) { toast.error('Origin and destination are required.'); return; }
    setSaving(true);
    try {
      // Auto-append any typed but uncommitted points
      const finalBoarding = boardingInput.trim() ? [...form.boarding_points, boardingInput.trim()] : form.boarding_points;
      const finalDropoff = dropoffInput.trim() ? [...form.dropoff_points, dropoffInput.trim()] : form.dropoff_points;
      
      const payload = { 
        ...form, 
        boarding_points: finalBoarding,
        dropoff_points: finalDropoff,
        estimated_duration: form.estimated_duration || null 
      };

      if (editTarget) {
        await updateRoute(editTarget.id, payload);
        setRoutes((prev) => prev.map((r) => r.id === editTarget.id ? { ...r, ...payload } : r));
        toast.success('Route updated!');
      } else {
        if (!operatorId) return;
        const newRoute = await addRoute(operatorId, payload);
        setRoutes((prev) => [{ ...newRoute, boarding_points: payload.boarding_points, dropoff_points: payload.dropoff_points, assigned_buses: payload.assigned_buses } as RouteRecord, ...prev]);
        toast.success('Route created!');
      }
      setShowDialog(false);
    } catch (err: any) {
      toast.error('Save failed: ' + (err.message ?? 'Error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRoute(deleteTarget.id);
      setRoutes((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      toast.success('Route deleted.');
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error('Delete failed: ' + (err.message ?? 'Error'));
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async (r: RouteRecord) => {
    try {
      await updateRoute(r.id, { is_active: !r.is_active });
      setRoutes((prev) => prev.map((x) => x.id === r.id ? { ...x, is_active: !x.is_active } : x));
      toast.success(`Route ${!r.is_active ? 'activated' : 'deactivated'}.`);
    } catch (err: any) {
      toast.error('Update failed: ' + (err.message ?? 'Error'));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Route Management</h1>
          <p className="text-muted-foreground mt-1">Define origins, destinations, and stopping points.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={openAdd} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" /> Create Route
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      ) : routes.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">No routes yet.</div>
      ) : (
        <div className="space-y-4">
          {routes.map((r) => (
            <Card key={r.id} className="border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <CardContent className="p-0 flex flex-col md:flex-row">
                <div className="flex-1 p-6">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                    <div className="flex items-center gap-3 text-2xl font-bold">
                      {r.origin}
                      <ArrowRight className="h-6 w-6 text-muted-foreground" />
                      {r.destination}
                    </div>
                    <Badge
                      variant="outline"
                      className={r.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500'}
                    >
                      {r.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="mb-4 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">Duration:</span> {r.estimated_duration || 'Not specified'} |{' '}
                    <span className="font-semibold text-foreground">Buses:</span> {r.assigned_buses?.length || 0} assigned
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Boarding Points
                      </h4>
                      {r.boarding_points.length > 0 ? (
                        <ul className="space-y-1.5 text-sm">
                          {r.boarding_points.map((p, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />{p}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">None set</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Drop-off Points
                      </h4>
                      {r.dropoff_points.length > 0 ? (
                        <ul className="space-y-1.5 text-sm">
                          {r.dropoff_points.map((p, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />{p}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">None set</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-secondary/30 p-6 flex flex-row md:flex-col items-center justify-center gap-3 border-t md:border-t-0 md:border-l w-full md:w-36 shrink-0">
                  <Button variant="outline" size="sm" className="w-full gap-1" onClick={() => openEdit(r)}>
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-full gap-1 ${r.is_active ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                    onClick={() => handleToggle(r)}
                  >
                    {r.is_active ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                    {r.is_active ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-red-600 hover:bg-red-50 gap-1"
                    onClick={() => setDeleteTarget(r)}
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Route' : 'Create New Route'}</DialogTitle>
            <DialogDescription>Set origin, destination, and stopping points.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Origin *</Label>
                <Input placeholder="e.g. Kuala Lumpur" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Destination *</Label>
                <Input placeholder="e.g. Penang" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <Label>Estimated Duration</Label>
              <Input placeholder="e.g. 4h 30m" value={form.estimated_duration} onChange={(e) => setForm({ ...form, estimated_duration: e.target.value })} />
            </div>
            {/* Boarding Points */}
            <div className="space-y-2">
              <Label>Boarding Points</Label>
              <div className="flex gap-2">
                <Input placeholder="e.g. TBS Terminal" value={boardingInput} onChange={(e) => setBoardingInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPoint('boarding')} />
                <Button type="button" variant="outline" onClick={() => addPoint('boarding')}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.boarding_points.map((p, i) => (
                  <span key={i} className="flex items-center gap-1 bg-secondary text-sm px-3 py-1 rounded-full">
                    {p}
                    <button onClick={() => removePoint('boarding', i)} className="ml-1 text-muted-foreground hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            {/* Drop-off Points */}
            <div className="space-y-2">
              <Label>Drop-off Points</Label>
              <div className="flex gap-2">
                <Input placeholder="e.g. Penang Sentral" value={dropoffInput} onChange={(e) => setDropoffInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPoint('dropoff')} />
                <Button type="button" variant="outline" onClick={() => addPoint('dropoff')}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.dropoff_points.map((p, i) => (
                  <span key={i} className="flex items-center gap-1 bg-secondary text-sm px-3 py-1 rounded-full">
                    {p}
                    <button onClick={() => removePoint('dropoff', i)} className="ml-1 text-muted-foreground hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            {/* Bus Selection */}
            <div className="space-y-2 mt-4">
              <Label>Assigned Buses</Label>
              <div className="text-sm text-muted-foreground mb-2">Select the buses that will run on this route.</div>
              {buses.length === 0 ? (
                <div className="text-sm italic text-muted-foreground">No buses found. Add buses in the Fleet section first.</div>
              ) : (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {buses.map(bus => (
                    <div 
                      key={bus.id} 
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${form.assigned_buses.includes(bus.id) ? 'bg-primary/5 border-primary' : 'bg-background border-border hover:bg-secondary/50'}`}
                      onClick={() => toggleBus(bus.id)}
                    >
                      <input 
                        type="checkbox" 
                        checked={form.assigned_buses.includes(bus.id)}
                        onChange={() => {}} // Handle dynamically in onClick
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{bus.plate_number}</span>
                        <span className="text-xs text-muted-foreground">{bus.bus_type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editTarget ? 'Save Changes' : 'Create Route'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Route</DialogTitle>
            <DialogDescription>
              Delete <strong>{deleteTarget?.origin} → {deleteTarget?.destination}</strong>? Associated schedules may be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="gap-2">
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
