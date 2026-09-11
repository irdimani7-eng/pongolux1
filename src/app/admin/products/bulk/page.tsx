import { BulkImportForm } from "@/components/admin/bulk-import-form";

export default function BulkImportPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-(family-name:--font-display) text-3xl">
        Bulk import
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Add many listings at once from a CSV plus a folder of photos — no
        need to send files over chat. Same format as
        product-intake-template.csv: one row per item, one photo subfolder
        per SKU. Re-importing the same SKU updates that listing in place
        (photos are fully replaced) rather than creating a duplicate, so
        it&apos;s always safe to fix a row and run the import again.
      </p>
      <div className="mt-8">
        <BulkImportForm />
      </div>
    </div>
  );
}
