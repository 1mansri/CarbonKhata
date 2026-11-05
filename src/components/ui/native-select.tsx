import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Styled native <select>: accessible and touch-friendly on every device. */
export function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <span className={cn("relative inline-flex", className)}>
      <select
        {...props}
        className="h-8 w-full min-w-0 appearance-none rounded-md border border-input bg-card pr-7 pl-2 text-sm outline-none transition-[border-color,box-shadow] duration-150 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-50"
      >
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
    </span>
  );
}
