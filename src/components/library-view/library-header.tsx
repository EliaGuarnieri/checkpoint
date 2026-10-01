import { PlusIcon } from "lucide-react";

import { Button } from "~/components/ui/button";

export function LibraryHeader({
  onAddGame,
}: {
  readonly onAddGame: () => void;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 gap-y-3 border-b border-border pb-4 sm:flex sm:items-end sm:justify-between sm:gap-4">
      <div className="contents sm:block">
        <h1 className="col-start-1 row-start-1 text-[2rem] leading-tight font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          La tua libreria<span className="text-primary">.</span>
        </h1>
        <p className="col-span-2 row-start-2 max-w-[65ch] text-sm leading-relaxed text-muted-foreground sm:mt-3 sm:text-base">
          Ogni gioco, al suo posto. I tuoi progressi e le tue impressioni,
          sempre a portata di mano.
        </p>
      </div>
      <Button
        onClick={onAddGame}
        size="lg"
        aria-label="Aggiungi un gioco"
        className="col-start-2 row-start-1 h-11 shrink-0 self-start sm:h-9 sm:self-auto"
      >
        <PlusIcon data-icon="inline-start" /> Aggiungi
        <span className="hidden sm:inline">un gioco</span>
      </Button>
    </header>
  );
}
