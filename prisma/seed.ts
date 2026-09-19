import { PrismaActivityRepository } from "@/lib/repositories/prisma-activity-repository";
import { SyncService } from "@/lib/services/sync-service";
import { ClimateTraceAdapter } from "@/lib/sources/climatetrace";
import { EmberAdapter } from "@/lib/sources/ember";

async function main() {
  const repository = new PrismaActivityRepository();
  const sync = new SyncService(repository);

  const result = await sync.sync(new ClimateTraceAdapter());
  console.log(`Synced ${result.activityCount} activities from ${result.source}.`);

  const emberApiKey = process.env.EMBER_API_KEY;
  if (emberApiKey) {
    const emberResult = await sync.sync(new EmberAdapter(emberApiKey));
    console.log(`Synced ${emberResult.activityCount} activities from ${emberResult.source}.`);
  } else {
    console.log(
      "EMBER_API_KEY not set — skipping Ember sync. Register a free key at https://ember-energy.org/data/api/ and add it to .env.",
    );
  }
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
