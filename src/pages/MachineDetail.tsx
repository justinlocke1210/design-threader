import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { store } from '@/lib/store';
import { Thread } from '@/lib/types';
import { ArrowLeft, X, Search, Pencil, Check, PackageMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function MachineDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [machine, setMachine] = useState(() => store.getMachines().find(m => m.id === id));
  const [assignSlot, setAssignSlot] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editType, setEditType] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const inStockThreads = store.getInStockThreads();

  const refresh = () => setMachine(store.getMachines().find(m => m.id === id));

  const filteredThreads = useMemo(() => {
    const q = search.toLowerCase();
    return inStockThreads.filter(t => !q || t.colorName.toLowerCase().includes(q) || t.sku.toLowerCase().includes(q));
  }, [inStockThreads, search]);

  if (!machine) {
    return (
      <div className="animate-fade-in text-center py-20">
        <p className="text-muted-foreground">Machine not found</p>
        <Button variant="outline" onClick={() => navigate('/machines')} className="mt-4">Back to Machines</Button>
      </div>
    );
  }

  const getThread = (threadId: string | null): Thread | undefined => {
    return threadId ? store.getThreads().find(t => t.id === threadId) : undefined;
  };

  const handleAssign = (threadId: string) => {
    if (assignSlot === null) return;
    store.assignSlot(machine.id, assignSlot, threadId);
    refresh();
    setAssignSlot(null);
    setSearch('');
  };

  const handleUnassign = (slotNumber: number) => {
    store.assignSlot(machine.id, slotNumber, null);
    refresh();
  };

  const handleMarkEmpty = (slotNumber: number) => {
    store.markSlotEmpty(machine.id, slotNumber);
    refresh();
  };

  const startEdit = () => {
    setEditName(machine.name);
    setEditLocation(machine.location);
    setEditType(machine.machineType);
    setEditNotes(machine.notes);
    setEditing(true);
  };

  const saveEdit = () => {
    store.updateMachine(machine.id, {
      name: editName,
      location: editLocation,
      machineType: editType,
      notes: editNotes,
    });
    refresh();
    setEditing(false);
  };

  return (
    <div className="animate-fade-in">
      <Button variant="ghost" onClick={() => navigate('/machines')} className="mb-4 gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} /> Back to Machines
      </Button>

      {/* Machine info header */}
      <div className="page-header">
        {editing ? (
          <div className="rounded-xl border bg-card p-5 space-y-3 mb-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Machine Name</Label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={editLocation} onChange={e => setEditLocation(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Machine Type</Label>
                <Input value={editType} onChange={e => setEditType(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Optional notes..." />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={saveEdit} className="gap-1.5"><Check size={14} /> Save</Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <h1 className="page-title">{machine.name}</h1>
              <p className="page-subtitle">{machine.location} · {machine.machineType} · {machine.maxSlots} slots</p>
              {machine.notes && <p className="text-xs text-muted-foreground mt-1 italic">{machine.notes}</p>}
            </div>
            <Button size="sm" variant="outline" onClick={startEdit} className="gap-1.5">
              <Pencil size={14} /> Edit
            </Button>
          </div>
        )}
      </div>

      {/* Slot grid */}
      <div className="rounded-xl border bg-card p-6 mb-6">
        <h2 className="font-display font-semibold mb-4">Thread Slots</h2>
        <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-15 gap-3">
          {machine.slots.map(slot => {
            const thread = getThread(slot.threadId);
            return (
              <div key={slot.slotNumber} className="flex flex-col items-center gap-1.5">
                <button
                  onClick={() => thread ? handleUnassign(slot.slotNumber) : setAssignSlot(slot.slotNumber)}
                  className={`slot-circle ${thread ? 'filled' : ''} relative group`}
                  style={thread ? { backgroundColor: thread.hex, boxShadow: `0 2px 8px ${thread.hex}40` } : {}}
                  title={thread ? `${thread.colorName} (${thread.sku}) – Click to unassign` : `Slot ${slot.slotNumber} – Click to assign`}
                >
                  {!thread && <span className="text-xs text-muted-foreground font-mono">{slot.slotNumber}</span>}
                  {thread && (
                    <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-foreground/40 rounded-full transition-opacity">
                      <X size={14} className="text-card" />
                    </span>
                  )}
                </button>
                <span className="text-[10px] font-mono text-muted-foreground">{slot.slotNumber}</span>
                {thread && <span className="text-[9px] text-muted-foreground truncate max-w-[60px] text-center">{thread.sku}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Slot list */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-2.5 font-medium w-16">Slot</th>
              <th className="text-left px-4 py-2.5 font-medium">Thread</th>
              <th className="text-right px-4 py-2.5 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {machine.slots.map(slot => {
              const thread = getThread(slot.threadId);
              return (
                <tr key={slot.slotNumber} className="border-b last:border-0">
                  <td className="px-4 py-2.5 font-mono text-xs">{slot.slotNumber}</td>
                  <td className="px-4 py-2.5">
                    {thread ? (
                      <div className="flex items-center gap-2">
                        <div className="thread-chip shrink-0" style={{ backgroundColor: thread.hex }} />
                        <span className="font-medium">{thread.colorName}</span>
                        <span className="text-xs text-muted-foreground">{thread.sku}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic text-xs">Empty</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {thread ? (
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleMarkEmpty(slot.slotNumber)} className="text-xs gap-1 text-destructive hover:text-destructive" title="Mark as empty — removes from slot and decrements inventory qty by 1">
                          <PackageMinus size={13} /> Empty
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleUnassign(slot.slotNumber)} className="text-xs">Remove</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setAssignSlot(slot.slotNumber)} className="text-xs">Assign</Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Assign thread dialog — only in-stock threads */}
      <Dialog open={assignSlot !== null} onOpenChange={() => { setAssignSlot(null); setSearch(''); }}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display">Assign Thread to Slot {assignSlot}</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-2 mb-1">Only threads with stock &gt; 0 are shown.</p>
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search threads..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
            {filteredThreads.map(t => (
              <button
                key={t.id}
                onClick={() => handleAssign(t.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <div className="thread-chip shrink-0" style={{ backgroundColor: t.hex }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{t.colorName}</p>
                  <p className="text-xs text-muted-foreground">{t.sku} · {t.manufacturer} · {t.qtyOnHand} {t.unit}s</p>
                </div>
              </button>
            ))}
            {filteredThreads.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No in-stock threads found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
