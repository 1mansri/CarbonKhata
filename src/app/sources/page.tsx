import { Database } from "lucide-react";

export default function SourcesPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <Database className="size-10 text-primary" />
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Data sources
      </h1>
      <p className="max-w-md text-muted-foreground">
        Provenance and licensing details for every dataset in the portal will
        be listed here.
      </p>
    </div>
  );
}
