import "dotenv/config";
import { defineConfig } from "prisma/config";

// The CLI (migrate, seed, studio) needs Neon's *direct* connection: migrations
// take advisory locks that break through the pooler. The app itself uses the
// pooled DATABASE_URL (src/lib/prisma.ts).
// Left empty when unset so `prisma generate` still works in a build without DB access.
const url = process.env.DIRECT_URL || process.env.DATABASE_URL || "";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url,
  },
});
