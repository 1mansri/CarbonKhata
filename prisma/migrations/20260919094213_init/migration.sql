◇ injected env (2) from .env
Loaded Prisma config from prisma.config.ts.

-- CreateTable
CREATE TABLE "DataSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "licenseNote" TEXT,
    "fetchMode" TEXT NOT NULL,
    "dataKind" TEXT,
    "lastSyncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "sector" TEXT,
    "unit" TEXT NOT NULL,
    "geography" TEXT,
    "referenceYear" INTEGER,
    "description" TEXT,
    "externalRef" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sourceId" TEXT NOT NULL,
    CONSTRAINT "Activity_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImpactIndicator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "indicatorName" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "method" TEXT,
    "activityId" TEXT NOT NULL,
    CONSTRAINT "ImpactIndicator_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DataSource_name_key" ON "DataSource"("name");

-- CreateIndex
CREATE INDEX "Activity_sourceId_idx" ON "Activity"("sourceId");

-- CreateIndex
CREATE INDEX "Activity_name_idx" ON "Activity"("name");

-- CreateIndex
CREATE INDEX "Activity_category_idx" ON "Activity"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_sourceId_externalRef_key" ON "Activity"("sourceId", "externalRef");

-- CreateIndex
CREATE INDEX "ImpactIndicator_activityId_idx" ON "ImpactIndicator"("activityId");

