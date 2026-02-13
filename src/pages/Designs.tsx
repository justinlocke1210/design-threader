import { useState, useEffect, useRef, useCallback } from 'react';
import { store } from '@/lib/store';
import { Design, DesignThread } from '@/lib/types';
import { Plus, FileText, ChevronDown, ChevronUp, Pencil, Trash2, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

function ThreadPicker({ value, onChange }: { value: string; onChange: (hex: string, threadId: string | null) => void }) {
  const inStock = store.getInStockThreads();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = inStock.filter(t => {
    const q = search.toLowerCase();
    return !q || t.colorName.toLowerCase().includes(q) || t.sku.toLowerCase().includes(q) || t.manufacturer.toLowerCase().includes(q) || t.hex.toLowerCase().includes(q);
  });

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded border border-input cursor-pointer hover:ring-2 hover:ring-ring"
        style={{ backgroundColor: value }}
        title="Pick from inventory"
      />
      {open && (
        <div className="absolute z-50 top-10 left-0 w-64 bg-popover border rounded-lg shadow-lg p-2 space-y-1 max-h-56 overflow-y-auto">
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by SKU, manufacturer, color..."
            className="text-xs h-8 mb-1"
            autoFocus
          />
          {filtered.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => { onChange(t.hex, t.id); setOpen(false); setSearch(''); }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted transition-colors text-left"
            >
              <div className="w-5 h-5 rounded-full border border-border shrink-0" style={{ backgroundColor: t.hex }} />
              <span className="text-[10px] font-mono font-semibold text-foreground">{t.sku}</span>
              <span className="text-[10px] text-muted-foreground truncate">{t.manufacturer}</span>
              <span className="text-[10px] text-muted-foreground truncate">— {t.colorName}</span>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">No in-stock threads</p>}
        </div>
      )}
    </div>
  );
}

export default function Designs() {
  const [designs, setDesigns] = useState<Design[]>(store.getDesigns());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formThreads, setFormThreads] = useState<DesignThread[]>([
    { order: 1, threadId: null, colorHex: '#000000', stitchCode: 'C1', note: '' },
  ]);

  // Undo state
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const refresh = useCallback(() => setDesigns(store.getDesigns()), []);

  const visibleDesigns = showDeleted ? designs : designs.filter(d => !d.isDeleted);

  const resetForm = () => {
    setFormName('');
    setFormNotes('');
    setFormThreads([{ order: 1, threadId: null, colorHex: '#000000', stitchCode: 'C1', note: '' }]);
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (d: Design) => {
    setEditingId(d.id);
    setFormName(d.name);
    setFormNotes(d.notes);
    setFormThreads(d.threads.map(t => ({ ...t })));
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      store.updateDesign(editingId, { name: formName, notes: formNotes, threads: formThreads });
    } else {
      store.addDesign({ name: formName, version: 1, notes: formNotes, threads: formThreads });
    }
    refresh();
    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    store.softDeleteDesign(id);
    refresh();
    setPendingDeleteId(id);

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setPendingDeleteId(null), 5000);

    toast('Design deleted', {
      action: {
        label: 'Undo',
        onClick: () => {
          store.restoreDesign(id);
          refresh();
          setPendingDeleteId(null);
          if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        },
      },
      duration: 5000,
    });
  };

  const handleRestore = (id: string) => {
    store.restoreDesign(id);
    refresh();
  };

  const addThreadRow = () => {
    setFormThreads(prev => [...prev, { order: prev.length + 1, threadId: null, colorHex: '#000000', stitchCode: `C${prev.length + 1}`, note: '' }]);
  };

  const updateThreadRow = (index: number, field: string, value: string) => {
    setFormThreads(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));
  };

  const updateThreadColor = (index: number, hex: string, threadId: string | null) => {
    setFormThreads(prev => prev.map((t, i) => i === index ? { ...t, colorHex: hex, threadId } : t));
  };

  const removeThreadRow = (index: number) => {
    setFormThreads(prev => prev.filter((_, i) => i !== index).map((t, i) => ({ ...t, order: i + 1 })));
  };

  const getThreadInfo = (threadId: string | null) => {
    if (!threadId) return null;
    return store.getThreads().find(t => t.id === threadId);
  };

  const generatePickList = (design: Design) => {
    const lines = design.threads.map(dt => {
      const thread = getThreadInfo(dt.threadId);
      return `Slot ${dt.order}: ${thread ? `${thread.sku} - ${thread.colorName} (${thread.manufacturer})` : `Custom ${dt.colorHex}`} | ${dt.stitchCode} | ${dt.note}`;
    });
    const text = `Pick List: ${design.name}\n${'='.repeat(40)}\n${lines.join('\n')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `picklist-${design.name.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Designs</h1>
          <p className="page-subtitle">{visibleDesigns.length} design palettes</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch checked={showDeleted} onCheckedChange={setShowDeleted} id="show-deleted" />
            <label htmlFor="show-deleted" className="cursor-pointer">Show deleted</label>
          </div>
          <Button onClick={openAdd} className="gap-2">
            <Plus size={16} /> Add Design
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {visibleDesigns.map(d => {
          const isOpen = expanded === d.id;
          const isDeleted = d.isDeleted;
          return (
            <div key={d.id} className={`rounded-xl border bg-card overflow-hidden ${isDeleted ? 'opacity-60' : ''}`}>
              <button
                onClick={() => setExpanded(isOpen ? null : d.id)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors text-left"
              >
                <div className="bg-primary/10 rounded-lg p-2">
                  <FileText size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-sm">
                    {d.name}
                    {isDeleted && <Badge variant="destructive" className="ml-2 text-[10px]">Deleted</Badge>}
                  </h3>
                  <p className="text-xs text-muted-foreground">{d.threads.length} colors · v{d.version}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1">
                    {d.threads.slice(0, 6).map((dt, i) => (
                      <div key={i} className="w-5 h-5 rounded-full border-2 border-card" style={{ backgroundColor: dt.colorHex }} />
                    ))}
                    {d.threads.length > 6 && <span className="text-xs text-muted-foreground ml-2">+{d.threads.length - 6}</span>}
                  </div>
                  {isOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 border-t">
                  {d.notes && <p className="text-sm text-muted-foreground mt-3 mb-4">{d.notes}</p>}
                  <div className="space-y-2 mb-4">
                    {d.threads.map((dt, i) => {
                      const thread = getThreadInfo(dt.threadId);
                      return (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <span className="font-mono text-xs text-muted-foreground w-6">{dt.order}</span>
                          <div className="thread-chip shrink-0" style={{ backgroundColor: dt.colorHex }} />
                          <span className="font-mono text-xs font-semibold">{thread ? thread.sku : '—'}</span>
                          {thread && <span className="text-xs text-muted-foreground">{thread.manufacturer} — {thread.colorName}</span>}
                          {!thread && <span className="text-xs text-muted-foreground italic">Unlinked</span>}
                          <Badge variant="secondary" className="text-[10px]">{dt.stitchCode}</Badge>
                          {dt.note && <span className="text-xs text-muted-foreground italic">{dt.note}</span>}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    {!isDeleted && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => generatePickList(d)}>Export Pick List</Button>
                        <Button size="sm" variant="outline" onClick={() => openEdit(d)} className="gap-1.5">
                          <Pencil size={12} /> Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(d.id)} className="gap-1.5 text-destructive hover:text-destructive">
                          <Trash2 size={12} /> Delete
                        </Button>
                      </>
                    )}
                    {isDeleted && (
                      <Button size="sm" variant="outline" onClick={() => handleRestore(d.id)} className="gap-1.5">
                        <Undo2 size={12} /> Restore
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {visibleDesigns.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <FileText size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No designs yet. Add one to get started.</p>
          </div>
        )}
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editingId ? 'Edit Design' : 'Add Design'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Design Name</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} required placeholder="e.g. Floral Monogram" />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="Instructions or notes..." rows={2} />
            </div>

            <div className="space-y-2">
              <Label>Thread Palette <span className="text-xs text-muted-foreground font-normal">(pick from in-stock inventory)</span></Label>
              {formThreads.map((dt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground w-5">{dt.order}</span>
                  <ThreadPicker value={dt.colorHex} onChange={(hex, tid) => updateThreadColor(i, hex, tid)} />
                  <Input value={dt.stitchCode} onChange={e => updateThreadRow(i, 'stitchCode', e.target.value)} className="w-16 text-xs" placeholder="C1" />
                  <Input value={dt.note} onChange={e => updateThreadRow(i, 'note', e.target.value)} className="flex-1 text-xs" placeholder="Note..." />
                  {formThreads.length > 1 && (
                    <button type="button" onClick={() => removeThreadRow(i)} className="text-muted-foreground hover:text-destructive text-xs">✕</button>
                  )}
                </div>
              ))}
              {formThreads.length < 15 && (
                <Button type="button" variant="outline" size="sm" onClick={addThreadRow} className="text-xs">+ Add Color</Button>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
              <Button type="submit">{editingId ? 'Save Changes' : 'Add Design'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
