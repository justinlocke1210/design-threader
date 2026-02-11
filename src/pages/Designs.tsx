import { useState } from 'react';
import { store } from '@/lib/store';
import { Design, DesignThread } from '@/lib/types';
import { Plus, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function Designs() {
  const [designs, setDesigns] = useState<Design[]>(store.getDesigns());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newThreads, setNewThreads] = useState<DesignThread[]>([
    { order: 1, threadId: null, colorHex: '#000000', stitchCode: 'C1', note: '' },
  ]);

  const threads = store.getThreads();
  const refresh = () => setDesigns(store.getDesigns());

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    store.addDesign({ name: newName, version: 1, notes: newNotes, threads: newThreads });
    refresh();
    setDialogOpen(false);
    setNewName('');
    setNewNotes('');
    setNewThreads([{ order: 1, threadId: null, colorHex: '#000000', stitchCode: 'C1', note: '' }]);
  };

  const addThreadRow = () => {
    setNewThreads(prev => [...prev, { order: prev.length + 1, threadId: null, colorHex: '#000000', stitchCode: `C${prev.length + 1}`, note: '' }]);
  };

  const updateThreadRow = (index: number, field: string, value: string) => {
    setNewThreads(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));
  };

  const removeThreadRow = (index: number) => {
    setNewThreads(prev => prev.filter((_, i) => i !== index).map((t, i) => ({ ...t, order: i + 1 })));
  };

  const getThreadInfo = (threadId: string | null) => {
    if (!threadId) return null;
    return threads.find(t => t.id === threadId);
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
          <p className="page-subtitle">{designs.length} design palettes</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus size={16} /> Add Design
        </Button>
      </div>

      <div className="space-y-3">
        {designs.map(d => {
          const isOpen = expanded === d.id;
          return (
            <div key={d.id} className="rounded-xl border bg-card overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : d.id)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors text-left"
              >
                <div className="bg-primary/10 rounded-lg p-2">
                  <FileText size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-sm">{d.name}</h3>
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
                          <span className="font-medium">{thread ? thread.colorName : dt.colorHex}</span>
                          {thread && <span className="text-xs text-muted-foreground">{thread.sku}</span>}
                          <Badge variant="secondary" className="text-[10px]">{dt.stitchCode}</Badge>
                          {dt.note && <span className="text-xs text-muted-foreground italic">{dt.note}</span>}
                        </div>
                      );
                    })}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => generatePickList(d)}>Export Pick List</Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Add Design</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Design Name</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} required placeholder="e.g. Floral Monogram" />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Instructions or notes..." rows={2} />
            </div>

            <div className="space-y-2">
              <Label>Thread Palette</Label>
              {newThreads.map((dt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground w-5">{dt.order}</span>
                  <input type="color" value={dt.colorHex} onChange={e => updateThreadRow(i, 'colorHex', e.target.value)} className="w-8 h-8 rounded border cursor-pointer" />
                  <Input value={dt.stitchCode} onChange={e => updateThreadRow(i, 'stitchCode', e.target.value)} className="w-16 text-xs" placeholder="C1" />
                  <Input value={dt.note} onChange={e => updateThreadRow(i, 'note', e.target.value)} className="flex-1 text-xs" placeholder="Note..." />
                  {newThreads.length > 1 && (
                    <button type="button" onClick={() => removeThreadRow(i)} className="text-muted-foreground hover:text-destructive text-xs">✕</button>
                  )}
                </div>
              ))}
              {newThreads.length < 15 && (
                <Button type="button" variant="outline" size="sm" onClick={addThreadRow} className="text-xs">+ Add Color</Button>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Add Design</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
