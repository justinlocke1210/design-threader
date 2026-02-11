export interface Thread {
  id: string;
  sku: string;
  manufacturer: string;
  colorName: string;
  hex: string;
  pantone?: string;
  type: string; // polyester, rayon, metallic, cotton
  unit: 'spool' | 'cone' | 'meters' | 'yards';
  qtyOnHand: number;
  lowStockThreshold: number;
  location: string;
  tags: string[];
  photoUrl?: string;
  lot?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Machine {
  id: string;
  name: string;
  location: string;
  machineType: string;
  maxSlots: number;
  slots: MachineSlot[];
  notes: string;
  createdAt: string;
}

export interface MachineSlot {
  slotNumber: number;
  threadId: string | null;
  assignedAt: string | null;
}

export interface Design {
  id: string;
  name: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  version: number;
  notes: string;
  threads: DesignThread[];
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt: string;
}

export interface DesignThread {
  order: number;
  threadId: string | null;
  colorHex: string;
  stitchCode: string;
  note: string;
}
