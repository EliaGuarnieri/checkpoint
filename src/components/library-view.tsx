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
import { useMemo, useState } from "react";

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
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<TrackingStatus | "all">("all");
  const [genre, setGenre] = useState("");
  const [developer, setDeveloper] = useState("");
  const [publisher, setPublisher] = useState("");
  const [minimumRating, setMinimumRating] = useState("");
  const [sort, setSort] = useState<Sort>("updated");
  const library = useQuery({
    queryKey: ["library", "all"],
    queryFn: () => fetchJson(LibraryResponse, "/api/library"),
  });
  const games = useMemo(
    () =>
      filterLibraryGames(library.data ?? [], {
        query,
        status: status === "all" ? undefined : status,
        genre,
        developer,
        publisher,
        minimumRating: Number(minimumRating),
        sort,
      }),
    [
      library.data,
      query,
      status,
      genre,
      developer,
      publisher,
      minimumRating,
      sort,
    ],
  );
  const advancedCount = [
    query,
    genre,
    developer,
    publisher,
    minimumRating,
  ].filter(Boolean).length;
  const focusSearch = () => document.getElementById("global-search")?.focus();

  return (
    <div className="space-y-12">
      <header className="flex flex-col justify-between gap-6 border-b border-border pb-10 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl leading-tight font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            La tua libreria<span className="text-primary">.</span>
          </h1>
          <p className="mt-4 max-w-[65ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
            Ogni gioco, al suo posto. I tuoi progressi e le tue impressioni,
            sempre a portata di mano.
          </p>
        </div>
        <Button
          onClick={focusSearch}
          size="lg"
          className="shrink-0 self-start sm:self-auto"
        >
          <PlusIcon data-icon="inline-start" /> Aggiungi un gioco
        </Button>
      </header>

      <section className="space-y-6" aria-label="Esplora la libreria">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              La collezione
            </h2>
            <span className="text-sm text-muted-foreground">
              {library.data?.length ?? "—"}{" "}
              {library.data?.length === 1 ? "gioco" : "giochi"}
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
              <SelectTrigger aria-label="Ordina libreria" className="w-[190px]">
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

        <div className="flex flex-col gap-3 border-b border-border pb-5 xl:flex-row xl:items-start xl:justify-between">
          <fieldset className="flex min-w-0 gap-1 overflow-x-auto pb-1">
            <legend className="sr-only">Filtra per stato</legend>
            {statuses.map((item) => {
              const count =
                item.value === "all"
                  ? library.data?.length
                  : library.data?.filter((game) => game.status === item.value)
                      .length;
              return (
                <Button
                  key={item.value}
                  type="button"
                  variant={status === item.value ? "default" : "ghost"}
                  size="sm"
                  className="shrink-0 rounded-full"
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
            <summary className="flex h-7 cursor-pointer list-none items-center gap-2 rounded-lg px-2.5 text-[0.8rem] font-medium text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              <SlidersHorizontalIcon size={17} aria-hidden="true" /> Filtri{" "}
              {advancedCount > 0 && (
                <Badge variant="secondary">{advancedCount}</Badge>
              )}
            </summary>
            <div className="z-20 mt-2 grid gap-4 rounded-xl border border-border bg-popover p-4 shadow-xl sm:grid-cols-2 xl:absolute xl:right-0 xl:w-[560px]">
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
                <FieldLabel htmlFor="library-rating">Voto minimo</FieldLabel>
                <Input
                  id="library-rating"
                  type="number"
                  min={1}
                  max={10}
                  value={minimumRating}
                  onChange={(event) => setMinimumRating(event.target.value)}
                  placeholder="Da 1 a 10"
                />
              </Field>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setGenre("");
                  setDeveloper("");
                  setPublisher("");
                  setMinimumRating("");
                }}
              >
                Azzera filtri
              </Button>
            </div>
          </details>
        </div>

        {library.isError && (
          <Alert variant="destructive">
            <AlertTitle>Libreria non disponibile</AlertTitle>
            <AlertDescription>
              Non è stato possibile caricare i giochi. Ricarica la pagina per
              riprovare.
            </AlertDescription>
          </Alert>
        )}
        {library.isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="aspect-[0.95] rounded-xl" />
            ))}
          </div>
        ) : library.isError ? null : games.length ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {games.map((game) => (
              <Link
                href={`/games/${game.id}`}
                className="group block min-w-0 overflow-hidden rounded-xl border border-border bg-card text-card-foreground transition-[transform,box-shadow] duration-300 outline-none hover:-translate-y-1 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none"
                key={game.id}
              >
                <div className="relative aspect-[1.55] overflow-hidden bg-muted">
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
            <Button
              onClick={
                library.data?.length
                  ? () => {
                      setStatus("all");
                      setQuery("");
                      setGenre("");
                      setDeveloper("");
                      setPublisher("");
                      setMinimumRating("");
                    }
                  : focusSearch
              }
            >
              {library.data?.length ? "Azzera i filtri" : "Cerca un gioco"}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
