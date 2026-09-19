import { CleanView } from "@/components/clean/clean-view";

export default function CleanPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Upload &amp; clean your data
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Drop in a CSV or Excel file. We trim whitespace, normalize common
          units, remove exact duplicate rows, and flag missing values — then
          you can download the cleaned result.
        </p>
      </div>
      <CleanView />
    </div>
  );
}
