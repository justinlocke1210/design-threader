import { useState } from 'react';
import { Thread } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  thread: Thread | null;
  onSave: (data: Omit<Thread, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const DEFAULTS: Omit<Thread, 'id' | 'createdAt' | 'updatedAt'> = {
  sku: '', manufacturer: '', colorName: '', hex: '#000000', type: 'polyester',
  unit: 'spool', qtyOnHand: 0, lowStockThreshold: 3, location: '', tags: [],
};

export default function ThreadFormDialog({ open, onOpenChange, thread, onSave }: Props) {
  const initial = thread ? { ...thread } : { ...DEFAULTS };
  const [form, setForm] = useState(initial);

  // Reset form when dialog opens
  const handleOpenChange = (o: boolean) => {
    if (o) setForm(thread ? { ...thread } : { ...DEFAULTS });
    onOpenChange(o);
  };

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { id, createdAt, updatedAt, ...data } = form as any;
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{thread ? 'Edit Thread' : 'Add Thread'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Color Name</Label>
              <Input value={form.colorName} onChange={e => set('colorName', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Hex Color</Label>
              <div className="flex gap-2">
                <input type="color" value={form.hex} onChange={e => set('hex', e.target.value)} className="w-10 h-10 rounded border border-input cursor-pointer" />
                <Input value={form.hex} onChange={e => set('hex', e.target.value)} className="font-mono" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>SKU</Label>
              <Input value={form.sku} onChange={e => set('sku', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Manufacturer</Label>
              <Input value={form.manufacturer} onChange={e => set('manufacturer', e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <select value={form.type} onChange={e => set('type', e.target.value)} className="w-full h-10 rounded-lg border border-input bg-card px-3 text-sm">
                <option value="polyester">Polyester</option>
                <option value="rayon">Rayon</option>
                <option value="metallic">Metallic</option>
                <option value="cotton">Cotton</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input type="number" min={0} value={form.qtyOnHand} onChange={e => set('qtyOnHand', parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <select value={form.unit} onChange={e => set('unit', e.target.value)} className="w-full h-10 rounded-lg border border-input bg-card px-3 text-sm">
                <option value="spool">Spool</option>
                <option value="cone">Cone</option>
                <option value="meters">Meters</option>
                <option value="yards">Yards</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Low Stock Threshold</Label>
              <Input type="number" min={0} value={form.lowStockThreshold} onChange={e => set('lowStockThreshold', parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Shelf A1" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Tags (comma separated)</Label>
            <Input value={(form.tags || []).join(', ')} onChange={e => set('tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="e.g. metallic, red, basic" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{thread ? 'Save Changes' : 'Add Thread'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
