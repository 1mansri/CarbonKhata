import { PrismaActivityRepository } from "@/lib/repositories/prisma-activity-repository";
import { SyncService } from "@/lib/services/sync-service";
import { ClimateTraceAdapter } from "@/lib/sources/climatetrace";

async function main() {
  const repository = new PrismaActivityRepository();
  const sync = new SyncService(repository);

  const result = await sync.sync(new ClimateTraceAdapter());
  console.log(`Synced ${result.activityCount} activities from ${result.source}.`);
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
