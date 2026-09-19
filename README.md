# LCA Data Portal

A BTP (thesis) project: search an activity, get a real per-unit emission
factor, and clean your own datasets — built entirely on live, self-serve
public APIs (no manually-downloaded files, no ecoinvent access; see
[Data sources](#data-sources) below).

## Stack

- pnpm, Next.js (App Router) + TypeScript, Tailwind CSS
- shadcn/ui (Base UI) for components, TanStack Query for client data fetching
- Prisma ORM 7 (driver-adapter based) + SQLite for local dev

## Getting started

```bash
pnpm install
cp .env.example .env
pnpm prisma db seed    # syncs live Climate TRACE data into dev.db
pnpm dev
```

Open http://localhost:3000. No API key needed.

## Architecture

The codebase is layered so each piece has one reason to change, and new
data sources or cleaning rules can be added without touching existing
code:

- **`src/lib/domain/`** — plain TypeScript interfaces only:
  `DataSourceAdapter` (`fetch()`/`normalize()`), `ActivityRepository`,
  `CleaningRule`. No implementation logic lives here.
- **`src/lib/sources/`** — one adapter per data source implementing
  `DataSourceAdapter` (`climatetrace.ts`). Adding a new source means
  adding a new adapter here — nothing else changes.
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
doesn't have institutional access — its API can't be called without one,
so there's no self-serve way in. If that changes, add an
`EcoinventAdapter` implementing `DataSourceAdapter` in
`src/lib/sources/` — nothing else in the app needs to change.

| Source | Fetch mode | What it provides |
|---|---|---|
| [Climate TRACE](https://climatetrace.org) | Live API, **no key needed**, refreshable via `/sources` or `POST /api/sync/climatetrace` | Asset-level global emissions inventory (CC BY 4.0) — real named facilities (cement plants, steel mills, aluminum smelters, refineries, power stations, ...) across nearly every industrial/agriculture/land-use sector in India, each with a real per-unit emission factor, plus a sector-level aggregate per (sector, asset type) |

This is the only source kept in the product. Two others were built and
then deliberately removed once it became clear they weren't the right
fit — kept here as a record, not as a suggestion to re-add them:

- **CPCB air quality / CEPI (data.gov.in)** — real, live, free, and
  correctly labeled as `regulatory-monitoring` rather than LCA data. But
  ambient monitoring readings and regional pollution scores aren't
  per-unit-of-product data, so they didn't serve this project's actual
  goal (searching for an activity's impact) and just diluted search
  results. Removed.
- **Climatiq** — an emission-factor API closest in spirit to ecoinvent,
  rejected because real API access requires contacting sales, not a
  self-serve key.
- **DEFRA/CEA** — authoritative but published as an annual downloadable
  file release, not an API.

data.gov.in has no catalog/search API to discover which of its ~100k+
datasets have live API access (most are download-only unless the
publishing ministry explicitly enabled one) — each has to be checked
individually on the site itself.

## Scripts

- `pnpm dev` / `pnpm build` / `pnpm start`
- `pnpm lint`
- `pnpm prisma db seed` — sync all configured sources into the dev database
- `pnpm prisma studio` — browse the local SQLite database
