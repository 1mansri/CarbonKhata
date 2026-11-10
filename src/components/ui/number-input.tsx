"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const big = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const mid = new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 });
const small = new Intl.NumberFormat("en-US", { maximumSignificantDigits: 4 });

/**
 * How a stored number reads while you're not editing it: grouped, and
 * rounded to what a person can take in (345.6327875 → 345.63, 0.000123456
 * → 0.0001235). Editing shows the full stored value, so nothing is lost.
 */
export function formatInput(n: number): string {
  const abs = Math.abs(n);
  return (abs >= 100 ? big : abs >= 1 ? mid : small).format(n);
}

/**
 * Numeric input that lets you type freely ("0.", "1e3", "") and only
 * commits finite, non-negative numbers. 16 px on phones so iOS doesn't
 * zoom in on focus.
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
      value={draft ?? (value == null ? "" : formatInput(value))}
      onFocus={(e) => {
        setDraft(value == null ? "" : String(value));
        props.onFocus?.(e);
      }}
      onChange={(e) => {
        setDraft(e.target.value);
        const text = e.target.value.trim().replace(/,/g, "");
        if (text === "") return onChange(undefined);
        const n = Number(text);
        if (Number.isFinite(n) && n >= min) onChange(n);
      }}
      onBlur={(e) => {
        setDraft(null);
        props.onBlur?.(e);
      }}
      className={cn(
        "tabular h-9 w-full min-w-0 rounded-md border border-input bg-card px-2 text-right text-base outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 sm:h-8 sm:text-sm",
        className,
      )}
    />
  );
}
