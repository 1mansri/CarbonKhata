import { SteelRoutes } from "@/components/home/steel-routes";
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
        </div>
        <SteelRoutes />
      </section>

      <ProjectList />
      <Templates />
    </div>
  );
}
