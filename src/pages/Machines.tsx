import { useState } from 'react';
import { store } from '@/lib/store';
import { Machine } from '@/lib/types';
import { Plus, Cpu, ChevronRight, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Machines() {
  const [machines, setMachines] = useState<Machine[]>(store.getMachines());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newType, setNewType] = useState('Multi-needle');

  const threads = store.getThreads();

  const refresh = () => setMachines(store.getMachines());

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    store.addMachine({ name: newName, location: newLocation, machineType: newType, maxSlots: 15, notes: '' });
    refresh();
    setDialogOpen(false);
    setNewName('');
    setNewLocation('');
  };

  const handleDuplicate = (e: React.MouseEvent, machineId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const clone = store.duplicateMachine(machineId);
    if (clone) {
      refresh();
      toast.success(`Duplicated as "${clone.name}"`);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, machineId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteId(machineId);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    store.deleteMachine(deleteId);
    refresh();
    setDeleteId(null);
    toast.success('Machine deleted');
  };

  const getSlotColor = (threadId: string | null) => {
    if (!threadId) return undefined;
    return threads.find(t => t.id === threadId)?.hex;
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Machines</h1>
          <p className="page-subtitle">{machines.length} machines configured</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus size={16} /> Add Machine
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {machines.map(m => {
          const filled = m.slots.filter(s => s.threadId).length;
          return (
            <Link key={m.id} to={`/machines/${m.id}`} className="stat-card group hover:border-primary/30 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-lg p-2">
                    <Cpu size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold">{m.name}</h3>
                    <p className="text-xs text-muted-foreground">{m.location} · {m.machineType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleDuplicate(e, m.id)}
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Duplicate machine"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(e, m.id)}
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete machine"
                  >
                    <Trash2 size={14} />
                  </button>
                  <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors ml-1" />
                </div>
              </div>

              <div className="flex items-center gap-1.5 mb-3">
                {m.slots.map(s => (
                  <div
                    key={s.slotNumber}
                    className="w-5 h-5 rounded-full border border-border flex items-center justify-center text-[8px] font-mono text-muted-foreground"
                    style={s.threadId ? { backgroundColor: getSlotColor(s.threadId), borderColor: 'transparent' } : {}}
                    title={`Slot ${s.slotNumber}`}
                  >
                    {!s.threadId && s.slotNumber}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{filled}/{m.maxSlots} slots filled</p>
            </Link>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Add Machine</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Machine Name</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Brother PR1050X" required />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input value={newLocation} onChange={e => setNewLocation(e.target.value)} placeholder="e.g. Station 1" />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Input value={newType} onChange={e => setNewType(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Add Machine</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Machine</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this machine and all its slot assignments. Continue?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
