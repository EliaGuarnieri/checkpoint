"use client";

import { useQuery } from "@tanstack/react-query";
import { Schema } from "effect";

import { fetchJson } from "~/lib/api";

import { CatalogGamePreviewSchema } from "./model";

const CatalogResponse = Schema.Array(CatalogGamePreviewSchema);

export function useCatalogSearch(
  query: string,
  { enabled = true }: { readonly enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["catalog-search", query],
    queryFn: () =>
      fetchJson(
        CatalogResponse,
        `/api/catalog/search?query=${encodeURIComponent(query)}`,
      ),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}
