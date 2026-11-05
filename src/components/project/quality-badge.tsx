import { QUALITY_META } from "@/lib/lca/quality";
import type { DataQuality } from "@/lib/lca/types";
import { cn } from "@/lib/utils";

/** Indian data reads as solid ink; everything else as an outline. */
export function QualityBadge({ quality, className }: { quality: DataQuality; className?: string }) {
  const meta = QUALITY_META[quality];
  return (
    <span
      title={meta.description}
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[11px] font-medium whitespace-nowrap",
        meta.india
          ? "bg-foreground text-background"
          : "border border-dashed border-muted-foreground/60 text-muted-foreground",
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
