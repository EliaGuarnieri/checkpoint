/* oxlint-disable jsx-a11y/prefer-tag-over-role, jsx-a11y/no-noninteractive-element-to-interactive-role -- The search uses the ARIA combobox pattern with custom game options. */

import { cn } from "cn";
import { LoaderCircleIcon } from "lucide-react";

import { CatalogSearchRecovery } from "./catalog-search-recovery";
import { SearchResultOption } from "./search-result-option";
import type { useGlobalSearch } from "./use-global-search";

type Props = ReturnType<typeof useGlobalSearch>["panelProps"];

export function GlobalSearchPanel({
  query,
  libraryMatches,
  catalogMatches,
  selectedIndex,
  catalogPending,
  catalogRecovery,
  libraryState,
  addingState,
  activateResult,
  retryCatalogProps,
}: Props) {
  return (
    <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 max-h-[min(70vh,620px)] overflow-y-auto rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-xl">
      <section
        id="global-search-results"
        role="listbox"
        aria-label="Risultati di ricerca"
      >
        {libraryState.isError && (
          <p className="px-3 py-3 text-sm text-muted-foreground">
            La libreria non è disponibile. Riprova tra poco.
          </p>
        )}
        {libraryState.isPending && (
          <p className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
            <LoaderCircleIcon
              className="animate-spin"
              size={16}
              aria-hidden="true"
            />
            Cerco nella libreria…
          </p>
        )}
        {libraryMatches.length > 0 && (
          <div
            role="group"
            aria-labelledby="library-search-heading"
            className="py-1"
          >
            <h2
              id="library-search-heading"
              className="px-3 py-2 text-xs font-semibold text-muted-foreground"
            >
              Nella tua libreria · Apri il dettaglio
            </h2>
            {libraryMatches.map((game, index) => (
              <SearchResultOption
                key={game.id}
                result={{ kind: "library", game }}
                index={index}
                selectedIndex={selectedIndex}
                disabled={addingState.isPending}
                onActivate={activateResult}
              />
            ))}
          </div>
        )}
        {query.trim().length >= 2 && libraryState.isSuccess && (
          <div
            role="group"
            aria-labelledby="catalog-search-heading"
            className={cn("border-border py-1", {
              "border-t": libraryMatches.length > 0,
            })}
          >
            <h2
              id="catalog-search-heading"
              className="px-3 py-2 text-xs font-semibold text-muted-foreground"
            >
              Catalogo · Aggiungi alla libreria
            </h2>
            {catalogPending ? (
              <p className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                <LoaderCircleIcon className="animate-spin" size={16} /> Cerco
                nel catalogo…
              </p>
            ) : catalogRecovery ? null : catalogMatches.length ? (
              catalogMatches.map((game, index) => (
                <SearchResultOption
                  key={game.id}
                  result={{ kind: "catalog", game }}
                  index={libraryMatches.length + index}
                  selectedIndex={selectedIndex}
                  disabled={addingState.isPending}
                  adding={
                    addingState.isPending && addingState.gameId === game.id
                  }
                  onActivate={activateResult}
                />
              ))
            ) : (
              <p className="px-3 py-3 text-sm text-muted-foreground">
                Nessun gioco trovato nel catalogo.
              </p>
            )}
          </div>
        )}
        {query.trim().length < 2 && (
          <p className="px-3 py-3 text-sm text-muted-foreground">
            Scrivi almeno 2 caratteri per cercare anche nel catalogo.
          </p>
        )}
        {addingState.isPending && (
          <p role="status" className="px-3 py-3 text-sm text-muted-foreground">
            Aggiungo {addingState.title} alla libreria…
          </p>
        )}
        {addingState.isError && (
          <p role="alert" className="px-3 py-3 text-sm text-destructive">
            Non siamo riusciti ad aggiungere {addingState.title}. Riprova
            scegliendo il risultato; la ricerca è ancora qui.
          </p>
        )}
      </section>
      {query.trim().length >= 2 &&
        libraryState.isSuccess &&
        catalogRecovery && <CatalogSearchRecovery {...retryCatalogProps} />}
    </div>
  );
}
