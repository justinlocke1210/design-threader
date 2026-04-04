import * as XLSX from "xlsx";
import { Thread } from "./types";

type ImportRow = Record<string, unknown>;

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[_-]/g, "");
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
  const raw = asString(value, "#000000");
  if (!raw) return "#000000";
  if (raw.startsWith("#")) return raw;
  return `#${raw}`;
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

function getValue(row: ImportRow, ...keys: string[]): unknown {
  const entries = Object.entries(row);
  for (const key of keys) {
    const normalizedTarget = normalizeHeader(key);
    const found = entries.find(([k]) => normalizeHeader(k) === normalizedTarget);
    if (found) return found[1];
  }
  return undefined;
}

function rowToThread(row: ImportRow): Omit<Thread, "id" | "createdAt" | "updatedAt"> {
  const sku = asString(getValue(row, "sku"));
  const manufacturer = asString(getValue(row, "manufacturer"));
  const colorName = asString(getValue(row, "colorName", "color", "color name"));
  const hex = normalizeHex(getValue(row, "hex", "hex color", "hexcolor"));
  const type = asString(getValue(row, "type"), "polyester").toLowerCase() || "polyester";
  const unit = normalizeUnit(getValue(row, "unit"));
  const qtyOnHand = asNumber(getValue(row, "qtyOnHand", "qty", "quantity", "quantityonhand"), 0);
  const location = asString(getValue(row, "location"));
  const tags = asTags(getValue(row, "tags"));
  const pantone = asString(getValue(row, "pantone")) || undefined;
  const lot = asString(getValue(row, "lot")) || undefined;
  const photoUrl = asString(getValue(row, "photoUrl", "photourl")) || undefined;

  const lowStockMode = normalizeLowStockMode(getValue(row, "lowStockMode", "low stock mode"));
  const manualLowStockThreshold = asNumber(
    getValue(row, "manualLowStockThreshold", "manual low stock threshold"),
    3
  );

  return {
    sku,
    manufacturer,
    colorName,
    hex,
    pantone,
    type,
    unit,
    qtyOnHand,
    lowStockThreshold: manualLowStockThreshold,
    lowStockMode,
    manualLowStockThreshold,
    location,
    tags,
    photoUrl,
    lot,
  };
}

export async function parseThreadsFromExcel(file: File): Promise<Omit<Thread, "id" | "createdAt" | "updatedAt">[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("No worksheet found in Excel file.");
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<ImportRow>(sheet, { defval: "" });

  if (!rows.length) {
    throw new Error("The worksheet is empty.");
  }

  const mapped = rows.map(rowToThread);

  const valid = mapped.filter((row) => row.sku && row.manufacturer && row.colorName);

  if (!valid.length) {
    throw new Error("No valid rows found. Required columns: sku, manufacturer, colorName.");
  }

  return valid;
}
