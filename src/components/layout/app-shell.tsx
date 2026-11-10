import Link from "next/link";
import { NavLink } from "@/components/layout/nav-link";
import { MobileNav } from "@/components/layout/mobile-nav";
import { navLinks } from "@/components/layout/nav-links";
import { LogoMark, Wordmark } from "@/components/layout/logo";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/75 print:hidden">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-8 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 text-foreground">
            <LogoMark className="size-6 text-primary" />
            <Wordmark />
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <NavLink key={link.href} href={link.href}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <MobileNav />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8 print:max-w-none print:p-0">
        {children}
      </main>
    </div>
  );
}
