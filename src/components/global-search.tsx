"use client";

/* oxlint-disable jsx-a11y/prefer-tag-over-role, jsx-a11y/no-noninteractive-element-to-interactive-role -- The search uses the ARIA combobox pattern with custom game options. */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "cn";
import { Schema } from "effect";
import {
  ArrowUpRightIcon,
  LoaderCircleIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { GameCover } from "~/components/game-cover";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "~/components/ui/input-group";
import { Kbd, KbdGroup } from "~/components/ui/kbd";
import { fetchJson } from "~/lib/api";
import {
  CatalogGamePreviewSchema,
  type CatalogGamePreview,
} from "~/modules/catalog/model";
import { LibraryGameSchema, type LibraryGame } from "~/modules/library/model";
import { Button } from "./ui/button";

const LibraryResponse = Schema.Array(LibraryGameSchema);
const CatalogResponse = Schema.Array(CatalogGamePreviewSchema);
const AddedResponse = Schema.Struct({
  added: Schema.Literal(true),
  id: Schema.String,
});

type SearchResult =
  | { kind: "library"; game: LibraryGame }
  | { kind: "catalog"; game: CatalogGamePreview };

const subscribePlatform = () => () => {};
const getIsMac = () => !/Windows|Linux|X11/i.test(navigator.userAgent);

export function GlobalSearch() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const isMac = useSyncExternalStore(subscribePlatform, getIsMac, () => true);

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
      if (
        event.key.toLowerCase() !== "k" ||
        event.altKey ||
        event.shiftKey ||
        (isMac
          ? !event.metaKey || event.ctrlKey
          : !event.ctrlKey || event.metaKey)
      )
        return;
      event.preventDefault();
      input.current?.focus();
    };
    document.addEventListener("keydown", focusShortcut);
    return () => document.removeEventListener("keydown", focusShortcut);
  }, [isMac]);

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
  const ownedByRawgId = new Map(
    (library.data ?? [])
      .filter((game) => game.rawgId !== null)
      .map((game) => [game.rawgId, game] as const),
  );
  const ownedBySlug = new Map(
    (library.data ?? []).map((game) => [game.slug, game] as const),
  );
  const findOwned = (game: CatalogGamePreview) =>
    ownedByRawgId.get(Number(game.id)) ?? ownedBySlug.get(game.slug);
  const catalogGames =
    library.isSuccess && debouncedQuery === query.trim() && catalog.isSuccess
      ? catalog.data
      : [];
  for (const game of catalogGames) {
    const owned = findOwned(game);
    if (owned && !libraryMatches.some((match) => match.id === owned.id)) {
      libraryMatches.push(owned);
    }
  }
  const catalogMatches = catalogGames
    .filter((game) => !findOwned(game))
    .slice(0, 6);
  const results: SearchResult[] = [
    ...libraryMatches.map((game) => ({ kind: "library" as const, game })),
    ...catalogMatches.map((game) => ({ kind: "catalog" as const, game })),
  ];
  const selectedIndex = activeIndex < results.length ? activeIndex : -1;
  const catalogPending = query.trim() !== debouncedQuery || catalog.isPending;
  const showPanel = open && query.trim().length > 0;

  const activateResult = (result: SearchResult) => {
    if (result.kind === "catalog") {
      if (!add.isPending) add.mutate(result.game);
      return;
    }
    setOpen(false);
    setQuery("");
    router.push(`/games/${result.game.id}`);
  };

  useEffect(() => {
    if (selectedIndex >= 0 && showPanel) {
      document
        .getElementById(`global-search-option-${selectedIndex}`)
        ?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, showPanel]);

  return (
    <div
      className="relative col-span-2 row-start-2 min-w-0 lg:col-span-1 lg:row-start-auto"
      ref={root}
    >
      <InputGroup className="h-10 bg-card">
        <InputGroupInput
          ref={input}
          id="global-search"
          type="text"
          inputMode="search"
          autoComplete="off"
          aria-label="Cerca un gioco nella libreria e nel catalogo RAWG"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showPanel}
          aria-controls={showPanel ? "global-search-results" : undefined}
          aria-activedescendant={
            showPanel && selectedIndex >= 0
              ? `global-search-option-${selectedIndex}`
              : undefined
          }
          aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
          placeholder="Cerca un gioco o aggiungilo…"
          className="h-full"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              setActiveIndex(-1);
              input.current?.blur();
              return;
            }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              if (results.length === 0) return;
              event.preventDefault();
              setOpen(true);
              setActiveIndex((current) =>
                event.key === "ArrowDown"
                  ? (current + 1) % results.length
                  : current <= 0
                    ? results.length - 1
                    : current - 1,
              );
              return;
            }
            if (event.key !== "Enter") return;
            if (selectedIndex >= 0) {
              event.preventDefault();
              activateResult(results[selectedIndex]);
              return;
            }
            const exactMatch = libraryMatches.find(
              (game) => game.title.toLocaleLowerCase("it") === normalized,
            );
            if (exactMatch) {
              event.preventDefault();
              activateResult({ kind: "library", game: exactMatch });
            }
          }}
        />
        <InputGroupAddon align="inline-start">
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          {query.length > 0 ? (
            <InputGroupButton
              size="icon-sm"
              aria-label="Cancella ricerca"
              onClick={() => {
                setQuery("");
                setActiveIndex(-1);
                input.current?.focus();
              }}
            >
              <XIcon aria-hidden="true" />
            </InputGroupButton>
          ) : (
            <KbdGroup aria-hidden="true">
              <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          )}
        </InputGroupAddon>
      </InputGroup>
      {showPanel && (
        <section
          id="global-search-results"
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 max-h-[min(70vh,620px)] overflow-y-auto rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-xl"
          aria-label="Risultati di ricerca"
        >
          {library.isError && (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              La libreria non è disponibile. Riprova tra poco.
            </p>
          )}
          {library.isPending && (
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
                Nella tua libreria
              </h2>
              {libraryMatches.map((game, index) => (
                <button
                  key={game.id}
                  id={`global-search-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={selectedIndex === index}
                  aria-label={`Apri ${game.title} nella libreria`}
                  className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left outline-none hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring aria-selected:bg-accent"
                  onClick={() => activateResult({ kind: "library", game })}
                >
                  <span className="relative aspect-3/2 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
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
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    {/* <span className="hidden sm:inline">Apri</span> */}
                    <Button
                      variant="outline"
                      render={<span />}
                      nativeButton={false}
                      size="xs"
                      className="max-sm:hidden"
                    >
                      Apri{" "}
                      <Kbd data-icon="inline-end" className="translate-x-0.5">
                        ⏎
                      </Kbd>
                    </Button>
                    <ArrowUpRightIcon
                      size={17}
                      aria-hidden="true"
                      className="sm:hidden"
                    />
                  </span>
                </button>
              ))}
            </div>
          )}
          {query.trim().length >= 2 && library.isSuccess && (
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
                Risultati della ricerca
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
                catalogMatches.map((game, index) => (
                  <button
                    key={game.id}
                    id={`global-search-option-${libraryMatches.length + index}`}
                    type="button"
                    role="option"
                    aria-selected={
                      selectedIndex === libraryMatches.length + index
                    }
                    aria-label={`Aggiungi ${game.title} alla libreria`}
                    disabled={add.isPending}
                    className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left outline-none hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 aria-selected:bg-accent"
                    onClick={() => activateResult({ kind: "catalog", game })}
                  >
                    <span className="relative aspect-3/2 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
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
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <Button
                        variant="outline"
                        render={<span />}
                        nativeButton={false}
                        size="xs"
                        className="max-sm:hidden"
                      >
                        Aggiungi{" "}
                        <Kbd data-icon="inline-end" className="translate-x-0.5">
                          ⏎
                        </Kbd>
                      </Button>
                      <PlusIcon
                        className="sm:hidden"
                        size={17}
                        aria-hidden="true"
                      />
                    </span>
                  </button>
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
