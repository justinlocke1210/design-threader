import * as XLSX from "xlsx";
import { Thread } from "./types";

export type ThreadImportField =
  | "sku"
  | "manufacturer"
  | "colorName"
  | "hex"
  | "type"
  | "unit"
  | "qtyOnHand"
  | "lowStockMode"
  | "manualLowStockThreshold"
  | "location"
  | "tags"
  | "pantone"
  | "lot"
  | "photoUrl";

export const THREAD_IMPORT_FIELDS: { key: ThreadImportField; label: string; required?: boolean }[] = [
  { key: "sku", label: "SKU", required: true },
  { key: "manufacturer", label: "Manufacturer", required: true },
  { key: "colorName", label: "Color Name", required: true },
  { key: "hex", label: "Hex Color" },
  { key: "type", label: "Type" },
  { key: "unit", label: "Unit" },
  { key: "qtyOnHand", label: "Qty On Hand" },
  { key: "lowStockMode", label: "Low Stock Mode" },
  { key: "manualLowStockThreshold", label: "Manual Low Stock Threshold" },
  { key: "location", label: "Location" },
  { key: "tags", label: "Tags" },
  { key: "pantone", label: "Pantone" },
  { key: "lot", label: "Lot" },
  { key: "photoUrl", label: "Photo URL" },
];

export type RawImportResult = {
  headers: string[];
  rows: Record<string, unknown>[];
};

export type FieldMapping = Partial<Record<ThreadImportField, string>>;

export type PreviewRow = {
  rowNumber: number;
  raw: Record<string, unknown>;
  parsed?: Omit<Thread, "id" | "createdAt" | "updatedAt">;
  errors: string[];
};

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function asString(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(String(value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asTags(value: unknown): string[] {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function normalizeHex(value: unknown): string {
  const raw = asString(value);
  if (!raw) return "#000000";
  return raw.startsWith("#") ? raw : `#${raw}`;
}

function normalizeUnit(value: unknown): Thread["unit"] {
  const raw = asString(value, "spool").toLowerCase();
  if (raw === "cone") return "cone";
  if (raw === "meters") return "meters";
  if (raw === "yards") return "yards";
  return "spool";
}

function normalizeLowStockMode(value: unknown): Thread["lowStockMode"] {
  const raw = asString(value, "auto").toLowerCase();
  return raw === "manual" ? "manual" : "auto";
}

function autoMapHeaders(headers: string[]): FieldMapping {
  const normalized = headers.map((h) => ({ original: h, normalized: normalizeHeader(h) }));
  const mapping: FieldMapping = {};

  const candidates: Record<ThreadImportField, string[]> = {
    sku: ["sku"],
    manufacturer: ["manufacturer", "brand"],
    colorName: ["colorname", "color", "threadcolor"],
    hex: ["hex", "hexcolor"],
    type: ["type", "threadtype"],
    unit: ["unit"],
    qtyOnHand: ["qtyonhand", "qty", "quantity", "quantityonhand"],
    lowStockMode: ["lowstockmode"],
    manualLowStockThreshold: ["manuallowstockthreshold", "lowstockthreshold"],
    location: ["location", "bin", "shelf"],
    tags: ["tags"],
    pantone: ["pantone"],
    lot: ["lot", "lotnumber"],
    photoUrl: ["photourl", "photo", "imageurl"],
  };

  for (const field of Object.keys(candidates) as ThreadImportField[]) {
    const found = normalized.find((h) => candidates[field].includes(h.normalized));
    if (found) mapping[field] = found.original;
  }

  return mapping;
}

export async function readSpreadsheetFile(file: File): Promise<RawImportResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("No worksheet found in the file.");
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  if (!rows.length) {
    throw new Error("The worksheet is empty.");
  }

  const headers = Object.keys(rows[0]);
  return { headers, rows };
}

export function getSuggestedMapping(headers: string[]): FieldMapping {
  return autoMapHeaders(headers);
}

export function buildPreviewRows(
  rows: Record<string, unknown>[],
  mapping: FieldMapping
): PreviewRow[] {
  return rows.map((raw, index) => {
    const getMapped = (field: ThreadImportField) => {
      const header = mapping[field];
      return header ? raw[header] : undefined;
    };

    const sku = asString(getMapped("sku"));
    const manufacturer = asString(getMapped("manufacturer"));
    const colorName = asString(getMapped("colorName"));
    const qtyOnHandRaw = getMapped("qtyOnHand");

    const errors: string[] = [];

    if (!sku) errors.push("Missing SKU");
    if (!manufacturer) errors.push("Missing manufacturer");
    if (!colorName) errors.push("Missing color name");

    const qtyOnHand =
      qtyOnHandRaw === undefined || qtyOnHandRaw === ""
        ? 0
        : asNumber(qtyOnHandRaw, Number.NaN);

    if (Number.isNaN(qtyOnHand)) {
      errors.push("Qty On Hand must be a number");
    }

    const parsed: Omit<Thread, "id" | "createdAt" | "updatedAt"> = {
      sku,
      manufacturer,
      colorName,
      hex: normalizeHex(getMapped("hex")),
      pantone: asString(getMapped("pantone")) || undefined,
      type: asString(getMapped("type"), "polyester").toLowerCase() || "polyester",
      unit: normalizeUnit(getMapped("unit")),
      qtyOnHand: Number.isNaN(qtyOnHand) ? 0 : qtyOnHand,
      lowStockThreshold: asNumber(getMapped("manualLowStockThreshold"), 3),
      lowStockMode: normalizeLowStockMode(getMapped("lowStockMode")),
      manualLowStockThreshold: asNumber(getMapped("manualLowStockThreshold"), 3),
      location: asString(getMapped("location")),
      tags: asTags(getMapped("tags")),
      photoUrl: asString(getMapped("photoUrl")) || undefined,
      lot: asString(getMapped("lot")) || undefined,
    };

    return {
      rowNumber: index + 2,
      raw,
      parsed,
      errors,
    };
  });
}

export function getValidImportRows(previewRows: PreviewRow[]) {
  return previewRows.filter((r) => r.errors.length === 0).map((r) => r.parsed!);
}
