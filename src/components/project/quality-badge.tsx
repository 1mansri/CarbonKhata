import { QUALITY_META } from "@/lib/lca/quality";
import type { DataQuality } from "@/lib/lca/types";
import { cn } from "@/lib/utils";

/** A ledger stamp. Indian data is solid ink; everything else a dashed outline. */
export function QualityBadge({ quality, className }: { quality: DataQuality; className?: string }) {
  const meta = QUALITY_META[quality];
  return (
    <span
      title={meta.description}
      className={cn(
        "stamp",
        meta.india ? "bg-foreground/90 text-background" : "border border-dashed border-muted-foreground/60 text-muted-foreground",
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
