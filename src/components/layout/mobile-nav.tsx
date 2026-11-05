"use client";

import { useState } from "react";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NavLink } from "@/components/layout/nav-link";
import { navLinks } from "@/components/layout/nav-links";
import { LogoMark, Wordmark } from "@/components/layout/logo";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden" />
        }
      >
        <MenuIcon />
        <span className="sr-only">Open menu</span>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <LogoMark className="size-5 text-primary" />
            <Wordmark />
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-4 px-4">
          {navLinks.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              className="text-base"
              onNavigate={() => setOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
