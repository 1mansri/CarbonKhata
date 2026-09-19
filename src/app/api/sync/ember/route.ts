import { NextResponse } from "next/server";
import { PrismaActivityRepository } from "@/lib/repositories/prisma-activity-repository";
import { SyncService } from "@/lib/services/sync-service";
import { EmberAdapter } from "@/lib/sources/ember";
import { fuzzySearchService } from "@/lib/services/fuzzy-search-singleton";

export async function POST() {
  const apiKey = process.env.EMBER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "EMBER_API_KEY is not set. Register a free key at https://ember-energy.org/data/api/ and add it to .env.",
      },
      { status: 400 },
    );
  }

  try {
    const sync = new SyncService(new PrismaActivityRepository());
    const result = await sync.sync(new EmberAdapter(apiKey));
    fuzzySearchService.invalidate();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 502 },
    );
  }
}
