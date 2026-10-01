"use client";

import { GlobalSearchInput } from "./global-search-input";
import { GlobalSearchPanel } from "./global-search-panel";
import { useGlobalSearch } from "./use-global-search";

export function GlobalSearch() {
  const { root, inputProps, panelProps, open, query, showPanel } =
    useGlobalSearch();

  return (
    <div
      className="relative col-span-2 row-start-2 min-w-0 lg:col-span-1 lg:row-start-auto"
      ref={root}
    >
      <GlobalSearchInput {...inputProps} />
      {open && !query.trim() && (
        <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 rounded-xl border border-border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-xl">
          Cerca nel catalogo per aggiungere un gioco, oppure apri una voce già
          nella tua libreria.
        </div>
      )}
      {showPanel && <GlobalSearchPanel {...panelProps} />}
    </div>
  );
}
