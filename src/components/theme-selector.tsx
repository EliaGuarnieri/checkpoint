"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeSelector() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Tema scuro"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="group inline-flex h-10 items-center rounded-full p-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="relative flex h-8 w-16 items-center rounded-full border border-border bg-muted transition-colors duration-200 group-hover:bg-accent">
        <span className="absolute top-0.5 left-0.5 size-6.5 rounded-full bg-background shadow-sm transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none dark:translate-x-8 dark:bg-primary" />
        <SunIcon
          aria-hidden="true"
          className="relative z-10 ml-1.75 size-4 text-primary transition-colors duration-200 dark:text-muted-foreground"
        />
        <MoonIcon
          aria-hidden="true"
          className="relative z-10 ml-4 size-4 text-muted-foreground transition-colors duration-200 dark:text-primary-foreground"
        />
      </span>
    </button>
  );
}
