import { Badge } from "@/components/ui/badge";
import { DATA_KIND_META, type DataKind } from "@/lib/domain/data-kind";

export function DataKindBadge({ dataKind }: { dataKind: DataKind | null }) {
  if (!dataKind) return null;
  const meta = DATA_KIND_META[dataKind];

  return (
    <Badge
      variant={dataKind === "emission-factor" ? "default" : "secondary"}
      title={meta.description}
    >
      {meta.label}
    </Badge>
  );
}
