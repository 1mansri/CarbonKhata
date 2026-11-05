import { BoqImport } from "@/components/import/boq-import";

export const metadata = { title: "Import BoQ" };

export default function ImportPage() {
  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <div className="space-y-2">
        <h1 className="display text-3xl font-semibold">Import a bill of quantities</h1>
        <p className="max-w-2xl text-muted-foreground">
          Drop a BoQ spreadsheet. Each row is cleaned, matched to a library material, and waits for your review.
        </p>
      </div>
      <BoqImport />
    </div>
  );
}
