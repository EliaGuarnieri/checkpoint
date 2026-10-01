"use client";

import { useEffect, useRef } from "react";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { useLibraryEntries } from "~/modules/library/hooks";

import { LibraryCollectionHeader } from "./library-collection-header";
import { LibraryFilters } from "./library-filters";
import { LibraryHeader } from "./library-header";
import { LibraryResults } from "./library-results";
import { useLibraryFilters } from "./use-library-filters";

export function LibraryView() {
  const retryFocused = useRef(false);
  const collectionHeading = useRef<HTMLHeadingElement>(null);
  const library = useLibraryEntries();
  useEffect(() => {
    if (library.isSuccess && retryFocused.current) {
      retryFocused.current = false;
      collectionHeading.current?.focus();
    }
  }, [library.isSuccess]);
  const {
    filters,
    activeFilters,
    entriesMatchingNonStatusCriteria,
    visibleEntries,
    change,
    resetFilters,
  } = useLibraryFilters(library.data);
  const countLabel =
    library.isSuccess && library.data
      ? activeFilters.length === 0
        ? `${library.data.length} ${library.data.length === 1 ? "gioco" : "giochi"}`
        : `${visibleEntries.length} di ${library.data.length} ${library.data.length === 1 ? "gioco" : "giochi"}`
      : "— giochi";
  const focusSearch = () => document.getElementById("global-search")?.focus();

  return (
    <div className="space-y-8">
      <LibraryHeader onAddGame={focusSearch} />

      <section className="space-y-4" aria-label="Esplora la libreria">
        <LibraryCollectionHeader
          collectionHeading={collectionHeading}
          countLabel={countLabel}
          sort={filters.sort}
          onSortChange={(sort) => change({ sort })}
        />

        <LibraryFilters
          filters={filters}
          activeFilters={activeFilters}
          entriesMatchingNonStatusCriteria={
            library.isSuccess ? entriesMatchingNonStatusCriteria : undefined
          }
          onChange={change}
          onReset={resetFilters}
        />

        {(library.isError || (library.isLoading && library.isFetched)) && (
          <Alert variant="destructive">
            <AlertTitle>Libreria non disponibile</AlertTitle>
            <AlertDescription className="flex flex-col gap-3">
              <span>
                Non è stato possibile caricare i giochi. Riprova qui senza
                perdere i filtri.
              </span>
              <Button
                onFocus={() => {
                  retryFocused.current = true;
                }}
                onBlur={() => {
                  retryFocused.current = false;
                }}
                type="button"
                variant="outline"
                className="min-h-11 min-w-11 self-start"
                aria-disabled={library.isFetching}
                onClick={() => {
                  if (library.isFetching) return;
                  void library.refetch();
                }}
              >
                {library.isFetching && (
                  <Spinner
                    data-icon="inline-start"
                    aria-hidden="true"
                    className="motion-reduce:animate-none"
                  />
                )}
                {library.isFetching ? "Riprovo…" : "Riprova"}
              </Button>
              <output
                className="sr-only"
                aria-label="Caricamento della libreria"
              >
                {library.isFetching ? "Riprovo…" : "Caricamento non riuscito"}
              </output>
            </AlertDescription>
          </Alert>
        )}
        <LibraryResults
          isLoading={library.isLoading}
          isError={library.isError}
          hasEntries={Boolean(library.data?.length)}
          entries={visibleEntries}
          onReset={resetFilters}
          onSearch={focusSearch}
        />
      </section>
    </div>
  );
}
