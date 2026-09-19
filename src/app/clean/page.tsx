import { Sparkles } from "lucide-react";

export default function CleanPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <Sparkles className="size-10 text-primary" />
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Upload &amp; clean your data
      </h1>
      <p className="max-w-md text-muted-foreground">
        The upload and cleaning tool is coming next — you&apos;ll be able to
        drop in a CSV/XLSX file and download a cleaned version.
      </p>
    </div>
  );
}
