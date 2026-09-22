"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Schema } from "effect";
import { ArrowLeftIcon, SaveIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "~/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
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
import { Textarea } from "~/components/ui/textarea";
import { fetchJson } from "~/lib/api";
import { cn } from "cn";
import {
  LibraryGameSchema,
  type LibraryGame,
  type TrackingStatus,
} from "~/modules/library/model";

const UpdatedResponse = Schema.Struct({ updated: Schema.Literal(true) });
const RemovedResponse = Schema.Struct({ removed: Schema.Literal(true) });

const statuses: ReadonlyArray<{ value: TrackingStatus; label: string }> = [
  { value: "backlog", label: "Backlog" },
  { value: "playing", label: "In corso" },
  { value: "completed", label: "Completato" },
  { value: "abandoned", label: "Abbandonato" },
];

const isTrackingStatus = (value: string): value is TrackingStatus =>
  statuses.some((status) => status.value === value);

export function GameDetail({ gameId }: { readonly gameId: string }) {
  const game = useQuery({
    queryKey: ["library-game", gameId],
    queryFn: () => fetchJson(LibraryGameSchema, `/api/library/${gameId}`),
  });
  if (game.isLoading) return <Skeleton className="h-96" />;
  if (game.isError)
    return (
      <Alert variant="destructive">
        <AlertTitle>Gioco non disponibile</AlertTitle>
        <AlertDescription>
          Non è stato possibile caricare questa voce della libreria.
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
  const [rating, setRating] = useState(game.rating?.toString() ?? "");
  const [note, setNote] = useState(game.note ?? "");
  const update = useMutation({
    mutationFn: () =>
      fetchJson(UpdatedResponse, `/api/library/${game.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          rating: rating ? Number(rating) : null,
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
    onSuccess: () => router.push("/library"),
  });

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link
        href="/library"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "self-start",
        )}
      >
        <ArrowLeftIcon data-icon="inline-start" />
        Torna alla libreria
      </Link>
      <div>
        <div className="flex flex-wrap gap-2">
          {game.genres.map((genre) => (
            <Badge key={genre} variant="secondary">
              {genre}
            </Badge>
          ))}
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          {game.title}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {game.developers.join(", ")} ·{" "}
          {game.releaseDate?.slice(0, 4) ?? "Data sconosciuta"}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Il tuo checkpoint</CardTitle>
          <CardDescription>
            Stato, voto e nota sono personali e non vengono modificati dagli
            import successivi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
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
            </Field>
            <Field
              data-invalid={
                rating !== "" && (Number(rating) < 1 || Number(rating) > 10)
              }
            >
              <FieldLabel htmlFor="rating">Voto</FieldLabel>
              <Input
                id="rating"
                type="number"
                min={1}
                max={10}
                value={rating}
                onChange={(event) => setRating(event.target.value)}
                aria-invalid={
                  rating !== "" && (Number(rating) < 1 || Number(rating) > 10)
                }
              />
              <FieldDescription>
                Un numero intero da 1 a 10, oppure lascia vuoto.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="note">Nota</FieldLabel>
              <Textarea
                id="note"
                rows={8}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Cosa vuoi ricordare di questo gioco?"
              />
            </Field>
            <div className="flex flex-wrap justify-between gap-3">
              <Button
                variant="destructive"
                onClick={() => remove.mutate()}
                disabled={remove.isPending}
              >
                <Trash2Icon data-icon="inline-start" />
                Rimuovi
              </Button>
              <Button
                onClick={() => update.mutate()}
                disabled={
                  update.isPending ||
                  (rating !== "" && (Number(rating) < 1 || Number(rating) > 10))
                }
              >
                {update.isPending ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <SaveIcon data-icon="inline-start" />
                )}
                Salva checkpoint
              </Button>
            </div>
            {(update.isError || remove.isError) && (
              <Alert variant="destructive">
                <AlertTitle>Modifica non salvata</AlertTitle>
                <AlertDescription>
                  La richiesta non è riuscita. I dati nel modulo sono rimasti
                  invariati: puoi riprovare.
                </AlertDescription>
              </Alert>
            )}
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}
