"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Schema } from "effect";

import { fetchJson } from "~/lib/api";

import { LibraryGameSchema, type LibraryEntryUpdate } from "./model";

const LibraryResponse = Schema.Array(LibraryGameSchema);
const AddedResponse = Schema.Struct({
  added: Schema.Literal(true),
  id: Schema.String,
});
const UpdatedResponse = Schema.Struct({ updated: Schema.Literal(true) });
const RemovedResponse = Schema.Struct({ removed: Schema.Literal(true) });

const libraryKeys = {
  lists: ["library"] as const,
  list: ["library", "all"] as const,
  entry: (entryId: string) => ["library-game", entryId] as const,
};

export function useLibraryEntries({
  enabled = true,
}: { readonly enabled?: boolean } = {}) {
  return useQuery({
    queryKey: libraryKeys.list,
    queryFn: () => fetchJson(LibraryResponse, "/api/library"),
    enabled,
  });
}

export function useLibraryEntry(entryId: string) {
  return useQuery({
    queryKey: libraryKeys.entry(entryId),
    queryFn: () => fetchJson(LibraryGameSchema, `/api/library/${entryId}`),
  });
}

export function useAddLibraryEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (catalogGameId: string) => {
      const added = await fetchJson(AddedResponse, "/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: catalogGameId }),
      });
      return added.id;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: libraryKeys.lists });
    },
  });
}

export function useUpdateLibraryEntry(entryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (update: LibraryEntryUpdate) =>
      fetchJson(UpdatedResponse, `/api/library/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: libraryKeys.lists }),
        queryClient.invalidateQueries({ queryKey: libraryKeys.entry(entryId) }),
      ]);
    },
  });
}

export function useRemoveLibraryEntry(entryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchJson(RemovedResponse, `/api/library/${entryId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: libraryKeys.lists });
    },
  });
}

export function useRefreshLibraryEntryMetadata(entryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchJson(LibraryGameSchema, `/api/library/${entryId}/refresh`, {
        method: "POST",
      }),
    onSuccess: async (refreshed) => {
      queryClient.setQueryData(libraryKeys.entry(entryId), refreshed);
      await queryClient.invalidateQueries({ queryKey: libraryKeys.lists });
    },
  });
}
