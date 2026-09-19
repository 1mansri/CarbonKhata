# LCA Data Portal

A BTP (thesis) project: search an activity, get its LCA-relevant impact
data, and clean your own datasets — built around live CPCB data (no
ecoinvent access; see [Data sources](#data-sources) below).

## Stack

- pnpm, Next.js (App Router) + TypeScript, Tailwind CSS
- shadcn/ui (Base UI) for components, TanStack Query for client data fetching
- Prisma ORM 7 (driver-adapter based) + SQLite for local dev

## Getting started

```bash
pnpm install
cp .env.example .env   # fill in DATA_GOV_IN_API_KEY (see below)
pnpm prisma db seed    # syncs live CPCB data into dev.db
pnpm dev
```

Open http://localhost:3000.

### Getting a data.gov.in API key

The live CPCB adapter needs a free key: register at
[data.gov.in](https://data.gov.in), find it under your account's API
keys, and put it in `.env` as `DATA_GOV_IN_API_KEY`.

## Architecture

The codebase is layered so each piece has one reason to change, and new
data sources or cleaning rules can be added without touching existing
code:

- **`src/lib/domain/`** — plain TypeScript interfaces only:
  `DataSourceAdapter` (`fetch()`/`normalize()`), `ActivityRepository`,
  `CleaningRule`. No implementation logic lives here.
- **`src/lib/sources/`** — one adapter per data source implementing
  `DataSourceAdapter` (currently just `datagovin.ts`). Adding a new
  source means adding a new adapter here — nothing else changes.
- **`src/lib/repositories/`** — `PrismaActivityRepository` implements
  `ActivityRepository`, wrapping all Prisma calls. Services depend on
  the interface, not Prisma directly, so swapping databases or writing
  tests with a fake repository doesn't touch service code.
- **`src/lib/services/`** — `SearchService`, `ExportService`,
  `SyncService` hold business logic. Each has one job.
- **`src/lib/cleaning/`** — the upload/clean pipeline: cleaning
  behaviors are small `CleaningRule` strategy classes
  (`TrimWhitespaceRule`, `NormalizeUnitsRule`, `DedupeExactRowsRule`,
  `FlagMissingValuesRule`) composed by `CleaningPipeline`. Runs entirely
  client-side (no file upload to the server).
- **`src/app/api/`** — route handlers stay thin: parse request → call a
  service → return response.

### Data model

`DataSource` → `Activity` → `ImpactIndicator`, mirroring how
ecoinvent/openLCA structure activities and their exchanges/indicators —
so a real ecoinvent export could be mapped into this schema later
without a schema change.

## Data sources

**Ecoinvent is intentionally not included.** It requires a paid
subscription for both its API and raw data exports, and this project
doesn't have institutional access. If that changes, add an
`EcoinventAdapter` implementing `DataSourceAdapter` in
`src/lib/sources/` — nothing else in the app needs to change.

What's actually wired up:

| Source | Fetch mode | What it provides |
|---|---|---|
| [data.gov.in](https://data.gov.in) (CPCB) | Live (API, refreshable via the "Refresh CPCB data" button on `/sources` or `POST /api/sync/cpcb`) | Real-time CPCB CAAQMS air-quality readings (PM2.5, NO2, SO2, CO, ...) per monitoring station across India |
| [DEFRA UK GHG Conversion Factors](https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting) | Manual annual release, imported once | Per-unit emission factors across materials/fuels/transport/waste — the closest free substitute to ecoinvent's shape |
| [CEA CO2 Baseline Database](https://cea.nic.in/cdm-co2-baseline-database/) | Manual annual release, imported once | India's official electricity grid emission factor |

DEFRA/CEA adapters are not implemented yet — they need their release
files dropped in `data/raw/` first.

## Scripts

- `pnpm dev` / `pnpm build` / `pnpm start`
- `pnpm lint`
- `pnpm prisma db seed` — sync all configured sources into the dev database
- `pnpm prisma studio` — browse the local SQLite database
