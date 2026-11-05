import { BRAND } from "@/lib/brand";

/** Running-bond brick courses: the most ordinary thing on an Indian site. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <g fill="currentColor">
        <rect x="2" y="4" width="9" height="4.5" rx="1" />
        <rect x="13" y="4" width="9" height="4.5" rx="1" />
        <rect x="-3.5" y="10" width="9" height="4.5" rx="1" opacity="0.55" />
        <rect x="7.5" y="10" width="9" height="4.5" rx="1" />
        <rect x="18.5" y="10" width="9" height="4.5" rx="1" opacity="0.55" />
        <rect x="2" y="16" width="9" height="4.5" rx="1" />
      </g>
      <rect x="13" y="16" width="9" height="4.5" rx="1" fill="var(--brand-accent)" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-baseline gap-2">
      <span className="display text-[1.05rem] font-semibold tracking-tight">{BRAND.name}</span>
      <span lang="hi" className="font-hindi text-xs text-muted-foreground">
        {BRAND.nameHi}
      </span>
    </span>
  );
}
