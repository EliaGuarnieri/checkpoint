"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Schema } from "effect";
import {
  ArrowUpRightIcon,
  LoaderCircleIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { GameCover } from "~/components/game-cover";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { fetchJson } from "~/lib/api";
import {
  CatalogGamePreviewSchema,
  type CatalogGamePreview,
} from "~/modules/catalog/model";
import { LibraryGameSchema } from "~/modules/library/model";

const LibraryResponse = Schema.Array(LibraryGameSchema);
const CatalogResponse = Schema.Array(CatalogGamePreviewSchema);
const AddedResponse = Schema.Struct({
  added: Schema.Literal(true),
  id: Schema.String,
});

export function GlobalSearch() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  useEffect(() => {
    const focusShortcut = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        event.key !== "/" ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      )
        return;
      event.preventDefault();
      input.current?.focus();
    };
    document.addEventListener("keydown", focusShortcut);
    return () => document.removeEventListener("keydown", focusShortcut);
  }, []);

  const library = useQuery({
    queryKey: ["library", "all"],
    queryFn: () => fetchJson(LibraryResponse, "/api/library"),
    enabled: open && query.trim().length > 0,
  });
  const catalog = useQuery({
    queryKey: ["catalog-search", debouncedQuery],
    queryFn: () =>
      fetchJson(
        CatalogResponse,
        `/api/catalog/search?query=${encodeURIComponent(debouncedQuery)}`,
      ),
    enabled: open && debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
  const add = useMutation({
    mutationFn: async (game: CatalogGamePreview) => {
      const added = await fetchJson(AddedResponse, "/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: game.id }),
      });
      return added.id;
    },
    onSuccess: async (id) => {
      await queryClient.invalidateQueries({ queryKey: ["library"] });
      setOpen(false);
      setQuery("");
      router.push(`/games/${id}`);
    },
  });

  const normalized = query.trim().toLocaleLowerCase("it");
  const libraryMatches = (library.data ?? [])
    .filter((game) => game.title.toLocaleLowerCase("it").includes(normalized))
    .slice(0, 5);
  const findOwned = (game: CatalogGamePreview) =>
    (library.data ?? []).find(
      (entry) => entry.rawgId === Number(game.id) || entry.slug === game.slug,
    );
  const catalogMatches = (catalog.data ?? []).slice(0, 6);
  const catalogPending =
    query.trim() !== debouncedQuery || catalog.isFetching || catalog.isLoading;
  const showPanel = open && query.trim().length > 0;

  return (
    <div
      className="relative col-span-2 row-start-2 min-w-0 lg:col-span-1 lg:row-start-auto"
      ref={root}
    >
      <div className="relative text-muted-foreground">
        <SearchIcon
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2"
        />
        <Input
          ref={input}
          id="global-search"
          type="search"
          autoComplete="off"
          aria-label="Cerca un gioco nella libreria e nel catalogo RAWG"
          placeholder="Cerca un gioco o aggiungilo…"
          className="h-10 w-full bg-card pr-12 pl-10 text-foreground"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              input.current?.blur();
            }
            const exactMatch = libraryMatches.find(
              (game) => game.title.toLocaleLowerCase("it") === normalized,
            );
            if (event.key === "Enter" && exactMatch) {
              setOpen(false);
              router.push(`/games/${exactMatch.id}`);
            }
          }}
        />
        <kbd
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border border-border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
        >
          /
        </kbd>
      </div>
      {showPanel && (
        <section
          id="global-search-results"
          className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 max-h-[min(70vh,620px)] overflow-y-auto rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-xl"
          aria-label="Risultati di ricerca"
        >
          {library.isError && (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              La libreria non è disponibile. Riprova tra poco.
            </p>
          )}
          {libraryMatches.length > 0 && (
            <section className="py-1">
              <h2 className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                Nella tua libreria
              </h2>
              {libraryMatches.map((game) => (
                <button
                  key={game.id}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left outline-none hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => {
                    setOpen(false);
                    router.push(`/games/${game.id}`);
                  }}
                >
                  <span className="relative aspect-[3/2] w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                    <GameCover
                      title={game.title}
                      coverUrl={game.coverUrl}
                      rawgId={game.rawgId}
                      sizes="128px"
                    />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <strong className="truncate text-sm font-medium">
                      {game.title}
                    </strong>
                    <small className="truncate text-xs text-muted-foreground">
                      {game.developers[0] ?? "Nella libreria"}
                    </small>
                  </span>
                  <ArrowUpRightIcon
                    size={17}
                    className="shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </button>
              ))}
            </section>
          )}
          {debouncedQuery.length >= 2 && (
            <section className="border-t border-border py-1">
              <h2 className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                Catalogo RAWG
              </h2>
              {catalogPending ? (
                <p className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                  <LoaderCircleIcon className="animate-spin" size={16} /> Cerco
                  nel catalogo…
                </p>
              ) : catalog.isError ? (
                <p className="px-3 py-3 text-sm text-muted-foreground">
                  Catalogo non disponibile. Riprova tra poco.
                </p>
              ) : catalogMatches.length ? (
                catalogMatches.map((game) => {
                  const ownedId = findOwned(game)?.id;
                  return (
                    <div
                      key={game.id}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent"
                    >
                      <span className="relative aspect-[3/2] w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                        <GameCover
                          title={game.title}
                          coverUrl={game.coverUrl}
                          sizes="128px"
                        />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <strong className="truncate text-sm font-medium">
                          {game.title}
                        </strong>
                        <small className="text-xs text-muted-foreground">
                          {game.releaseDate?.slice(0, 4) ?? "Catalogo RAWG"}
                        </small>
                      </span>
                      {library.isLoading || library.isError ? (
                        <span className="text-xs text-muted-foreground">
                          Verifica…
                        </span>
                      ) : ownedId ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setOpen(false);
                            router.push(`/games/${ownedId}`);
                          }}
                        >
                          Apri <ArrowUpRightIcon size={15} aria-hidden="true" />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={add.isPending}
                          onClick={() => add.mutate(game)}
                          aria-label={`Aggiungi ${game.title} alla libreria`}
                        >
                          <PlusIcon size={15} aria-hidden="true" /> Aggiungi
                        </Button>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="px-3 py-3 text-sm text-muted-foreground">
                  Nessun gioco trovato nel catalogo.
                </p>
              )}
            </section>
          )}
          {query.trim().length < 2 && (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              Scrivi almeno 2 caratteri per cercare anche nel catalogo.
            </p>
          )}
          {add.isError && (
            <p className="px-3 py-3 text-sm text-destructive">
              Il gioco non è stato aggiunto. Riprova.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
