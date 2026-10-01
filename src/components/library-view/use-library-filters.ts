import { useMemo, useState } from "react";

import type { LibraryGame, TrackingStatus } from "~/modules/library/model";
import { filterLibraryGames } from "~/modules/library/query";

import { statusLabels, type Sort } from "./filter-options";

export interface LibraryViewFilters {
  readonly query: string;
  readonly status: TrackingStatus | "all";
  readonly genre: string;
  readonly developer: string;
  readonly publisher: string;
  readonly minimumRating: number;
  readonly sort: Sort;
}

export interface ActiveFilter {
  readonly label: string;
  readonly value: string;
}

const initialFilters: LibraryViewFilters = {
  query: "",
  status: "all",
  genre: "",
  developer: "",
  publisher: "",
  minimumRating: 0,
  sort: "updated",
};

const emptyEntries: ReadonlyArray<LibraryGame> = [];

export function useLibraryFilters(
  entries: ReadonlyArray<LibraryGame> = emptyEntries,
) {
  const [filters, setFilters] = useState(initialFilters);
  const { query, status, genre, developer, publisher, minimumRating, sort } =
    filters;
  const entriesMatchingNonStatusCriteria = useMemo(
    () =>
      filterLibraryGames(entries, {
        query,
        genre,
        developer,
        publisher,
        minimumRating,
      }),
    [entries, query, genre, developer, publisher, minimumRating],
  );
  const visibleEntries = useMemo(
    () =>
      filterLibraryGames(entriesMatchingNonStatusCriteria, {
        status: status === "all" ? undefined : status,
        sort,
      }),
    [entriesMatchingNonStatusCriteria, status, sort],
  );
  const activeFilters = [
    ...(status === "all"
      ? []
      : [{ label: "Stato", value: statusLabels[status] }]),
    ...(query ? [{ label: "Titolo", value: query }] : []),
    ...(genre ? [{ label: "Genere", value: genre }] : []),
    ...(developer ? [{ label: "Sviluppatore", value: developer }] : []),
    ...(publisher ? [{ label: "Publisher", value: publisher }] : []),
    ...(minimumRating
      ? [{ label: "Voto minimo", value: `${minimumRating}/10` }]
      : []),
  ];

  const change = (fields: Partial<LibraryViewFilters>) => {
    setFilters((previous) => ({ ...previous, ...fields }));
  };
  const resetFilters = () => {
    setFilters((previous) => ({ ...initialFilters, sort: previous.sort }));
  };

  return {
    filters,
    activeFilters,
    entriesMatchingNonStatusCriteria,
    visibleEntries,
    change,
    resetFilters,
  };
}
