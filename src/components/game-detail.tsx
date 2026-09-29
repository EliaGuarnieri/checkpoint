"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Schema } from "effect";
import { ArrowLeftIcon, SaveIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { GameCover } from "~/components/game-cover";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "~/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { Slider } from "~/components/ui/slider";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { fetchJson } from "~/lib/api";
import {
  LibraryGameSchema,
  type LibraryGame,
  type TrackingStatus,
} from "~/modules/library/model";

const UpdatedResponse = Schema.Struct({ updated: Schema.Literal(true) });
const RemovedResponse = Schema.Struct({ removed: Schema.Literal(true) });
const statuses: ReadonlyArray<{
  value: TrackingStatus;
  label: string;
  description: string;
}> = [
  { value: "backlog", label: "Da giocare", description: "È nella tua lista" },
  { value: "playing", label: "In corso", description: "Ci stai giocando" },
  { value: "completed", label: "Completato", description: "L'hai concluso" },
  { value: "abandoned", label: "Abbandonato", description: "Lo hai lasciato" },
];
const isTrackingStatus = (value: string): value is TrackingStatus =>
  statuses.some((item) => item.value === value);

export function GameDetail({ gameId }: { readonly gameId: string }) {
  const game = useQuery({
    queryKey: ["library-game", gameId],
    queryFn: () => fetchJson(LibraryGameSchema, `/api/library/${gameId}`),
  });
  if (game.isLoading)
    return (
      <div className="grid gap-8">
        <Skeleton className="h-80" />
        <Skeleton className="h-96" />
      </div>
    );
  if (game.isError)
    return (
      <Alert variant="destructive">
        <AlertTitle>Gioco non disponibile</AlertTitle>
        <AlertDescription>
          Non è stato possibile caricare questa voce della libreria. Ricarica la
          pagina per riprovare.
        </AlertDescription>
      </Alert>
    );
  if (!game.data) return <p>Gioco non trovato.</p>;
  return <GameDetailEditor key={game.data.updatedAt} game={game.data} />;
}

function GameDetailEditor({ game }: { readonly game: LibraryGame }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<TrackingStatus>(game.status);
  const [rating, setRating] = useState(game.rating ?? 0);
  const [note, setNote] = useState(game.note ?? "");
  const dirty =
    status !== game.status ||
    rating !== (game.rating ?? 0) ||
    note !== (game.note ?? "");
  const update = useMutation({
    mutationFn: () =>
      fetchJson(UpdatedResponse, `/api/library/${game.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          rating: rating || null,
          note: note || null,
        }),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["library"] }),
        queryClient.invalidateQueries({ queryKey: ["library-game", game.id] }),
      ]);
    },
  });
  const remove = useMutation({
    mutationFn: () =>
      fetchJson(RemovedResponse, `/api/library/${game.id}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["library"] });
      router.push("/library");
    },
  });

  return (
    <article className="space-y-8">
      <Link
        href="/library"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeftIcon size={17} aria-hidden="true" /> Torna alla libreria
      </Link>

      <header className="grid overflow-hidden rounded-xl bg-card text-card-foreground md:min-h-96 md:grid-cols-[1fr_47%]">
        <div className="order-2 flex min-w-0 flex-col justify-center p-6 sm:p-8 md:order-1 lg:p-10">
          <div className="flex flex-wrap gap-2">
            {game.genres.slice(0, 3).map((genre) => (
              <Badge key={genre} variant="secondary">
                {genre}
              </Badge>
            ))}
          </div>
          <h1 className="mt-5 text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {game.title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {game.developers.join(", ") || "Sviluppatore non disponibile"}
            <span aria-hidden="true"> · </span>
            {game.releaseDate?.slice(0, 4) ?? "Anno ignoto"}
          </p>
          <div className="mt-10 flex flex-wrap gap-x-12 gap-y-5 border-t border-border pt-5">
            <div className="flex flex-col gap-1">
              <small className="text-xs text-muted-foreground">
                Il tuo stato
              </small>
              <strong className="text-lg font-semibold">
                {statuses.find((item) => item.value === game.status)?.label}
              </strong>
            </div>
            <div className="flex flex-col gap-1">
              <small className="text-xs text-muted-foreground">
                Il tuo voto
              </small>
              <strong className="text-lg font-semibold">
                {game.rating != null ? (
                  <>
                    {game.rating}
                    <span className="text-sm font-normal text-muted-foreground">
                      /10
                    </span>
                  </>
                ) : (
                  "—"
                )}
              </strong>
            </div>
          </div>
        </div>
        <div className="order-1 h-64 bg-muted md:order-2 md:h-full">
          <GameCover
            title={game.title}
            coverUrl={game.coverUrl}
            rawgId={game.rawgId}
            sizes="(max-width: 760px) 100vw, 50vw"
            priority
          />
        </div>
      </header>

      <div className="grid gap-10 pt-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(16rem,1fr)] lg:gap-16">
        <section className="min-w-0" aria-labelledby="checkpoint-title">
          <div className="mb-8">
            <h2
              id="checkpoint-title"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Il tuo checkpoint
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Lo spazio per tenere traccia di dove sei e di cosa vuoi ricordare.
            </p>
          </div>
          <FieldGroup>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="status">Stato</FieldLabel>
                <Select
                  value={status}
                  onValueChange={(value) => {
                    if (value && isTrackingStatus(value)) setStatus(value);
                  }}
                >
                  <SelectTrigger id="status">
                    <SelectValue>
                      {(value) =>
                        typeof value === "string"
                          ? (statuses.find((item) => item.value === value)
                              ?.label ?? value)
                          : ""
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {statuses.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  {statuses.find((item) => item.value === status)?.description}
                </FieldDescription>
              </Field>
              <Field>
                <div className="flex items-baseline justify-between gap-3">
                  <FieldTitle>Il tuo voto</FieldTitle>
                  <strong className="text-sm font-semibold tabular-nums">
                    {rating ? `${rating}/10` : "Senza voto"}
                  </strong>
                </div>
                <Slider
                  min={0}
                  max={10}
                  step={1}
                  value={rating}
                  onValueChange={(value) => setRating(value as number)}
                  thumbLabel="Il tuo voto"
                  valueText={rating ? `${rating} su 10` : "Senza voto"}
                  className="py-3"
                />
                <div
                  className="flex justify-between text-xs text-muted-foreground"
                  aria-hidden="true"
                >
                  <span>Senza voto</span>
                  <span>10</span>
                </div>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="note">
                La tua nota{" "}
                <span className="font-normal text-muted-foreground">
                  Facoltativa
                </span>
              </FieldLabel>
              <Textarea
                id="note"
                className="min-h-28"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Un momento da ricordare, una cosa da fare quando torni a giocare…"
              />
              <FieldDescription>
                Resta privata nella tua libreria.
              </FieldDescription>
            </Field>
            {(update.isError || remove.isError) && (
              <Alert variant="destructive">
                <AlertTitle>Modifica non riuscita</AlertTitle>
                <AlertDescription>
                  I dati che hai scritto sono ancora qui. Riprova tra poco.
                </AlertDescription>
              </Alert>
            )}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
              <span className="text-xs text-muted-foreground">
                {dirty ? "Modifiche non salvate" : "Tutto aggiornato"}
              </span>
              <Button
                onClick={() => update.mutate()}
                disabled={!dirty || update.isPending}
              >
                {update.isPending ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <SaveIcon data-icon="inline-start" />
                )}{" "}
                Salva modifiche
              </Button>
            </div>
          </FieldGroup>
        </section>

        <aside
          className="border-t border-border pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10"
          aria-label="Informazioni sul gioco"
        >
          <h2 className="text-xl font-semibold tracking-tight">Il gioco</h2>
          <dl className="mt-5 divide-y divide-border border-t border-border">
            <div className="py-4">
              <dt className="text-xs text-muted-foreground">Uscita</dt>
              <dd className="mt-1 text-sm font-medium">
                {game.releaseDate
                  ? new Intl.DateTimeFormat("it-IT", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      timeZone: "UTC",
                    }).format(new Date(game.releaseDate))
                  : "Non disponibile"}
              </dd>
            </div>
            <div className="py-4">
              <dt className="text-xs text-muted-foreground">Sviluppatore</dt>
              <dd className="mt-1 text-sm font-medium">
                {game.developers.join(", ") || "Non disponibile"}
              </dd>
            </div>
            <div className="py-4">
              <dt className="text-xs text-muted-foreground">Publisher</dt>
              <dd className="mt-1 text-sm font-medium">
                {game.publishers.join(", ") || "Non disponibile"}
              </dd>
            </div>
            <div className="py-4">
              <dt className="text-xs text-muted-foreground">Generi</dt>
              <dd className="mt-1 text-sm font-medium">
                {game.genres.join(", ") || "Non disponibili"}
              </dd>
            </div>
          </dl>
          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
            Metadati del gioco da{" "}
            <a
              href="https://rawg.io"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-4"
            >
              RAWG
            </a>
            . Stato, voto e nota sono tuoi.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-6"
            disabled={remove.isPending}
            onClick={() => {
              if (window.confirm(`Rimuovere ${game.title} dalla libreria?`))
                remove.mutate();
            }}
          >
            <Trash2Icon data-icon="inline-start" /> Rimuovi dalla libreria
          </Button>
        </aside>
      </div>
    </article>
  );
}
