import Form from "next/form";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SteelRoutes } from "@/components/home/steel-routes";
import { DRAFT_MAX_CHARS } from "@/lib/lca/ai-draft";
import { ProjectList } from "@/components/home/project-list";
import { Templates } from "@/components/home/templates";
import { BRAND } from "@/lib/brand";
import { INDIA_SOURCES } from "@/data/lca/india-materials";

/** Distinct EPD documents (one EPD can declare several products). */
const EPD_DOCUMENTS = new Set(
  INDIA_SOURCES.map((s) => s.bibtex.fields.number).filter(Boolean),
).size;

export default function Home() {
  return (
    <div className="flex flex-col gap-14">
      <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="space-y-5">
          <h1 className="display max-w-xl text-4xl leading-[1.05] font-semibold text-balance sm:text-5xl">
            Every kilogram of carbon, accounted for.
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">{BRAND.tagline}</p>
          <p className="max-w-md text-sm">
            {EPD_DOCUMENTS} Indian manufacturer EPDs, CEA grid data and Ministry of Steel routes. No login, nothing
            uploaded.
          </p>
          {/* Plain GET form: /import?describe=… drafts the inventory on arrival. */}
          <Form action="/import" className="flex max-w-md gap-2">
            <input
              name="describe"
              required
              maxLength={DRAFT_MAX_CHARS}
              aria-label="Describe what you're building"
              placeholder="Describe it: 230 mm brick wall, 10 m²"
              className="h-10 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Button type="submit" className="h-10 shrink-0">
              <Sparkles />
              Draft
            </Button>
          </Form>
        </div>
        <SteelRoutes />
      </section>

      <ProjectList />
      <Templates />
    </div>
  );
}
