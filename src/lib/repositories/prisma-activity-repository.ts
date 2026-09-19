import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  ActivityRepository,
  ActivitySearchParams,
} from "@/lib/domain/activity-repository";
import type {
  Activity,
  ActivityData,
  DataSourceInfo,
  DataSourceSummary,
  FetchMode,
} from "@/lib/domain/types";
import type { DataKind } from "@/lib/domain/data-kind";

const activityInclude = {
  source: true,
  indicators: true,
} satisfies Prisma.ActivityInclude;

type ActivityWithRelations = Prisma.ActivityGetPayload<{
  include: typeof activityInclude;
}>;

function toDomain(row: ActivityWithRelations): Activity {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    sector: row.sector,
    unit: row.unit,
    geography: row.geography,
    referenceYear: row.referenceYear,
    description: row.description,
    externalRef: row.externalRef ?? "",
    sourceId: row.sourceId,
    sourceName: row.source.name,
    dataKind: (row.source.dataKind as DataKind | null) ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    indicators: row.indicators.map((indicator) => ({
      indicatorName: indicator.indicatorName,
      value: indicator.value,
      unit: indicator.unit,
      method: indicator.method,
    })),
  };
}

export class PrismaActivityRepository implements ActivityRepository {
  async search({ query, category, limit = 50 }: ActivitySearchParams) {
    const where: Prisma.ActivityWhereInput = {
      ...(category ? { category } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query } },
              { category: { contains: query } },
              { sector: { contains: query } },
            ],
          }
        : {}),
    };

    const rows = await prisma.activity.findMany({
      where,
      include: activityInclude,
      take: limit,
      orderBy: { name: "asc" },
    });

    return rows.map(toDomain);
  }

  async findById(id: string) {
    const row = await prisma.activity.findUnique({
      where: { id },
      include: activityInclude,
    });

    return row ? toDomain(row) : null;
  }

  async listAll() {
    const rows = await prisma.activity.findMany({
      include: activityInclude,
      orderBy: { name: "asc" },
    });

    return rows.map(toDomain);
  }

  async upsertFromSource(source: DataSourceInfo, activities: ActivityData[]) {
    const dataSource = await prisma.dataSource.upsert({
      where: { name: source.name },
      create: {
        name: source.name,
        url: source.url,
        licenseNote: source.licenseNote,
        fetchMode: source.fetchMode,
        dataKind: source.dataKind,
        lastSyncedAt: new Date(),
      },
      update: {
        url: source.url,
        licenseNote: source.licenseNote,
        fetchMode: source.fetchMode,
        dataKind: source.dataKind,
        lastSyncedAt: new Date(),
      },
    });

    let count = 0;
    for (const activity of activities) {
      await prisma.$transaction(async (tx) => {
        const saved = await tx.activity.upsert({
          where: {
            sourceId_externalRef: {
              sourceId: dataSource.id,
              externalRef: activity.externalRef,
            },
          },
          create: {
            name: activity.name,
            category: activity.category,
            sector: activity.sector,
            unit: activity.unit,
            geography: activity.geography,
            referenceYear: activity.referenceYear,
            description: activity.description,
            externalRef: activity.externalRef,
            sourceId: dataSource.id,
          },
          update: {
            name: activity.name,
            category: activity.category,
            sector: activity.sector,
            unit: activity.unit,
            geography: activity.geography,
            referenceYear: activity.referenceYear,
            description: activity.description,
          },
        });

        await tx.impactIndicator.deleteMany({
          where: { activityId: saved.id },
        });
        if (activity.indicators.length > 0) {
          await tx.impactIndicator.createMany({
            data: activity.indicators.map((indicator) => ({
              activityId: saved.id,
              indicatorName: indicator.indicatorName,
              value: indicator.value,
              unit: indicator.unit,
              method: indicator.method,
            })),
          });
        }
      });
      count += 1;
    }

    return count;
  }

  async listSources(): Promise<DataSourceSummary[]> {
    const rows = await prisma.dataSource.findMany({
      include: { _count: { select: { activities: true } } },
      orderBy: { name: "asc" },
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      url: row.url ?? undefined,
      licenseNote: row.licenseNote ?? undefined,
      fetchMode: row.fetchMode as FetchMode,
      dataKind: row.dataKind as DataKind,
      lastSyncedAt: row.lastSyncedAt,
      activityCount: row._count.activities,
    }));
  }
}
