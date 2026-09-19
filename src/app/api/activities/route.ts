import { NextResponse } from "next/server";
import { PrismaActivityRepository } from "@/lib/repositories/prisma-activity-repository";
import { SearchService } from "@/lib/services/search-service";
import { fuzzySearchService } from "@/lib/services/fuzzy-search-singleton";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? undefined;

  if (category) {
    const service = new SearchService(new PrismaActivityRepository());
    const activities = await service.search({ query: query || undefined, category, limit: 60 });
    return NextResponse.json({ activities, exactMatch: true });
  }

  const { activities, exactMatch } = await fuzzySearchService.search(query, 60);
  return NextResponse.json({ activities, exactMatch });
}
