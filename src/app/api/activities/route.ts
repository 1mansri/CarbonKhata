import { NextResponse } from "next/server";
import { PrismaActivityRepository } from "@/lib/repositories/prisma-activity-repository";
import { SearchService } from "@/lib/services/search-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? undefined;
  const category = searchParams.get("category") ?? undefined;

  const service = new SearchService(new PrismaActivityRepository());
  const activities = await service.search({ query, category, limit: 60 });

  return NextResponse.json({ activities });
}
