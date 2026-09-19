# LCA Data Portal

A BTP (thesis) project: search an activity, get its LCA-relevant impact
data, and clean your own datasets — built entirely on live, self-serve
public APIs (no manually-downloaded files, no ecoinvent access; see
[Data sources](#data-sources) below).

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
  `DataSourceAdapter` (`datagovin.ts`, `climatetrace.ts`). Adding a new
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
doesn't have institutional access — its API can't be called without one,
so there's no self-serve way in. If that changes, add an
`EcoinventAdapter` implementing `DataSourceAdapter` in
`src/lib/sources/` — nothing else in the app needs to change.

Every source below is a genuinely live, self-serve public API (no
manual file downloads, no sales contact required to get a key):

| Source | Fetch mode | What it provides |
|---|---|---|
| [data.gov.in](https://data.gov.in) (CPCB) | Live API, free self-serve key, refreshable via `/sources` or `POST /api/sync/cpcb` | Real-time CPCB CAAQMS air-quality readings (PM2.5, NO2, SO2, CO, ...) per monitoring station across India |
| [Climate TRACE](https://climatetrace.org) | Live API, **no key needed**, refreshable via `/sources` or `POST /api/sync/climatetrace` | Asset-level global emissions inventory (CC BY 4.0) — real named facilities (cement plants, steel mills, aluminum smelters, refineries, power stations, ...) across nearly every industrial/agriculture/land-use sector in India, each with a real emissions factor, plus a sector-level aggregate per (sector, asset type) |

Sources considered and rejected for not being genuinely self-serve APIs:
**Climatiq** (emission-factor API closest in spirit to ecoinvent, but API
access requires contacting sales — no self-serve key) and **DEFRA/CEA**
(authoritative but published as an annual downloadable file release, not
an API).

## Scripts

- `pnpm dev` / `pnpm build` / `pnpm start`
- `pnpm lint`
- `pnpm prisma db seed` — sync all configured sources into the dev database
- `pnpm prisma studio` — browse the local SQLite database
