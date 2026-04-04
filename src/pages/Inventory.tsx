import { useState, useMemo, useRef } from 'react';
import { store } from '@/lib/store';
import { Thread } from '@/lib/types';
import { Plus, Search, Pencil, Trash2, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ThreadFormDialog from '@/components/ThreadFormDialog';
import { readSpreadsheetFile, RawImportResult } from '@/lib/importThreadsPreview';
import InventoryImportDialog from '@/components/InventoryImportDialog';
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

export default function Inventory() {
  const [threads, setThreads] = useState(store.getThreads());
  const [search, setSearch] = useState('');
  const [filterMfg, setFilterMfg] = useState('');
  const [filterType, setFilterType] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editThread, setEditThread] = useState<Thread | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const [importSource, setImportSource] = useState<RawImportResult | null>(null);

  const onMachine = store.getThreadsOnMachines();

  const manufacturers = useMemo(
    () => [...new Set(threads.map((t) => t.manufacturer))].sort(),
    [threads]
  );

  const types = useMemo(
    () => [...new Set(threads.map((t) => t.type))].sort(),
    [threads]
  );

  const filtered = useMemo(() => {
    return threads.filter((t) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        t.colorName.toLowerCase().includes(q) ||
        t.sku.toLowerCase().includes(q) ||
        t.manufacturer.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q));

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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setImporting(true);
  try {
    const source = await readSpreadsheetFile(file);
    setImportSource(source);
    setImportPreviewOpen(true);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed";
    toast.error(message);
  } finally {
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }
};

  const handleConfirmImport = (rows: Omit<Thread, 'id' | 'createdAt' | 'updatedAt'>[]) => {
  store.bulkUpsertThreads(rows);
  refresh();
  setImportPreviewOpen(false);
  setImportSource(null);
  toast.success(`Imported ${rows.length} inventory row${rows.length === 1 ? '' : 's'}`);
};

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display tracking-tight">Thread Inventory</h1>
          <p className="text-muted-foreground mt-1">
            {threads.length} SKUs · {threads.reduce((s, t) => s + t.qtyOnHand, 0)} total units · {store.getMachineCount()} machines
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls, .csv"
            onChange={handleImportFile}
            className="hidden"
          />

          <Button
            variant="outline"
            onClick={handleImportClick}
            disabled={importing}
            className="gap-2"
          >
            <Upload size={16} />
            {importing ? 'Importing…' : 'Import Excel'}
          </Button>

          <Button
            onClick={() => {
              setEditThread(null);
              setDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus size={16} />
            Add Thread
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by color, SKU, manufacturer, tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <select
            value={filterMfg}
            onChange={(e) => setFilterMfg(e.target.value)}
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm"
          >
            <option value="">All Manufacturers</option>
            {manufacturers.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm"
          >
            <option value="">All Types</option>
            {types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Color</th>
                <th className="text-left px-4 py-3 font-medium">SKU</th>
                <th className="text-left px-4 py-3 font-medium">Manufacturer</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Qty</th>
                <th className="text-left px-4 py-3 font-medium">Location</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((t) => {
                const isLow = store.isThreadLowStock(t);
                const isOnMachine = onMachine.has(t.id);
                const machineCount = store.getMachineCount();

                return (
                  <tr key={t.id} className="border-b border-border/60 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-block w-4 h-4 rounded-full border border-border"
                          style={{ backgroundColor: t.hex }}
                        />
                        <span className="font-medium">{t.colorName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{t.sku}</td>
                    <td className="px-4 py-3">{t.manufacturer}</td>
                    <td className="px-4 py-3 capitalize">{t.type}</td>
                    <td className="px-4 py-3">{t.qtyOnHand} {t.unit}s</td>
                    <td className="px-4 py-3">{t.location}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {isOnMachine && <Badge variant="secondary">On Machine</Badge>}
                        {isLow && <Badge variant="destructive">Low Stock</Badge>}
                        <Badge variant="outline">
                          {t.lowStockMode === 'auto'
                            ? `Auto (machines: ${machineCount})`
                            : `Manual (≤ ${t.manualLowStockThreshold ?? t.lowStockThreshold})`}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditThread(t);
                            setDialogOpen(true);
                          }}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(t.id)}
                          className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    No threads found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ThreadFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        thread={editThread}
        onSave={handleSave}
      />

      <InventoryImportDialog
  open={importPreviewOpen}
  onOpenChange={(open) => {
    setImportPreviewOpen(open);
    if (!open) setImportSource(null);
  }}
  source={importSource}
  onConfirm={handleConfirmImport}
/>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Thread</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this thread from inventory. Continue?
            </AlertDialogDescription>
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
