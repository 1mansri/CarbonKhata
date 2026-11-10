import { BRAND } from "@/lib/brand";

/**
 * Bricks resting on a rocker: the building held from its cradle.
 * Same geometry as the favicon (src/app/icon.svg).
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        d="M2.5 14.5Q12 23.5 21.5 14.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <g fill="currentColor">
        <rect x="5.5" y="10.25" width="6" height="4" rx="0.9" />
        <rect x="12.5" y="10.25" width="6" height="4" rx="0.9" />
        <rect x="9" y="5.25" width="6" height="4" rx="0.9" opacity="0.55" />
      </g>
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-baseline gap-2">
      <span className="display text-[1.05rem] font-semibold tracking-tight">{BRAND.name}</span>
    </span>
  );
}
