import { NextResponse } from "next/server";
import { PrismaActivityRepository } from "@/lib/repositories/prisma-activity-repository";
import { SyncService } from "@/lib/services/sync-service";
import { DataGovInCpcbAdapter } from "@/lib/sources/datagovin";

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
    const result = await sync.sync(new DataGovInCpcbAdapter(apiKey));
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 502 },
    );
  }
}
