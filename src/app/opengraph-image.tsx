import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";

export const alt = `${BRAND.name}: ${BRAND.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CREAM = "#e8d2b5";
const BURGUNDY = "#590907";
const SAGE = "#a5a79b";

/** Link-preview card: the mark, the name, the one-line promise. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: CREAM,
          color: BURGUNDY,
          borderBottom: `24px solid ${BURGUNDY}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <svg width="120" height="120" viewBox="0 0 24 24">
            <path d="M2.5 14.5Q12 23.5 21.5 14.5" fill="none" stroke={BURGUNDY} strokeWidth="2.4" strokeLinecap="round" />
            <rect x="5.5" y="10.25" width="6" height="4" rx="0.9" fill={BURGUNDY} />
            <rect x="12.5" y="10.25" width="6" height="4" rx="0.9" fill={BURGUNDY} />
            <rect x="9" y="5.25" width="6" height="4" rx="0.9" fill={SAGE} />
          </svg>
          <div style={{ fontSize: 104, fontWeight: 700, letterSpacing: -3 }}>{BRAND.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 52, lineHeight: 1.15, maxWidth: 980 }}>{BRAND.tagline}</div>
          <div style={{ fontSize: 28, opacity: 0.75 }}>EN 15804 modules A1–D · ISO 14040/14044 · Indian EPDs</div>
        </div>
      </div>
    ),
    size,
  );
}
