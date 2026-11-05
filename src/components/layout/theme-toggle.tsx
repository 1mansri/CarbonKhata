"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { THEME_STORAGE_KEY } from "@/lib/theme";

type Theme = "light" | "dark";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const getTheme = (): Theme =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => null);
  const next: Theme = theme === "dark" ? "light" : "dark";

  function toggle() {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private mode: the choice just won't persist.
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to graph-sheet theme" : "Switch to blueprint theme"}
      title={theme === "dark" ? "Graph sheet" : "Blueprint"}
    >
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
