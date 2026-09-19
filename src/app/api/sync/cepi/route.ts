import { NextResponse } from "next/server";
import { PrismaActivityRepository } from "@/lib/repositories/prisma-activity-repository";
import { SyncService } from "@/lib/services/sync-service";
import { CepiAdapter } from "@/lib/sources/cepi";
import { fuzzySearchService } from "@/lib/services/fuzzy-search-singleton";

export async function POST() {
  const apiKey = process.env.DATA_GOV_IN_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "DATA_GOV_IN_API_KEY is not set. Register a free key at https://data.gov.in and add it to .env.",
      },
      { status: 400 },
    );
  }

  try {
    const sync = new SyncService(new PrismaActivityRepository());
    const result = await sync.sync(new CepiAdapter(apiKey));
    fuzzySearchService.invalidate();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 502 },
    );
  }
}
