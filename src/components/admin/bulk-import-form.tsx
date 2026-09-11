"use client";

import { useState, useRef } from "react";
import { parseCsv } from "@/lib/csv";
import { sortByImageOrder } from "@/lib/sort-image-files";
import { bulkImportRowAction } from "@/lib/actions/bulk-import";

// TypeScript's DOM lib doesn't know about the non-standard `webkitdirectory`
// / `directory` attributes that let a plain <input type="file"> pick a
// whole folder (with subfolders) instead of loose files — every mainstream
// desktop browser (Chrome, Edge, Firefox) supports them regardless. This
// thin wrapper just declares the two extra attributes so the rest of the
// file can stay fully typed rather than reaching for `any`.
type DirectoryInputProps = React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> & { webkitdirectory?: string; directory?: string };
function DirectoryInput(props: DirectoryInputProps) {
  return <input {...props} />;
}

type CsvRow = Record<string, string>;
type RowStatus = "waiting" | "pending" | "created" | "updated" | "skipped" | "error";
type RowResult = { status: RowStatus; message: string };

const CSV_COLUMNS = [
  "sku",
  "brand",
  "model",
  "title",
  "description",
  "category",
  "color",
  "condition",
  "price_usd",
  "is_consignment",
  "photo_folder_name",
] as const;

const STATUS_STYLES: Record<RowStatus, string> = {
  waiting: "bg-muted text-muted-foreground",
  pending: "bg-amber-100 text-amber-800",
  created: "bg-green-100 text-green-800",
  updated: "bg-green-100 text-green-800",
  skipped: "bg-amber-100 text-amber-800",
  error: "bg-red-100 text-red-800",
};

/** Escapes a single CSV field the same way product-intake-template.csv
 * expects — only wraps in quotes when the value actually needs it. */
function csvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function BulkImportForm() {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [photoFolders, setPhotoFolders] = useState<Map<string, File[]>>(new Map());
  const [results, setResults] = useState<RowResult[]>([]);
  const [running, setRunning] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy skipped/error rows as CSV");
  const csvInputRef = useRef<HTMLInputElement>(null);

  function handleCsvFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const parsed = parseCsv(text).filter((r) => (r.sku ?? "").trim().length > 0);
      setRows(parsed);
      setResults(parsed.map(() => ({ status: "waiting", message: "" })));
    };
    reader.readAsText(file);
  }

  function handleFolderSelect(fileList: FileList | null) {
    if (!fileList) return;
    const grouped = new Map<string, File[]>();
    for (const file of Array.from(fileList)) {
      const relPath = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
      if (!relPath) continue;
      const segments = relPath.split("/");
      // segments[0] is the top-level folder the user selected; segments[1]
      // is the per-SKU subfolder — exactly the "one folder per item, named
      // like the SKU" convention from product-intake-instructions.md.
      const folderName = segments[1];
      if (!folderName || !/\.(webp|jpe?g|png)$/i.test(file.name)) continue;
      const existing = grouped.get(folderName) ?? [];
      existing.push(file);
      grouped.set(folderName, existing);
    }
    for (const [key, files] of grouped) {
      grouped.set(key, sortByImageOrder(files, (f) => f.name));
    }
    setPhotoFolders(grouped);
  }

  function matchedFiles(row: CsvRow): File[] {
    const sku = (row.sku ?? "").trim();
    const explicit = (row.photo_folder_name ?? "").trim();
    if (explicit && photoFolders.has(explicit)) return photoFolders.get(explicit)!;
    if (photoFolders.has(sku)) return photoFolders.get(sku)!;
    for (const [key, files] of photoFolders) {
      if (key.startsWith(`${sku}-`)) return files;
    }
    return [];
  }

  async function startImport() {
    setRunning(true);
    const finalResults: RowResult[] = rows.map(() => ({ status: "waiting", message: "" }));
    setResults([...finalResults]);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const files = matchedFiles(row);
      const priceUsd = (row.price_usd ?? "").trim();
      const condition = (row.condition ?? "").trim();

      if (files.length === 0) {
        finalResults[i] = { status: "skipped", message: "No matching photo folder found." };
        setResults([...finalResults]);
        continue;
      }
      if (!priceUsd || !condition) {
        finalResults[i] = {
          status: "skipped",
          message: "Missing price_usd or condition — fill both in and re-import.",
        };
        setResults([...finalResults]);
        continue;
      }

      finalResults[i] = { status: "pending", message: `Uploading ${files.length} photo(s)…` };
      setResults([...finalResults]);

      const formData = new FormData();
      formData.set("sku", row.sku ?? "");
      formData.set("brand", row.brand ?? "");
      formData.set("model", row.model ?? "");
      formData.set("title", row.title ?? "");
      formData.set("description", row.description ?? "");
      formData.set("category", row.category ?? "handbag");
      formData.set("color", row.color ?? "");
      formData.set("condition", condition);
      formData.set("priceUsd", priceUsd);
      formData.set("isConsignment", (row.is_consignment ?? "").toLowerCase() === "yes" ? "yes" : "no");
      for (const file of files) formData.append("images", file);

      try {
        const result = await bulkImportRowAction(formData);
        finalResults[i] = result;
      } catch (err) {
        finalResults[i] = {
          status: "error",
          message: err instanceof Error ? err.message : "Unexpected error.",
        };
      }
      setResults([...finalResults]);
    }

    setRunning(false);
  }

  async function copyFailedRows() {
    const failed = rows.filter(
      (_, i) => results[i]?.status === "skipped" || results[i]?.status === "error"
    );
    const csvText = [
      CSV_COLUMNS.join(","),
      ...failed.map((row) => CSV_COLUMNS.map((c) => csvField(row[c] ?? "")).join(",")),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(csvText);
      setCopyLabel("Copied!");
      setTimeout(() => setCopyLabel("Copy skipped/error rows as CSV"), 2000);
    } catch {
      setCopyLabel("Couldn't copy — select and copy manually");
    }
  }

  const summary = results.reduce(
    (acc, r) => {
      if (r.status === "created") acc.created++;
      else if (r.status === "updated") acc.updated++;
      else if (r.status === "skipped") acc.skipped++;
      else if (r.status === "error") acc.error++;
      return acc;
    },
    { created: 0, updated: 0, skipped: 0, error: 0 }
  );
  const done = !running && results.length > 0 && results.every((r) => r.status !== "waiting" && r.status !== "pending");

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="csv-file" className="text-sm font-medium">
            1. Product data CSV
          </label>
          <input
            id="csv-file"
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleCsvFile(file);
            }}
            className="mt-1 w-full text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Same columns as product-intake-template.csv. {rows.length > 0 && `${rows.length} row(s) loaded.`}
          </p>
        </div>
        <div>
          <label htmlFor="photo-folder" className="text-sm font-medium">
            2. Photos folder
          </label>
          <DirectoryInput
            id="photo-folder"
            type="file"
            webkitdirectory=""
            directory=""
            multiple
            onChange={(e) => handleFolderSelect(e.target.files)}
            className="mt-1 w-full text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Select the parent folder containing one subfolder per SKU (same
            layout you&apos;d zip up for a manual send). {photoFolders.size > 0 &&
              `${photoFolders.size} folder(s) found.`}
          </p>
        </div>
      </div>

      {rows.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">3. Review and import</h2>
            <button
              type="button"
              onClick={startImport}
              disabled={running || rows.length === 0}
              className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-60"
            >
              {running ? "Importing…" : "Start import"}
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-normal">SKU</th>
                  <th className="py-2 pr-4 font-normal">Title</th>
                  <th className="py-2 pr-4 font-normal">Photos</th>
                  <th className="py-2 pr-4 font-normal">Price / Condition</th>
                  <th className="py-2 pr-4 font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row, i) => {
                  const files = matchedFiles(row);
                  const result = results[i] ?? { status: "waiting" as RowStatus, message: "" };
                  return (
                    <tr key={`${row.sku}-${i}`}>
                      <td className="py-3 pr-4 font-mono text-xs">{row.sku}</td>
                      <td className="py-3 pr-4">{row.title || <span className="text-muted-foreground">—</span>}</td>
                      <td className="py-3 pr-4">
                        {files.length > 0 ? (
                          `${files.length} photo(s)`
                        ) : (
                          <span className="text-danger">No folder matched</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {row.price_usd || <span className="text-danger">no price</span>}
                        {" / "}
                        {row.condition || <span className="text-danger">no condition</span>}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`rounded-full px-2 py-1 text-xs ${STATUS_STYLES[result.status]}`}>
                          {result.status === "waiting" ? "Not started" : result.status}
                        </span>
                        {result.message && (
                          <p className="mt-1 text-xs text-muted-foreground">{result.message}</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {done && (
            <div className="mt-4 space-y-2">
              <p className="text-sm">
                <strong>{summary.created}</strong> created, <strong>{summary.updated}</strong> updated,{" "}
                <strong>{summary.skipped}</strong> skipped, <strong>{summary.error}</strong> error(s).
              </p>
              {summary.skipped + summary.error > 0 && (
                <button
                  type="button"
                  onClick={copyFailedRows}
                  className="text-sm underline hover:text-accent"
                >
                  {copyLabel}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
