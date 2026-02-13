import { useState, useMemo } from 'react';
import { store } from '@/lib/store';
import { Thread } from '@/lib/types';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ThreadFormDialog from '@/components/ThreadFormDialog';
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

export default function Inventory() {
  const [threads, setThreads] = useState<Thread[]>(store.getThreads());
  const [search, setSearch] = useState('');
  const [filterMfg, setFilterMfg] = useState('');
  const [filterType, setFilterType] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editThread, setEditThread] = useState<Thread | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const onMachine = store.getThreadsOnMachines();

  const manufacturers = useMemo(() => [...new Set(threads.map(t => t.manufacturer))].sort(), [threads]);
  const types = useMemo(() => [...new Set(threads.map(t => t.type))].sort(), [threads]);

  const filtered = useMemo(() => {
    return threads.filter(t => {
      const q = search.toLowerCase();
      const matchSearch = !q || t.colorName.toLowerCase().includes(q) || t.sku.toLowerCase().includes(q) || t.manufacturer.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q));
      const matchMfg = !filterMfg || t.manufacturer === filterMfg;
      const matchType = !filterType || t.type === filterType;
      return matchSearch && matchMfg && matchType;
    });
  }, [threads, search, filterMfg, filterType]);

  const refresh = () => setThreads(store.getThreads());

  const handleSave = (data: Omit<Thread, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editThread) {
      store.updateThread(editThread.id, data);
    } else {
      store.addThread(data);
    }
    refresh();
    setDialogOpen(false);
    setEditThread(null);
  };

  const handleDelete = () => {
    if (deleteId) {
      store.deleteThread(deleteId);
      refresh();
      setDeleteId(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Thread Inventory</h1>
          <p className="page-subtitle">{threads.length} SKUs · {threads.reduce((s, t) => s + t.qtyOnHand, 0)} total units · {store.getMachineCount()} machines</p>
        </div>
        <Button onClick={() => { setEditThread(null); setDialogOpen(true); }} className="gap-2">
          <Plus size={16} /> Add Thread
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search threads..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={filterMfg} onChange={e => setFilterMfg(e.target.value)} className="h-10 rounded-lg border border-input bg-card px-3 text-sm">
          <option value="">All Manufacturers</option>
          {manufacturers.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="h-10 rounded-lg border border-input bg-card px-3 text-sm">
          <option value="">All Types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Color</th>
                <th className="text-left px-4 py-3 font-medium">SKU</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Manufacturer</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-medium">Qty</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Location</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const isLow = store.isThreadLowStock(t);
                const isOnMachine = onMachine.has(t.id);
                const machineCount = store.getMachineCount();
                return (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="thread-chip shrink-0" style={{ backgroundColor: t.hex }} />
                        <span className="font-medium truncate max-w-[140px]">{t.colorName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{t.sku}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{t.manufacturer}</td>
                    <td className="px-4 py-3 hidden lg:table-cell capitalize">{t.type}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${isLow ? 'text-warning' : ''}`}>{t.qtyOnHand}</span>
                      <span className="text-muted-foreground text-xs ml-1">{t.unit}s</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{t.location}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-1.5">
                          {isOnMachine && <Badge variant="secondary" className="text-[10px]">On Machine</Badge>}
                          {isLow && <Badge variant="destructive" className="text-[10px]">Low Stock</Badge>}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {t.lowStockMode === 'auto'
                            ? `Auto (machines: ${machineCount})`
                            : `Manual (≤ ${t.manualLowStockThreshold ?? t.lowStockThreshold})`}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditThread(t); setDialogOpen(true); }} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteId(t.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No threads found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ThreadFormDialog open={dialogOpen} onOpenChange={setDialogOpen} thread={editThread} onSave={handleSave} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Thread</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this thread from inventory. Continue?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
