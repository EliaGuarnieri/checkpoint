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
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "~/components/ui/input-group";
import { Kbd, KbdGroup } from "~/components/ui/kbd";
import { fetchJson } from "~/lib/api";
import { requestNavigation } from "~/lib/navigation";
import {
  CatalogGamePreviewSchema,
  type CatalogGamePreview,
} from "~/modules/catalog/model";
import { LibraryGameSchema, type LibraryGame } from "~/modules/library/model";

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
  const adding = useRef(false);
  const catalogRetryFocused = useRef(false);
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
  useEffect(() => {
    if (catalog.isSuccess && catalogRetryFocused.current) {
      catalogRetryFocused.current = false;
      input.current?.focus();
    }
  }, [catalog.isSuccess]);
  const add = useMutation({
    mutationFn: async ({
      game,
    }: {
      game: CatalogGamePreview;
      replace: boolean;
    }) => {
      const added = await fetchJson(AddedResponse, "/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: game.id }),
      });
      return added.id;
    },
    onSuccess: async (id, { replace }) => {
      await queryClient.invalidateQueries({ queryKey: ["library"] });
      setOpen(false);
      setQuery("");
      if (replace) router.replace(`/games/${id}`);
      else router.push(`/games/${id}`);
    },
    onSettled: () => {
      adding.current = false;
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
  const catalogPending =
    query.trim() !== debouncedQuery ||
    (catalog.isPending && !catalog.isFetched);
  const catalogRecovery =
    !catalogPending &&
    (catalog.isError || (catalog.isLoading && catalog.isFetched));
  const showPanel = open && query.trim().length > 0;

  const activateResult = (result: SearchResult) => {
    if (adding.current) return;
    if (result.kind === "catalog") {
      requestNavigation((replace) => {
        adding.current = true;
        add.mutate({ game: result.game, replace });
      });
      return;
    }
    const destination = `/games/${result.game.id}`;
    if (destination === window.location.pathname) {
      setOpen(false);
      setQuery("");
      return;
    }
    requestNavigation((replace) => {
      setOpen(false);
      setQuery("");
      if (replace) router.replace(destination);
      else router.push(destination);
    }, destination);
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
          placeholder="Cerca nella libreria o nel catalogo RAWG…"
          className="h-full"
          value={query}
          onChange={(event) => {
            if (add.isError) add.reset();
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
            if (event.key === "Enter" && selectedIndex >= 0) {
              event.preventDefault();
              activateResult(results[selectedIndex]);
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
                if (add.isError) add.reset();
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
      {open && !query.trim() && (
        <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 rounded-xl border border-border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-xl">
          Cerca nel catalogo RAWG per aggiungere un gioco, oppure apri una voce
          già nella tua libreria.
        </div>
      )}
      {showPanel && (
        <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 max-h-[min(70vh,620px)] overflow-y-auto rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-xl">
          <section
            id="global-search-results"
            role="listbox"
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
                  Nella tua libreria · Apri il dettaglio
                </h2>
                {libraryMatches.map((game, index) => (
                  <button
                    key={game.id}
                    id={`global-search-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={selectedIndex === index}
                    aria-label={`Apri ${[game.title, game.releaseDate?.slice(0, 4), game.developers[0]].filter(Boolean).join(", ")} nella tua libreria`}
                    disabled={add.isPending}
                    className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left outline-none hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 aria-selected:bg-accent"
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
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <strong className="truncate text-sm font-medium">
                        {game.title}
                      </strong>
                      <small className="truncate text-xs text-muted-foreground">
                        {[game.releaseDate?.slice(0, 4), game.developers[0]]
                          .filter(Boolean)
                          .join(" · ") || "Già nella tua libreria"}
                      </small>
                      <span className="flex items-center gap-1 text-xs font-medium text-foreground">
                        Apri nella tua libreria{" "}
                        <ArrowUpRightIcon size={14} aria-hidden="true" />
                      </span>
                    </span>
                    <Kbd aria-hidden="true" className="ml-auto shrink-0">
                      ⏎
                    </Kbd>
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
                  Catalogo RAWG · Aggiungi alla libreria
                </h2>
                {catalogPending ? (
                  <p className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                    <LoaderCircleIcon className="animate-spin" size={16} />{" "}
                    Cerco nel catalogo…
                  </p>
                ) : catalogRecovery ? null : catalogMatches.length ? (
                  catalogMatches.map((game, index) => (
                    <button
                      key={game.id}
                      id={`global-search-option-${libraryMatches.length + index}`}
                      type="button"
                      role="option"
                      aria-selected={
                        selectedIndex === libraryMatches.length + index
                      }
                      aria-label={`Aggiungi ${[game.title, game.releaseDate?.slice(0, 4), ...game.genres.slice(0, 2)].filter(Boolean).join(", ")} alla libreria dal catalogo RAWG`}
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
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <strong className="truncate text-sm font-medium">
                          {game.title}
                        </strong>
                        <small className="truncate text-xs text-muted-foreground">
                          {[
                            game.releaseDate?.slice(0, 4),
                            ...game.genres.slice(0, 2),
                          ]
                            .filter(Boolean)
                            .join(" · ") || "Data e genere non disponibili"}
                        </small>
                        <span className="flex items-center gap-1 text-xs font-semibold text-foreground">
                          {add.isPending &&
                          add.variables?.game.id === game.id ? (
                            <>
                              <LoaderCircleIcon
                                size={14}
                                className="animate-spin"
                                aria-hidden="true"
                              />{" "}
                              Aggiunta in corso…
                            </>
                          ) : (
                            <>
                              Aggiungi alla libreria{" "}
                              <PlusIcon size={14} aria-hidden="true" />
                            </>
                          )}
                        </span>
                      </span>
                      <Kbd aria-hidden="true" className="ml-auto shrink-0">
                        ⏎
                      </Kbd>
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
            {add.isPending && (
              <p
                role="status"
                className="px-3 py-3 text-sm text-muted-foreground"
              >
                Aggiungo {add.variables?.game.title} alla libreria…
              </p>
            )}
            {add.isError && (
              <p role="alert" className="px-3 py-3 text-sm text-destructive">
                Non siamo riusciti ad aggiungere {add.variables?.game.title}.
                Riprova scegliendo il risultato; la ricerca è ancora qui.
              </p>
            )}
          </section>
          {query.trim().length >= 2 && library.isSuccess && catalogRecovery && (
            <Alert variant="destructive">
              <AlertTitle>Catalogo non disponibile</AlertTitle>
              <AlertDescription className="flex flex-col gap-3">
                <span>
                  Non è stato possibile cercare i giochi nel catalogo. Riprova
                  la ricerca corrente.
                </span>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 min-w-11 self-start"
                  aria-disabled={catalog.isFetching}
                  onFocus={() => {
                    catalogRetryFocused.current = true;
                  }}
                  onBlur={() => {
                    catalogRetryFocused.current = false;
                  }}
                  onClick={() => {
                    if (catalog.isFetching) return;
                    void catalog.refetch();
                  }}
                >
                  {catalog.isFetching && (
                    <Spinner
                      data-icon="inline-start"
                      aria-hidden="true"
                      className="motion-reduce:animate-none"
                    />
                  )}
                  {catalog.isFetching ? "Riprovo…" : "Riprova"}
                </Button>
                <output className="sr-only" aria-label="Ricerca nel catalogo">
                  {catalog.isFetching ? "Riprovo…" : "Ricerca non riuscita"}
                </output>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
