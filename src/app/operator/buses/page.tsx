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
import { BusFront, Plus, Pencil, Trash2, Loader2, RefreshCw, ToggleLeft, ToggleRight, Upload, Image as ImageIcon } from 'lucide-react';
import {
  fetchBuses,
  addBus,
  updateBus,
  deleteBus,
  getMyOperatorId,
  type BusRecord,
} from '@/lib/supabase/operator-queries';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

const AMENITY_OPTIONS = ['WiFi', 'Charging Ports', 'Meals', 'Blanket', 'TV Screen', 'Recliner', 'Toilet'];

const emptyForm = { plate_number: '', bus_type: '', total_seats: 30, amenities: [] as string[], interior_image_url: null as string | null, exterior_image_url: null as string | null };

export default function OperatorBusesPage() {
  const [buses, setBuses] = useState<BusRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [operatorId, setOperatorId] = useState<string | null>(null);

  const [showDialog, setShowDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<BusRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<BusRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [uploadingImage, setUploadingImage] = useState(false);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const opId = operatorId ?? await getMyOperatorId();
      if (!opId) { toast.error('Operator profile not found.'); setLoading(false); return; }
      setOperatorId(opId);
      const data = await fetchBuses(opId);
      setBuses(data);
    } catch (err: any) {
      toast.error('Failed to load buses: ' + (err.message ?? 'Error'));
    } finally {
      setLoading(false);
    }
  }, [operatorId]);

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditTarget(null); setForm(emptyForm); setShowDialog(true); };
  const openEdit = (bus: BusRecord) => {
    setEditTarget(bus);
    setForm({ plate_number: bus.plate_number, bus_type: bus.bus_type, total_seats: bus.total_seats, amenities: bus.amenities, interior_image_url: bus.interior_image_url, exterior_image_url: bus.exterior_image_url });
    setShowDialog(true);
  };

  const toggleAmenity = (a: string) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'interior' | 'exterior') => {
    try {
      setUploadingImage(true);
      const file = e.target.files?.[0];
      if (!file || !operatorId) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${operatorId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('bus-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('bus-images')
        .getPublicUrl(filePath);

      if (type === 'interior') setForm(f => ({ ...f, interior_image_url: publicUrl }));
      else setForm(f => ({ ...f, exterior_image_url: publicUrl }));
      
      toast.success(`${type} image uploaded!`);
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!form.plate_number || !form.bus_type || !form.total_seats) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    try {
      if (editTarget) {
        await updateBus(editTarget.id, form);
        setBuses((prev) => prev.map((b) => b.id === editTarget.id ? { ...b, ...form } : b));
        toast.success('Bus updated!');
      } else {
        if (!operatorId) return;
        const newBus = await addBus(operatorId, form);
        setBuses((prev) => [{ ...newBus, amenities: form.amenities } as BusRecord, ...prev]);
        toast.success('Bus added!');
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
      await deleteBus(deleteTarget.id);
      setBuses((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      toast.success('Bus removed.');
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error('Delete failed: ' + (err.message ?? 'Error'));
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (bus: BusRecord) => {
    try {
      await updateBus(bus.id, { is_active: !bus.is_active });
      setBuses((prev) => prev.map((b) => b.id === bus.id ? { ...b, is_active: !b.is_active } : b));
      toast.success(`Bus marked as ${!bus.is_active ? 'Active' : 'Inactive'}.`);
    } catch (err: any) {
      toast.error('Update failed: ' + (err.message ?? 'Error'));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Fleet Management</h1>
          <p className="text-muted-foreground mt-1">Manage your buses, capacities, and amenities.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={openAdd} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" /> Add New Bus
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      ) : buses.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No buses yet. Add your first bus to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buses.map((bus) => (
            <Card key={bus.id} className="border-none shadow-sm overflow-hidden group">
              <div className="h-48 bg-secondary/50 flex items-center justify-center relative">
                {bus.exterior_image_url ? (
                  <img src={bus.exterior_image_url} alt={bus.plate_number} className="w-full h-full object-cover" />
                ) : (
                  <BusFront className="h-16 w-16 text-muted-foreground/30" />
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                  <Badge
                    variant="outline"
                    className={bus.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}
                  >
                    {bus.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="font-bold text-xl">{bus.plate_number}</h3>
                  <p className="text-sm text-muted-foreground">{bus.bus_type} &bull; {bus.total_seats} Seats</p>
                </div>
                <div className="flex flex-wrap gap-2 mb-6 min-h-[2rem]">
                  {bus.amenities.length > 0
                    ? bus.amenities.map((a) => (
                        <span key={a} className="text-xs bg-secondary px-2 py-1 rounded-md font-medium text-muted-foreground">
                          {a}
                        </span>
                      ))
                    : <span className="text-xs text-muted-foreground italic">No amenities listed</span>}
                </div>
                <div className="flex gap-2 pt-4 border-t border-dashed flex-wrap">
                  <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => openEdit(bus)}>
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`flex-1 gap-1 ${bus.is_active ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                    onClick={() => handleToggleActive(bus)}
                  >
                    {bus.is_active ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                    {bus.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                    onClick={() => setDeleteTarget(bus)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Bus' : 'Add New Bus'}</DialogTitle>
            <DialogDescription>Fill in bus details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Plate Number *</Label>
              <Input placeholder="e.g. ABC 1234" value={form.plate_number} onChange={(e) => setForm({ ...form, plate_number: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bus Type *</Label>
                <Input placeholder="e.g. Executive" value={form.bus_type} onChange={(e) => setForm({ ...form, bus_type: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Total Seats *</Label>
                <Input type="number" min={1} value={form.total_seats} onChange={(e) => setForm({ ...form, total_seats: Number(e.target.value) })} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Exterior Image</Label>
                <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors relative h-32 group">
                  {form.exterior_image_url ? (
                    <img src={form.exterior_image_url} alt="Exterior preview" className="absolute inset-0 w-full h-full object-cover rounded-lg" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                  )}
                  <div className={`absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${form.exterior_image_url ? '' : 'opacity-100 bg-transparent hover:bg-black/5'}`}>
                    <label className="cursor-pointer flex flex-col items-center justify-center text-primary-foreground font-medium text-sm">
                      <Upload className="h-4 w-4 mb-1" />
                      <span>{form.exterior_image_url ? 'Replace' : 'Upload'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'exterior')} disabled={uploadingImage} />
                    </label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Interior Image</Label>
                <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors relative h-32 group">
                  {form.interior_image_url ? (
                    <img src={form.interior_image_url} alt="Interior preview" className="absolute inset-0 w-full h-full object-cover rounded-lg" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                  )}
                  <div className={`absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${form.interior_image_url ? '' : 'opacity-100 bg-transparent hover:bg-black/5'}`}>
                    <label className="cursor-pointer flex flex-col items-center justify-center text-primary-foreground font-medium text-sm">
                      <Upload className="h-4 w-4 mb-1" />
                      <span>{form.interior_image_url ? 'Replace' : 'Upload'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'interior')} disabled={uploadingImage} />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Amenities</Label>
              <div className="flex flex-wrap gap-2">
                {AMENITY_OPTIONS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${
                      form.amenities.includes(a)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-muted-foreground border-border hover:border-primary'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editTarget ? 'Save Changes' : 'Add Bus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Bus</DialogTitle>
            <DialogDescription>
              Permanently remove <strong>{deleteTarget?.plate_number}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="gap-2">
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
