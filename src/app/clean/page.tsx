import { CleanView } from "@/components/clean/clean-view";
import { BulletList } from "@/components/shared/bullet-list";

export default function CleanPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-3">
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Clean a messy LCA spreadsheet in seconds
        </h1>
        <BulletList
          className="max-w-xl"
          items={[
            "Fixes whitespace, unit mismatches, duplicate rows, and missing values",
            "Runs in your browser. Your file never reaches our server.",
            "Download the cleaned CSV as soon as it finishes",
          ]}
        />
      </div>
      <CleanView />
    </div>
  );
}
