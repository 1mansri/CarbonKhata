"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Numeric input that lets you type freely ("0.", "1e3", "") and only
 * commits finite, non-negative numbers. Shows the committed value again
 * when focus leaves.
 */
export function NumberInput({
  value,
  onChange,
  className,
  min = 0,
  ...props
}: Omit<React.ComponentProps<"input">, "value" | "onChange" | "type" | "min"> & {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      value={draft ?? (value == null ? "" : String(value))}
      onChange={(e) => {
        setDraft(e.target.value);
        const text = e.target.value.trim();
        if (text === "") return onChange(undefined);
        const n = Number(text);
        if (Number.isFinite(n) && n >= min) onChange(n);
      }}
      onBlur={() => setDraft(null)}
      className={cn(
        "tabular h-8 w-full min-w-0 rounded-md border border-input bg-card px-2 text-right text-sm outline-none transition-[border-color,box-shadow] duration-150 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30",
        className,
      )}
    />
  );
}
