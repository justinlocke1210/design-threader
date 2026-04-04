import { Thread, Machine, Design } from './types';

// Helper to ensure backward compat for threads missing new fields
function migrateThread(t: Thread): Thread {
  return {
    ...t,
    lowStockMode: t.lowStockMode ?? 'manual',
    manualLowStockThreshold: t.manualLowStockThreshold ?? t.lowStockThreshold ?? 3,
  };
}

const STORAGE_KEYS = {
  threads: 'embroidery_threads',
  machines: 'embroidery_machines',
  designs: 'embroidery_designs',
};

function generateId(): string {
  return crypto.randomUUID();
}

// Seed data
const SEED_THREADS: Thread[] = [
  { id: generateId(), sku: 'ISA-0015', manufacturer: 'Isacord', colorName: 'White', hex: '#FFFFFF', type: 'polyester', unit: 'spool', qtyOnHand: 24, lowStockThreshold: 5, lowStockMode: 'auto', manualLowStockThreshold: 5, location: 'Shelf A1', tags: ['basic'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), sku: 'ISA-0020', manufacturer: 'Isacord', colorName: 'Black', hex: '#000000', type: 'polyester', unit: 'spool', qtyOnHand: 18, lowStockThreshold: 5, lowStockMode: 'auto', manualLowStockThreshold: 5, location: 'Shelf A1', tags: ['basic'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), sku: 'ISA-2922', manufacturer: 'Isacord', colorName: 'Ashley Gold', hex: '#D4A843', type: 'polyester', unit: 'spool', qtyOnHand: 6, lowStockThreshold: 3, lowStockMode: 'auto', manualLowStockThreshold: 3, location: 'Shelf A2', tags: ['metallic'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), sku: 'MAD-1147', manufacturer: 'Madeira', colorName: 'Dusty Rose', hex: '#C9777A', type: 'rayon', unit: 'cone', qtyOnHand: 3, lowStockThreshold: 3, lowStockMode: 'manual', manualLowStockThreshold: 3, location: 'Shelf B1', tags: ['rayon', 'pink'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), sku: 'MAD-1055', manufacturer: 'Madeira', colorName: 'Pacific Blue', hex: '#1B75BB', type: 'rayon', unit: 'cone', qtyOnHand: 8, lowStockThreshold: 3, lowStockMode: 'auto', manualLowStockThreshold: 3, location: 'Shelf B1', tags: ['rayon', 'blue'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), sku: 'SUL-1001', manufacturer: 'Sulky', colorName: 'Bright White', hex: '#F8F8F8', type: 'rayon', unit: 'spool', qtyOnHand: 12, lowStockThreshold: 4, lowStockMode: 'auto', manualLowStockThreshold: 4, location: 'Shelf C1', tags: ['basic', 'rayon'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), sku: 'ISA-3711', manufacturer: 'Isacord', colorName: 'Paprika', hex: '#B13A2A', type: 'polyester', unit: 'spool', qtyOnHand: 2, lowStockThreshold: 3, lowStockMode: 'manual', manualLowStockThreshold: 3, location: 'Shelf A3', tags: ['red'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), sku: 'ISA-5513', manufacturer: 'Isacord', colorName: 'Emerald', hex: '#2E8B57', type: 'polyester', unit: 'spool', qtyOnHand: 7, lowStockThreshold: 3, lowStockMode: 'auto', manualLowStockThreshold: 3, location: 'Shelf A3', tags: ['green'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), sku: 'MAD-1112', manufacturer: 'Madeira', colorName: 'Cornflower', hex: '#6495ED', type: 'rayon', unit: 'cone', qtyOnHand: 5, lowStockThreshold: 2, lowStockMode: 'auto', manualLowStockThreshold: 2, location: 'Shelf B2', tags: ['blue', 'rayon'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), sku: 'ISA-0776', manufacturer: 'Isacord', colorName: 'Sage', hex: '#9CAF88', type: 'polyester', unit: 'spool', qtyOnHand: 1, lowStockThreshold: 3, lowStockMode: 'manual', manualLowStockThreshold: 3, location: 'Shelf A4', tags: ['green', 'muted'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), sku: 'SUL-1181', manufacturer: 'Sulky', colorName: 'Rust', hex: '#A0522D', type: 'rayon', unit: 'spool', qtyOnHand: 4, lowStockThreshold: 2, lowStockMode: 'auto', manualLowStockThreshold: 2, location: 'Shelf C2', tags: ['brown', 'rayon'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), sku: 'ISA-1874', manufacturer: 'Isacord', colorName: 'Champagne', hex: '#F7E7CE', type: 'polyester', unit: 'spool', qtyOnHand: 9, lowStockThreshold: 3, lowStockMode: 'auto', manualLowStockThreshold: 3, location: 'Shelf A2', tags: ['neutral', 'light'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const SEED_MACHINES: Machine[] = [
  {
    id: generateId(), name: 'Brother PR1050X', location: 'Station 1', machineType: 'Multi-needle', maxSlots: 15,
    slots: Array.from({ length: 15 }, (_, i) => ({ slotNumber: i + 1, threadId: null, assignedAt: null })),
    notes: 'Primary production machine', createdAt: new Date().toISOString(),
  },
  {
    id: generateId(), name: 'Janome MB-7', location: 'Station 2', machineType: 'Multi-needle', maxSlots: 15,
    slots: Array.from({ length: 15 }, (_, i) => ({ slotNumber: i + 1, threadId: null, assignedAt: null })),
    notes: 'Secondary machine for smaller runs', createdAt: new Date().toISOString(),
  },
];

const SEED_DESIGNS: Design[] = [
  {
    id: generateId(), name: 'Floral Monogram', version: 1, notes: 'Classic floral wreath with script initial',
    threads: [
      { order: 1, threadId: null, colorHex: '#2E8B57', stitchCode: 'C1', note: 'Stem & leaves' },
      { order: 2, threadId: null, colorHex: '#C9777A', stitchCode: 'C2', note: 'Flowers' },
      { order: 3, threadId: null, colorHex: '#D4A843', stitchCode: 'C3', note: 'Accents' },
      { order: 4, threadId: null, colorHex: '#000000', stitchCode: 'C4', note: 'Monogram letter' },
      { order: 5, threadId: null, colorHex: '#FFFFFF', stitchCode: 'C5', note: 'Background fill' },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(), name: 'Corporate Logo - TechCo', version: 2, notes: 'Standard logo placement, left chest',
    threads: [
      { order: 1, threadId: null, colorHex: '#1B75BB', stitchCode: 'C1', note: 'Primary brand blue' },
      { order: 2, threadId: null, colorHex: '#FFFFFF', stitchCode: 'C2', note: 'Text' },
      { order: 3, threadId: null, colorHex: '#000000', stitchCode: 'C3', note: 'Outline' },
    ],
    createdAt: new Date().toISOString(),
  },
];

// Store helpers
function getItem<T>(key: string, seed: T[]): T[] {
  const stored = localStorage.getItem(key);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(key, JSON.stringify(seed));
  return seed;
}

function setItem<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Public API
export const store = {
  // Threads
  getThreads: (): Thread[] => getItem(STORAGE_KEYS.threads, SEED_THREADS).map(migrateThread),
  getMachineCount: (): number => store.getMachines().length,
  saveThreads: (threads: Thread[]) => setItem(STORAGE_KEYS.threads, threads),
  addThread: (thread: Omit<Thread, 'id' | 'createdAt' | 'updatedAt'>): Thread => {
    const threads = store.getThreads();
    const newThread: Thread = { ...thread, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    threads.push(newThread);
    store.saveThreads(threads);
    return newThread;
  },
  updateThread: (id: string, updates: Partial<Thread>) => {
    const threads = store.getThreads().map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t);
    store.saveThreads(threads);
  },
  deleteThread: (id: string) => {
    store.saveThreads(store.getThreads().filter(t => t.id !== id));
  },
  bulkUpsertThreads: (rows: Omit<Thread, 'id' | 'createdAt' | 'updatedAt'>[]) => {
  const threads = store.getThreads();
  const now = new Date().toISOString();

  const bySku = new Map(
    threads.map((thread) => [thread.sku.trim().toLowerCase(), thread])
  );

  for (const row of rows) {
    const key = row.sku.trim().toLowerCase();
    const existing = bySku.get(key);

    if (existing) {
      Object.assign(existing, {
        ...existing,
        ...row,
        updatedAt: now,
      });
    } else {
      const newThread: Thread = {
        ...row,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      threads.push(newThread);
      bySku.set(key, newThread);
    }
  }

  store.saveThreads(threads);
  return threads;
},

  // Machines
  getMachines: (): Machine[] => getItem(STORAGE_KEYS.machines, SEED_MACHINES),
  saveMachines: (machines: Machine[]) => setItem(STORAGE_KEYS.machines, machines),
  addMachine: (machine: Omit<Machine, 'id' | 'createdAt' | 'slots'>): Machine => {
    const machines = store.getMachines();
    const newMachine: Machine = {
      ...machine,
      id: generateId(),
      slots: Array.from({ length: machine.maxSlots }, (_, i) => ({ slotNumber: i + 1, threadId: null, assignedAt: null })),
      createdAt: new Date().toISOString(),
    };
    machines.push(newMachine);
    store.saveMachines(machines);
    return newMachine;
  },
  updateMachine: (id: string, updates: Partial<Machine>) => {
    const machines = store.getMachines().map(m => m.id === id ? { ...m, ...updates } : m);
    store.saveMachines(machines);
  },
  deleteMachine: (id: string) => {
    store.saveMachines(store.getMachines().filter(m => m.id !== id));
  },
  duplicateMachine: (id: string): Machine | undefined => {
    const machines = store.getMachines();
    const source = machines.find(m => m.id === id);
    if (!source) return undefined;
    const clone: Machine = {
      ...source,
      id: generateId(),
      name: `${source.name} (Copy)`,
      slots: Array.from({ length: source.maxSlots }, (_, i) => ({ slotNumber: i + 1, threadId: null, assignedAt: null })),
      createdAt: new Date().toISOString(),
    };
    machines.push(clone);
    store.saveMachines(machines);
    return clone;
  },
  assignSlot: (machineId: string, slotNumber: number, threadId: string | null) => {
    const machines = store.getMachines().map(m => {
      if (m.id !== machineId) return m;
      return {
        ...m,
        slots: m.slots.map(s => s.slotNumber === slotNumber ? { ...s, threadId, assignedAt: threadId ? new Date().toISOString() : null } : s),
      };
    });
    store.saveMachines(machines);
  },
  markSlotEmpty: (machineId: string, slotNumber: number) => {
    const machines = store.getMachines();
    const machine = machines.find(m => m.id === machineId);
    if (!machine) return;
    const slot = machine.slots.find(s => s.slotNumber === slotNumber);
    if (!slot?.threadId) return;
    const threadId = slot.threadId;
    // Decrement thread qty (min 0)
    const threads = store.getThreads();
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
      store.updateThread(threadId, { qtyOnHand: Math.max(0, thread.qtyOnHand - 1) });
    }
    // Unassign the slot
    store.assignSlot(machineId, slotNumber, null);
  },

  // Designs
  getDesigns: (): Design[] => getItem(STORAGE_KEYS.designs, SEED_DESIGNS),
  getActiveDesigns: (): Design[] => store.getDesigns().filter(d => !d.isDeleted),
  saveDesigns: (designs: Design[]) => setItem(STORAGE_KEYS.designs, designs),
  addDesign: (design: Omit<Design, 'id' | 'createdAt'>): Design => {
    const designs = store.getDesigns();
    const newDesign: Design = { ...design, id: generateId(), createdAt: new Date().toISOString() };
    designs.push(newDesign);
    store.saveDesigns(designs);
    return newDesign;
  },
  updateDesign: (id: string, updates: Partial<Design>) => {
    const designs = store.getDesigns().map(d => d.id === id ? { ...d, ...updates } : d);
    store.saveDesigns(designs);
  },
  softDeleteDesign: (id: string) => {
    store.updateDesign(id, { isDeleted: true, deletedAt: new Date().toISOString() });
  },
  restoreDesign: (id: string) => {
    store.updateDesign(id, { isDeleted: false, deletedAt: undefined });
  },
  permanentDeleteDesign: (id: string) => {
    const designs = store.getDesigns().filter(d => d.id !== id);
    store.saveDesigns(designs);
  },

  // Helpers
  getThreadById: (id: string): Thread | undefined => store.getThreads().find(t => t.id === id),
  getInStockThreads: (): Thread[] => store.getThreads().filter(t => t.qtyOnHand > 0),
  isThreadLowStock: (t: Thread): boolean => {
    if (t.lowStockMode === 'auto') {
      return t.qtyOnHand <= store.getMachineCount();
    }
    return t.qtyOnHand <= (t.manualLowStockThreshold ?? t.lowStockThreshold);
  },
  getLowStockThreads: (): Thread[] => store.getThreads().filter(t => store.isThreadLowStock(t)),
  getThreadsOnMachines: (): Set<string> => {
    const onMachine = new Set<string>();
    store.getMachines().forEach(m => m.slots.forEach(s => { if (s.threadId) onMachine.add(s.threadId); }));
    return onMachine;
  },
};
