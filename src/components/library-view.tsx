"use client";

import { useQuery } from "@tanstack/react-query";
import { Schema } from "effect";
import {
  ArrowUpRightIcon,
  PlusIcon,
  SearchIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { GameCover } from "~/components/game-cover";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Field, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { Spinner } from "~/components/ui/spinner";
import { Slider } from "~/components/ui/slider";
import { fetchJson } from "~/lib/api";
import {
  LibraryGameSchema,
  type TrackingStatus,
} from "~/modules/library/model";
import { filterLibraryGames } from "~/modules/library/query";

const LibraryResponse = Schema.Array(LibraryGameSchema);
const statuses: ReadonlyArray<{
  value: TrackingStatus | "all";
  label: string;
}> = [
  { value: "all", label: "Tutti" },
  { value: "playing", label: "In corso" },
  { value: "backlog", label: "Da giocare" },
  { value: "completed", label: "Completati" },
  { value: "abandoned", label: "Abbandonati" },
];
const statusLabels: Record<TrackingStatus, string> = {
  playing: "In corso",
  backlog: "Da giocare",
  completed: "Completato",
  abandoned: "Abbandonato",
};
type Sort = "updated" | "title" | "rating" | "releaseDate";
const sortLabels: Record<Sort, string> = {
  updated: "Modificati di recente",
  title: "Titolo A–Z",
  rating: "Voto più alto",
  releaseDate: "Uscita più recente",
};

export function LibraryView() {
  const retryFocused = useRef(false);
  const collectionHeading = useRef<HTMLHeadingElement>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<TrackingStatus | "all">("all");
  const [genre, setGenre] = useState("");
  const [developer, setDeveloper] = useState("");
  const [publisher, setPublisher] = useState("");
  const [minimumRating, setMinimumRating] = useState(0);
  const [sort, setSort] = useState<Sort>("updated");
  const library = useQuery({
    queryKey: ["library", "all"],
    queryFn: () => fetchJson(LibraryResponse, "/api/library"),
  });
  useEffect(() => {
    if (library.isSuccess && retryFocused.current) {
      retryFocused.current = false;
      collectionHeading.current?.focus();
    }
  }, [library.isSuccess]);
  const entriesMatchingNonStatusCriteria = useMemo(
    () =>
      filterLibraryGames(library.data ?? [], {
        query,
        genre,
        developer,
        publisher,
        minimumRating: Number(minimumRating),
      }),
    [library.data, query, genre, developer, publisher, minimumRating],
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
  const focusSearch = () => document.getElementById("global-search")?.focus();
  const resetFilters = () => {
    setStatus("all");
    setQuery("");
    setGenre("");
    setDeveloper("");
    setPublisher("");
    setMinimumRating(0);
  };

  return (
    <div className="space-y-8">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 gap-y-3 border-b border-border pb-4 sm:flex sm:items-end sm:justify-between sm:gap-4">
        <div className="contents sm:block">
          <h1 className="col-start-1 row-start-1 text-[2rem] leading-tight font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            La tua libreria<span className="text-primary">.</span>
          </h1>
          <p className="col-span-2 row-start-2 max-w-[65ch] text-sm leading-relaxed text-muted-foreground sm:mt-3 sm:text-base">
            Ogni gioco, al suo posto. I tuoi progressi e le tue impressioni,
            sempre a portata di mano.
          </p>
        </div>
        <Button
          onClick={focusSearch}
          size="lg"
          aria-label="Aggiungi un gioco"
          className="col-start-2 row-start-1 h-11 shrink-0 self-start sm:h-9 sm:self-auto"
        >
          <PlusIcon data-icon="inline-start" /> Aggiungi
          <span className="hidden sm:inline">un gioco</span>
        </Button>
      </header>

      <section className="space-y-4" aria-label="Esplora la libreria">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <h2
              ref={collectionHeading}
              tabIndex={-1}
              className="text-2xl font-semibold tracking-tight focus-visible:ring-2 focus-visible:ring-ring sm:text-3xl"
            >
              La collezione
            </h2>
            <span className="text-sm text-muted-foreground" aria-live="polite">
              {library.isSuccess && library.data
                ? status === "all" && activeFilters.length === 0
                  ? `${library.data.length} ${library.data.length === 1 ? "gioco" : "giochi"}`
                  : `${visibleEntries.length} di ${library.data.length} ${library.data.length === 1 ? "gioco" : "giochi"}`
                : "— giochi"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="whitespace-nowrap">Ordina per</span>
            <Select
              value={sort}
              onValueChange={(value) => {
                if (value) setSort(value as Sort);
              }}
            >
              <SelectTrigger
                aria-label="Ordina libreria"
                className="w-47.5 data-[size=default]:h-11 sm:data-[size=default]:h-8"
              >
                <SelectValue>
                  {(value) => sortLabels[value as Sort] ?? "Ordina"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {(Object.keys(sortLabels) as Sort[]).map((value) => (
                    <SelectItem key={value} value={value}>
                      {sortLabels[value]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-border pb-3 xl:flex-row xl:items-start xl:justify-between">
          <fieldset className="flex min-w-0 gap-1 overflow-x-auto pb-1">
            <legend className="sr-only">Filtra per stato</legend>
            {statuses.map((item) => {
              const count = library.isSuccess
                ? item.value === "all"
                  ? entriesMatchingNonStatusCriteria.length
                  : entriesMatchingNonStatusCriteria.filter(
                      (entry) => entry.status === item.value,
                    ).length
                : undefined;
              return (
                <Button
                  key={item.value}
                  type="button"
                  variant={status === item.value ? "default" : "ghost"}
                  size="sm"
                  className="h-11 shrink-0 rounded-full sm:h-7"
                  onClick={() => setStatus(item.value)}
                  aria-pressed={status === item.value}
                >
                  {item.label}
                  <span className="ml-1 opacity-70">{count ?? "—"}</span>
                </Button>
              );
            })}
          </fieldset>
          <details className="group relative shrink-0">
            <summary className="flex h-11 cursor-pointer list-none items-center gap-2 rounded-lg px-2.5 text-[0.8rem] font-medium text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring sm:h-7 [&::-webkit-details-marker]:hidden">
              <SlidersHorizontalIcon size={17} aria-hidden="true" /> Filtri{" "}
              {activeFilters.length > 0 && (
                <Badge variant="secondary">{activeFilters.length}</Badge>
              )}
            </summary>
            <div className="z-20 mt-2 grid gap-4 rounded-xl border border-border bg-popover p-4 shadow-xl sm:grid-cols-2 xl:absolute xl:right-0 xl:w-140">
              <Field>
                <FieldLabel htmlFor="library-query">Titolo</FieldLabel>
                <div className="relative">
                  <SearchIcon
                    size={16}
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="library-query"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cerca per titolo"
                    className="pl-9"
                  />
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="library-genre">Genere</FieldLabel>
                <Input
                  id="library-genre"
                  value={genre}
                  onChange={(event) => setGenre(event.target.value)}
                  placeholder="Es. RPG"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="library-developer">
                  Sviluppatore
                </FieldLabel>
                <Input
                  id="library-developer"
                  value={developer}
                  onChange={(event) => setDeveloper(event.target.value)}
                  placeholder="Es. Supergiant Games"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="library-publisher">Publisher</FieldLabel>
                <Input
                  id="library-publisher"
                  value={publisher}
                  onChange={(event) => setPublisher(event.target.value)}
                  placeholder="Es. Annapurna"
                />
              </Field>
              <Field>
                <FieldLabel>Voto minimo</FieldLabel>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Qualsiasi voto</span>
                  <strong className="font-semibold tabular-nums">
                    {minimumRating ? `${minimumRating}/10` : "—"}
                  </strong>
                </div>
                <Slider
                  min={0}
                  max={10}
                  step={1}
                  value={minimumRating}
                  onValueChange={(value) => setMinimumRating(value as number)}
                  thumbLabel="Voto minimo"
                  valueText={
                    minimumRating
                      ? `Almeno ${minimumRating} su 10`
                      : "Nessun voto minimo"
                  }
                  className="py-3"
                />
              </Field>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Azzera filtri
              </Button>
            </div>
          </details>
        </div>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Filtri attivi:</span>
            {activeFilters.map(({ label, value }) => (
              <Badge
                key={label}
                variant="secondary"
                className="max-w-full break-all"
              >
                {label}: {value}
              </Badge>
            ))}
          </div>
        )}

        {(library.isError || (library.isLoading && library.isFetched)) && (
          <Alert variant="destructive">
            <AlertTitle>Libreria non disponibile</AlertTitle>
            <AlertDescription>
              Non è stato possibile caricare i giochi. Riprova qui senza perdere
              i filtri.
              <Button
                onFocus={() => {
                  retryFocused.current = true;
                }}
                onBlur={() => {
                  retryFocused.current = false;
                }}
                type="button"
                variant="outline"
                aria-disabled={library.isFetching}
                onClick={() => {
                  if (library.isFetching) return;
                  void library.refetch();
                }}
              >
                {library.isFetching && (
                  <Spinner data-icon="inline-start" aria-hidden="true" />
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
        {library.isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="aspect-[0.95] rounded-xl" />
            ))}
          </div>
        ) : library.isError ? null : visibleEntries.length ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {visibleEntries.map((game) => (
              <Link
                href={`/games/${game.id}`}
                className="group block min-w-0 overflow-hidden rounded-xl border border-border bg-card text-card-foreground transition-[transform,box-shadow] duration-300 outline-none hover:-translate-y-1 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none"
                key={game.id}
              >
                <div className="relative aspect-[1.65] overflow-hidden bg-muted">
                  <GameCover
                    title={game.title}
                    coverUrl={game.coverUrl}
                    rawgId={game.rawgId}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <Badge
                    variant="secondary"
                    className="absolute bottom-4 left-4 shadow-sm"
                  >
                    {statusLabels[game.status]}
                  </Badge>
                </div>
                <div className="p-5">
                  <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                    <span>
                      {game.releaseDate?.slice(0, 4) ?? "Anno ignoto"}
                    </span>
                    <span>{game.genres[0] ?? "Videogioco"}</span>
                  </div>
                  <h3 className="mt-4 text-2xl leading-tight font-semibold tracking-tight text-balance">
                    {game.title}
                  </h3>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {game.developers.join(", ") ||
                      "Sviluppatore non disponibile"}
                  </p>
                  <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                    <span>
                      {game.rating != null ? (
                        <>
                          <strong className="text-base font-semibold text-foreground">
                            {game.rating}
                          </strong>
                          <small>/10</small> · Il tuo voto
                        </>
                      ) : (
                        "Ancora senza voto"
                      )}
                    </span>
                    <ArrowUpRightIcon
                      size={20}
                      className="text-foreground"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex min-h-72 flex-col items-start justify-center rounded-xl border border-dashed border-border bg-card p-8">
            <h3 className="text-xl font-semibold">
              {library.data?.length
                ? "Nessun gioco con questi filtri"
                : "La libreria inizia qui"}
            </h3>
            <p className="mt-2 mb-6 text-sm text-muted-foreground">
              {library.data?.length
                ? "Prova a cambiare stato o ad azzerare i filtri."
                : "Cerca un titolo e aggiungi il primo gioco alla tua collezione."}
            </p>
            <Button onClick={library.data?.length ? resetFilters : focusSearch}>
              {library.data?.length ? "Azzera i filtri" : "Cerca un gioco"}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
