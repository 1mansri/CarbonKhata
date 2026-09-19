import { NextResponse } from "next/server";
import { PrismaActivityRepository } from "@/lib/repositories/prisma-activity-repository";
import { SearchService } from "@/lib/services/search-service";
import { ExportService } from "@/lib/services/export-service";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "json" ? "json" : "csv";

  const service = new SearchService(new PrismaActivityRepository());
  const activity = await service.getById(id);

  if (!activity) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const exportService = new ExportService();
  const filename = `${slugify(activity.name)}.${format}`;

  const body =
    format === "csv"
      ? exportService.toCsv([activity])
      : exportService.toJson([activity]);
  const contentType = format === "csv" ? "text/csv" : "application/json";

  return new NextResponse(body, {
    headers: {
      "Content-Type": `${contentType}; charset=utf-8`,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
