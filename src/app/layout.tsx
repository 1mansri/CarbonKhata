import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Mukta } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "@/components/providers";
import { BRAND } from "@/lib/brand";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

const mukta = Mukta({
  variable: "--font-mukta",
  subsets: ["devanagari"],
  weight: "600",
});

/** The data voice: module codes, units, citations, column labels. */
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

/** Set NEXT_PUBLIC_SITE_URL on the host so link previews use the real domain. */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: { default: `${BRAND.name}: embodied carbon for Indian construction`, template: `%s · ${BRAND.name}` },
  description: BRAND.description,
  applicationName: BRAND.name,
  authors: [{ name: BRAND.author }],
  creator: BRAND.author,
  category: "science",
  keywords: [
    "embodied carbon",
    "life cycle assessment",
    "LCA",
    "GWP",
    "EN 15804",
    "ISO 14040",
    "EPD",
    "Indian construction",
    "bill of quantities",
    "cradle to grave",
  ],
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    locale: "en_IN",
    title: BRAND.name,
    description: BRAND.tagline,
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.name,
    description: BRAND.tagline,
  },
};

export const viewport: Viewport = {
  // Lets the phone total bar sit above the home indicator (safe-area insets).
  viewportFit: "cover",
  themeColor: "#e8d2b5",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${mukta.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
