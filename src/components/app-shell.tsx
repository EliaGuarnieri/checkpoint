import { Gamepad2Icon, LibraryIcon, RefreshCcwIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { buttonVariants } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";

export function AppShell({ children }: { readonly children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/library"
            className="flex items-center gap-2 font-semibold"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Gamepad2Icon aria-hidden="true" />
            </span>
            Checkpoint
          </Link>
          <nav
            className="flex items-center gap-2"
            aria-label="Navigazione principale"
          >
            <Link
              href="/library"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              <LibraryIcon data-icon="inline-start" />
              Libreria
            </Link>
            <Link
              href="/import"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <RefreshCcwIcon data-icon="inline-start" />
              Importa
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      <footer className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        <Separator className="mb-6" />
        <p className="text-sm text-muted-foreground">
          {process.env.CATALOG_PROVIDER === "live" ? (
            <a href="https://rawg.io" target="_blank" rel="noreferrer">
              Game data provided by RAWG
            </a>
          ) : (
            "Demo catalog"
          )}
        </p>
      </footer>
    </div>
  );
}
