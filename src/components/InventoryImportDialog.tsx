import { useEffect, useMemo, useState } from "react";
import {
  buildPreviewRows,
  FieldMapping,
  getSuggestedMapping,
  getValidImportRows,
  PreviewRow,
  RawImportResult,
  THREAD_IMPORT_FIELDS,
} from "@/lib/importThreadsPreview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InventoryImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: RawImportResult | null;
  onConfirm: (rows: any[]) => void;
}

export default function InventoryImportDialog({
  open,
  onOpenChange,
  source,
  onConfirm,
}: InventoryImportDialogProps) {
  const [mapping, setMapping] = useState<FieldMapping>({});

  useEffect(() => {
    if (source) {
      setMapping(getSuggestedMapping(source.headers));
    }
  }, [source]);

  const previewRows: PreviewRow[] = useMemo(() => {
    if (!source) return [];
    return buildPreviewRows(source.rows, mapping);
  }, [source, mapping]);

  const validRows = useMemo(() => getValidImportRows(previewRows), [previewRows]);
  const errorCount = previewRows.filter((r) => r.errors.length > 0).length;

  if (!source) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Preview Inventory Import</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-hidden flex flex-col">
          <div className="rounded-lg border p-4 space-y-3">
            <div className="text-sm font-medium">Column Mapping</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {THREAD_IMPORT_FIELDS.map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="text-sm font-medium">
                    {field.label} {field.required ? "*" : ""}
                  </label>
                  <select
                    value={mapping[field.key] ?? ""}
                    onChange={(e) =>
                      setMapping((prev) => ({
                        ...prev,
                        [field.key]: e.target.value || undefined,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
                  >
                    <option value="">-- Not mapped --</option>
                    {source.headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium">{validRows.length}</span> valid row(s)
              {" · "}
              <span className="font-medium text-destructive">{errorCount}</span> row(s) with errors
            </div>
            <div className="text-muted-foreground">
              Rows with errors will not be imported.
            </div>
          </div>

          <div className="rounded-lg border overflow-auto flex-1">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left p-2">Row</th>
                  <th className="text-left p-2">SKU</th>
                  <th className="text-left p-2">Manufacturer</th>
                  <th className="text-left p-2">Color</th>
                  <th className="text-left p-2">Qty</th>
                  <th className="text-left p-2">Errors</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row) => (
                  <tr
                    key={row.rowNumber}
                    className={row.errors.length ? "bg-red-50 border-t" : "border-t"}
                  >
                    <td className="p-2 align-top">{row.rowNumber}</td>
                    <td className="p-2 align-top">{row.parsed?.sku || ""}</td>
                    <td className="p-2 align-top">{row.parsed?.manufacturer || ""}</td>
                    <td className="p-2 align-top">{row.parsed?.colorName || ""}</td>
                    <td className="p-2 align-top">{row.parsed?.qtyOnHand ?? ""}</td>
                    <td className="p-2 align-top">
                      {row.errors.length ? (
                        <ul className="text-destructive space-y-1">
                          {row.errors.map((error) => (
                            <li key={error}>{error}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-green-700">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => onConfirm(validRows)}
              disabled={validRows.length === 0}
            >
              Import {validRows.length} Valid Row{validRows.length === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
