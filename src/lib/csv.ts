/** Minimal RFC-4180-ish CSV parser: handles quoted fields with commas.
 * Shared between scripts/import-products.ts (the original CLI bulk-import
 * tool) and the admin "Bulk import" page (src/components/admin/
 * bulk-import-form.tsx), so both read the same product-intake-template.csv
 * format identically — no risk of the two drifting apart on how a quoted
 * field or an embedded comma gets handled. Deliberately has no imports of
 * its own (no "server-only", no Node built-ins) so it can run equally in a
 * Node script, a server action, or directly in the browser. */
export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const parseLine = (line: string): string[] => {
    const fields: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    fields.push(cur);
    return fields;
  };

  const header = parseLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = parseLine(line);
    const row: Record<string, string> = {};
    header.forEach((key, i) => {
      row[key] = (values[i] ?? "").trim();
    });
    return row;
  });
}
