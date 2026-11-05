import type { Metadata } from "next";
import { Archivo, Mukta } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "@/components/providers";
import { BRAND } from "@/lib/brand";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
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

export const metadata: Metadata = {
  title: { default: BRAND.name, template: `%s · ${BRAND.name}` },
  description: BRAND.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${mukta.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Sets data-theme before first paint so there's no light/dark flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
