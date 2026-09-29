import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { GlobalSearch } from "~/components/global-search";
import { Separator } from "~/components/ui/separator";
import { ThemeSelector } from "~/components/theme-selector";

export function AppShell({ children }: { readonly children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="mx-auto grid w-full max-w-362.5 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6 lg:grid-cols-[auto_minmax(20rem,1fr)_auto] lg:gap-8 lg:px-10">
          <Link
            href="/library"
            className="inline-flex items-center gap-3 text-lg font-semibold tracking-tight text-foreground outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Checkpoint, vai alla libreria"
          >
            <Image
              src="/icon.svg"
              alt=""
              width={36}
              height={36}
              unoptimized
              className="size-9"
            />
            <span>checkpoint</span>
          </Link>
          <GlobalSearch />
          <div className="flex items-center">
            <ThemeSelector />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-362.5 flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
        {children}
      </main>
      <footer className="mx-auto w-full max-w-362.5 px-4 pb-6 sm:px-6 lg:px-10">
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
