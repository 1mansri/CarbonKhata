import { PrismaActivityRepository } from "@/lib/repositories/prisma-activity-repository";
import { SearchService } from "@/lib/services/search-service";
import { SourceCard } from "@/components/sources/source-card";

// Reads live DB state that changes via the sync button — must not be
// served from Next's static/full-route cache.
export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  const service = new SearchService(new PrismaActivityRepository());
  const sources = await service.listSources();

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Every number here traces back to a real source
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Check the license, the last sync time, and the record count for
          yourself. No source below gives full multi-category LCA results.
          Ecoinvent isn&apos;t included; it needs a paid license this project
          doesn&apos;t have.
        </p>
      </div>

      {sources.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No sources synced yet. Run{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            pnpm prisma db seed
          </code>{" "}
          to pull in live CPCB data.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {sources.map((source) => (
            <SourceCard key={source.id} source={source} />
          ))}
        </div>
      )}
    </div>
  );
}
