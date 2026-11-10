import { AiDraft } from "@/components/import/ai-draft";
import { BoqImport } from "@/components/import/boq-import";

export const metadata = { title: "New project" };

export default async function ImportPage({ searchParams }: PageProps<"/import">) {
  const { describe } = await searchParams;
  const initial = typeof describe === "string" ? describe : "";

  return (
    <div className="flex max-w-5xl flex-col gap-10">
      <section className="space-y-4">
        <div className="space-y-2">
          <h1 className="display text-3xl font-semibold">Describe what you&apos;re building</h1>
          <p className="max-w-2xl text-muted-foreground">
            AI drafts the components and quantities; you check each line and add anything it missed.
          </p>
        </div>
        <AiDraft key={initial} initial={initial} />
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="display text-2xl font-semibold">Or import a bill of quantities</h2>
          <p className="max-w-2xl text-muted-foreground">
            Drop a BoQ spreadsheet. Each row is cleaned, matched to a library material, and waits for your review.
          </p>
        </div>
        <BoqImport />
      </section>
    </div>
  );
}
