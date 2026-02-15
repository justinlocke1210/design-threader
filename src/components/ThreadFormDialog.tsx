import { useState, useEffect } from 'react';
import { Thread, KNOWN_MANUFACTURERS } from '@/lib/types';
import { store } from '@/lib/store';
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
  unit: 'spool', qtyOnHand: 0, lowStockThreshold: 3, lowStockMode: 'auto',
  manualLowStockThreshold: 3, location: '', tags: [],
};

export default function ThreadFormDialog({ open, onOpenChange, thread, onSave }: Props) {
  const [form, setForm] = useState(thread ? { ...thread } : { ...DEFAULTS });
  const [customMfg, setCustomMfg] = useState(false);

  useEffect(() => {
    if (open) {
      const data = thread ? { ...thread } : { ...DEFAULTS };
      setForm(data);
      const isKnown = KNOWN_MANUFACTURERS.includes(data.manufacturer as any);
      setCustomMfg(!!data.manufacturer && !isKnown);
    }
  }, [open, thread]);

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleMfgSelect = (value: string) => {
    if (value === '__custom__') {
      setCustomMfg(true);
      set('manufacturer', '');
    } else {
      setCustomMfg(false);
      set('manufacturer', value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { id, createdAt, updatedAt, ...data } = form as any;
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              {!customMfg ? (
                <select
                  value={KNOWN_MANUFACTURERS.includes(form.manufacturer as any) ? form.manufacturer : '__custom__'}
                  onChange={e => handleMfgSelect(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-card px-3 text-sm"
                  required
                >
                  <option value="" disabled>Select manufacturer</option>
                  {KNOWN_MANUFACTURERS.map(m => <option key={m} value={m}>{m}</option>)}
                  <option value="__custom__">Other / Custom</option>
                </select>
              ) : (
                <div className="flex gap-1.5">
                  <Input
                    value={form.manufacturer}
                    onChange={e => set('manufacturer', e.target.value)}
                    placeholder="Custom manufacturer"
                    required
                    autoFocus
                  />
                  <Button type="button" variant="ghost" size="sm" className="shrink-0 text-xs"
                    onClick={() => { setCustomMfg(false); set('manufacturer', KNOWN_MANUFACTURERS[0]); }}>
                    Back
                  </Button>
                </div>
              )}
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

          {/* Low Stock Mode */}
          <div className="space-y-2">
            <Label>Low Stock Threshold</Label>
            <div className="flex items-center gap-1 rounded-lg border border-input p-0.5 w-fit">
              <button type="button"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${form.lowStockMode === 'auto' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => set('lowStockMode', 'auto')}>
                Auto
              </button>
              <button type="button"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${form.lowStockMode === 'manual' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => set('lowStockMode', 'manual')}>
                Manual
              </button>
            </div>
            {form.lowStockMode === 'auto' ? (
              <p className="text-xs text-muted-foreground">
                Alert when qty equals machine count (currently <span className="font-semibold">{store.getMachineCount()}</span>)
              </p>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={9999}
                  value={form.manualLowStockThreshold ?? 0}
                  onChange={e => set('manualLowStockThreshold', Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-24"
                />
                <span className="text-xs text-muted-foreground">Alert when qty ≤ this value</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
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
