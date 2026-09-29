import { LibraryIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { GlobalSearch } from "~/components/global-search";
import { buttonVariants } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { ThemeSelector } from "~/components/theme-selector";
import { cn } from "cn";

export function AppShell({ children }: { readonly children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto grid w-full max-w-[1450px] grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6 lg:grid-cols-[auto_minmax(20rem,1fr)_auto] lg:gap-8 lg:px-10">
          <Link
            href="/library"
            className="inline-flex items-center gap-3 text-lg font-semibold tracking-tight text-foreground outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Checkpoint, vai alla libreria"
          >
            <span
              className="grid size-9 place-items-center rounded-lg bg-primary text-base font-bold text-primary-foreground"
              aria-hidden="true"
            >
              C.
            </span>
            <span>checkpoint</span>
          </Link>
          <GlobalSearch />
          <nav
            className="flex items-center gap-2"
            aria-label="Navigazione principale"
          >
            <Link
              href="/library"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "hidden sm:inline-flex",
              )}
            >
              <LibraryIcon data-icon="inline-start" />
              Libreria
            </Link>
            <ThemeSelector />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1450px] flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
        {children}
      </main>
      <footer className="mx-auto w-full max-w-[1450px] px-4 pb-6 sm:px-6 lg:px-10">
        <Separator className="mb-5" />
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Checkpoint · Il tuo diario di gioco</span>
          <a href="https://rawg.io" target="_blank" rel="noreferrer">
            Game data provided by RAWG
          </a>
        </div>
      </footer>
    </div>
  );
}
