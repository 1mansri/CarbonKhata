import { SteelRoutes } from "@/components/home/steel-routes";
import { CarbonScaleFigure } from "@/components/figures/carbon-scale/figure";
import { HomeDescribe } from "@/components/home/home-describe";
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
    <div className="flex flex-col gap-14 sm:gap-16">
      <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="space-y-6">
          <h1 className="display max-w-xl text-hero font-semibold">Every kilogram of carbon, accounted for.</h1>
          <div className="max-w-md space-y-2">
            <p className="text-lg text-muted-foreground">{BRAND.tagline}</p>
            <p className="text-sm">
              {EPD_DOCUMENTS} Indian EPDs, CEA grid data and Ministry of Steel routes. No login; projects stay in your
              browser.
            </p>
          </div>
          <div className="max-w-md">
            <HomeDescribe />
          </div>
        </div>
        <CarbonScaleFigure />
      </section>

      <ProjectList />
      <Templates />
      <section className="max-w-2xl space-y-4">
        <div className="space-y-1">
          <h2 className="text-heading font-semibold">Steel depends on how it&apos;s made</h2>
          <p className="text-sm text-muted-foreground">The same tonne of steel, by production route.</p>
        </div>
        <SteelRoutes />
      </section>
    </div>
  );
}
