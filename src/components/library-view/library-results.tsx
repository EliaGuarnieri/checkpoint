import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import type { LibraryGame } from "~/modules/library/model";

import { LibraryEntryCard } from "./library-entry-card";

export function LibraryResults({
  isLoading,
  isError,
  hasEntries,
  entries,
  onReset,
  onSearch,
}: {
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly hasEntries: boolean;
  readonly entries: ReadonlyArray<LibraryGame>;
  readonly onReset: () => void;
  readonly onSearch: () => void;
}) {
  return isLoading ? (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="aspect-[0.95] rounded-xl" />
      ))}
    </div>
  ) : isError ? null : entries.length ? (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {entries.map((game) => (
        <LibraryEntryCard key={game.id} game={game} />
      ))}
    </div>
  ) : (
    <div className="flex min-h-72 flex-col items-start justify-center rounded-xl border border-dashed border-border bg-card p-8">
      <h3 className="text-xl font-semibold">
        {hasEntries
          ? "Nessun gioco con questi filtri"
          : "La libreria inizia qui"}
      </h3>
      <p className="mt-2 mb-6 text-sm text-muted-foreground">
        {hasEntries
          ? "Prova a cambiare stato o ad azzerare i filtri."
          : "Cerca un titolo e aggiungi il primo gioco alla tua collezione."}
      </p>
      <Button onClick={hasEntries ? onReset : onSearch}>
        {hasEntries ? "Azzera i filtri" : "Cerca un gioco"}
      </Button>
    </div>
  );
}
