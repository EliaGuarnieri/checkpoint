"use client";

import { useQuery } from "@tanstack/react-query";
import { Gamepad2Icon, SearchIcon, StarIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CatalogSearchDialog } from "~/components/catalog-search-dialog";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
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
import type { LibraryGame, TrackingStatus } from "~/modules/library/model";

const statusLabels: Record<TrackingStatus, string> = {
  backlog: "Backlog",
  playing: "In corso",
  completed: "Completato",
  abandoned: "Abbandonato",
};

const sortLabels: Record<string, string> = {
  updated: "Ultima modifica",
  title: "Titolo",
  rating: "Voto",
  releaseDate: "Data di uscita",
};

const displaySelectValue = (value: unknown, labels: Record<string, string>) =>
  typeof value === "string" ? (labels[value] ?? value) : "";

export function LibraryView() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [genre, setGenre] = useState("");
  const [developer, setDeveloper] = useState("");
  const [publisher, setPublisher] = useState("");
  const [minimumRating, setMinimumRating] = useState("");
  const [sort, setSort] = useState("updated");
  const params = new URLSearchParams({ sort });
  if (query) params.set("query", query);
  if (status !== "all") params.set("status", status);
  if (genre) params.set("genre", genre);
  if (developer) params.set("developer", developer);
  if (publisher) params.set("publisher", publisher);
  if (minimumRating) params.set("minimumRating", minimumRating);
  const library = useQuery({
    queryKey: [
      "library",
      query,
      status,
      genre,
      developer,
      publisher,
      minimumRating,
      sort,
    ],
    queryFn: () =>
      fetchJson<ReadonlyArray<LibraryGame>>(`/api/library?${params}`),
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">La tua collezione</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Libreria
          </h1>
          <p className="mt-2 text-muted-foreground">
            Giochi, giudizi e note nel punto in cui li hai lasciati.
          </p>
        </div>
        <CatalogSearchDialog />
      </div>
      <div className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-2 xl:grid-cols-4">
        <Field>
          <FieldLabel htmlFor="library-search" className="sr-only">
            Cerca per titolo
          </FieldLabel>
          <div className="relative">
            <SearchIcon className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              id="library-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-9"
              placeholder="Cerca nella libreria"
            />
          </div>
        </Field>
        <Field>
          <FieldLabel htmlFor="genre-filter">Genere</FieldLabel>
          <Input
            id="genre-filter"
            value={genre}
            onChange={(event) => setGenre(event.target.value)}
            placeholder="Es. RPG"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="developer-filter">Sviluppatore</FieldLabel>
          <Input
            id="developer-filter"
            value={developer}
            onChange={(event) => setDeveloper(event.target.value)}
            placeholder="Es. Supergiant Games"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="publisher-filter">Publisher</FieldLabel>
          <Input
            id="publisher-filter"
            value={publisher}
            onChange={(event) => setPublisher(event.target.value)}
            placeholder="Es. Annapurna"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="rating-filter">Voto minimo</FieldLabel>
          <Input
            id="rating-filter"
            type="number"
            min={1}
            max={10}
            value={minimumRating}
            onChange={(event) => setMinimumRating(event.target.value)}
            placeholder="1–10"
          />
        </Field>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value ?? "all")}
        >
          <SelectTrigger aria-label="Filtra per stato">
            <SelectValue>
              {(value) =>
                displaySelectValue(value, {
                  all: "Tutti gli stati",
                  ...statusLabels,
                })
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          value={sort}
          onValueChange={(value) => setSort(value ?? "updated")}
        >
          <SelectTrigger aria-label="Ordina libreria">
            <SelectValue>
              {(value) => displaySelectValue(value, sortLabels)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="updated">Ultima modifica</SelectItem>
              <SelectItem value="title">Titolo</SelectItem>
              <SelectItem value="rating">Voto</SelectItem>
              <SelectItem value="releaseDate">Data di uscita</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      {library.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-64" />
          ))}
        </div>
      ) : library.data?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {library.data.map((game) => (
            <Card key={game.id} className="overflow-hidden">
              <CardHeader>
                <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-muted text-primary">
                  <Gamepad2Icon />
                </div>
                <CardTitle>
                  <Link href={`/games/${game.id}`}>{game.title}</Link>
                </CardTitle>
                <CardDescription>
                  {game.developers.join(", ") || "Sviluppatore non disponibile"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Badge>{statusLabels[game.status]}</Badge>
                {game.genres.slice(0, 2).map((genre) => (
                  <Badge key={genre} variant="secondary">
                    {genre}
                  </Badge>
                ))}
              </CardContent>
              <CardFooter className="justify-between text-sm text-muted-foreground">
                <span>{game.releaseDate?.slice(0, 4) ?? "—"}</span>
                <span className="flex items-center gap-1">
                  <StarIcon aria-hidden="true" />
                  {game.rating ?? "—"}/10
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Gamepad2Icon />
            </EmptyMedia>
            <EmptyTitle>Nessun gioco trovato</EmptyTitle>
            <EmptyDescription>
              Modifica i filtri o aggiungi un gioco dal catalogo.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
