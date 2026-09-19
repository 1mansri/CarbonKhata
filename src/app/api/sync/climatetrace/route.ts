import { NextResponse } from "next/server";
import { PrismaActivityRepository } from "@/lib/repositories/prisma-activity-repository";
import { SyncService } from "@/lib/services/sync-service";
import { ClimateTraceAdapter } from "@/lib/sources/climatetrace";
import { fuzzySearchService } from "@/lib/services/fuzzy-search-singleton";

export async function POST() {
  try {
    const sync = new SyncService(new PrismaActivityRepository());
    const result = await sync.sync(new ClimateTraceAdapter());
    fuzzySearchService.invalidate();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 502 },
    );
  }
}
