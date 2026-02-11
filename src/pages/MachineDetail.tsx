import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { store } from '@/lib/store';
import { Thread } from '@/lib/types';
import { ArrowLeft, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function MachineDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [machine, setMachine] = useState(() => store.getMachines().find(m => m.id === id));
  const [assignSlot, setAssignSlot] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const threads = store.getThreads();

  const refresh = () => setMachine(store.getMachines().find(m => m.id === id));

  const filteredThreads = useMemo(() => {
    const q = search.toLowerCase();
    return threads.filter(t => !q || t.colorName.toLowerCase().includes(q) || t.sku.toLowerCase().includes(q));
  }, [threads, search]);

  if (!machine) {
    return (
      <div className="animate-fade-in text-center py-20">
        <p className="text-muted-foreground">Machine not found</p>
        <Button variant="outline" onClick={() => navigate('/machines')} className="mt-4">Back to Machines</Button>
      </div>
    );
  }

  const getThread = (threadId: string | null): Thread | undefined => {
    return threadId ? threads.find(t => t.id === threadId) : undefined;
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

  return (
    <div className="animate-fade-in">
      <Button variant="ghost" onClick={() => navigate('/machines')} className="mb-4 gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} /> Back to Machines
      </Button>

      <div className="page-header">
        <h1 className="page-title">{machine.name}</h1>
        <p className="page-subtitle">{machine.location} · {machine.machineType} · {machine.maxSlots} slots</p>
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
                      <Button size="sm" variant="ghost" onClick={() => handleUnassign(slot.slotNumber)} className="text-xs">Remove</Button>
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

      {/* Assign thread dialog */}
      <Dialog open={assignSlot !== null} onOpenChange={() => { setAssignSlot(null); setSearch(''); }}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display">Assign Thread to Slot {assignSlot}</DialogTitle>
          </DialogHeader>
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
              <p className="text-center text-sm text-muted-foreground py-8">No matching threads</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
