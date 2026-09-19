import { PrismaActivityRepository } from "@/lib/repositories/prisma-activity-repository";
import { SyncService } from "@/lib/services/sync-service";
import { DataGovInCpcbAdapter } from "@/lib/sources/datagovin";
import { ClimateTraceAdapter } from "@/lib/sources/climatetrace";
import { CepiAdapter } from "@/lib/sources/cepi";

async function main() {
  const repository = new PrismaActivityRepository();
  const sync = new SyncService(repository);

  const apiKey = process.env.DATA_GOV_IN_API_KEY;
  if (apiKey) {
    const result = await sync.sync(new DataGovInCpcbAdapter(apiKey));
    console.log(`Synced ${result.activityCount} activities from ${result.source}.`);

    const cepiResult = await sync.sync(new CepiAdapter(apiKey));
    console.log(`Synced ${cepiResult.activityCount} activities from ${cepiResult.source}.`);
  } else {
    console.log(
      "DATA_GOV_IN_API_KEY not set — skipping CPCB sync. Register a free key at https://data.gov.in and add it to .env.",
    );
  }

  const climateTraceResult = await sync.sync(new ClimateTraceAdapter());
  console.log(
    `Synced ${climateTraceResult.activityCount} activities from ${climateTraceResult.source}.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$disconnect();
  });
