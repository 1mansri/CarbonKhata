import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var prismaClient: PrismaClient | undefined;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Use your Neon pooled connection string (see .env.example).",
    );
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

// Next.js dev-mode hot reload creates a new module instance per edit, which
// would otherwise leak DB connections. Cache on `globalThis` in dev only.
export const prisma = globalThis.prismaClient ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaClient = prisma;
}
