"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Schema } from "effect";
import {
  ArrowLeftIcon,
  RefreshCwIcon,
  SaveIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { GameCover } from "~/components/game-cover";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
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
import { Separator } from "~/components/ui/separator";
import { Slider } from "~/components/ui/slider";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { fetchJson } from "~/lib/api";
import {
  navigationRequestEvent,
  type NavigationRequest,
} from "~/lib/navigation";
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
  const retryRequested = useRef(false);
  const game = useQuery({
    queryKey: ["library-game", gameId],
    queryFn: () => fetchJson(LibraryGameSchema, `/api/library/${gameId}`),
  });
  useEffect(() => {
    if (retryRequested.current && game.data) {
      retryRequested.current = false;
      document.getElementById("game-title")?.focus();
    }
  }, [game.data]);
  if (game.isLoading && !game.isFetched)
    return (
      <output
        className="grid gap-8"
        aria-label="Caricamento del gioco in corso"
      >
        <Skeleton className="h-80" />
        <Skeleton className="h-96" />
      </output>
    );
  if (game.isError || (game.isLoading && game.isFetched))
    return (
      <div className="space-y-5">
        <Alert variant="destructive">
          <AlertTitle>Gioco non disponibile</AlertTitle>
          <AlertDescription>
            Non è stato possibile caricare questa voce della libreria. Riprova
            qui oppure torna alla libreria.
          </AlertDescription>
        </Alert>
        <div className="flex flex-wrap items-center gap-4">
          <Button
            type="button"
            aria-disabled={game.isFetching}
            onClick={() => {
              if (game.isFetching) return;
              retryRequested.current = true;
              void game.refetch();
            }}
          >
            {game.isFetching && (
              <Spinner data-icon="inline-start" aria-hidden="true" />
            )}
            {game.isFetching ? "Riprovo…" : "Riprova"}
          </Button>
          <Link
            href="/"
            className="text-sm text-foreground underline underline-offset-4 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring"
          >
            Torna alla libreria
          </Link>
        </div>
      </div>
    );
  if (!game.data) return <p>Gioco non trovato.</p>;
  return <GameDetailEditor game={game.data} />;
}

function GameDetailEditor({ game }: { readonly game: LibraryGame }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState({
    revision: game.updatedAt,
    status: game.status,
    rating: game.rating ?? 0,
    note: game.note ?? "",
  });
  const currentDraft =
    draft.revision === game.updatedAt
      ? draft
      : {
          revision: game.updatedAt,
          status: game.status,
          rating: game.rating ?? 0,
          note: game.note ?? "",
        };
  const { status, rating, note } = currentDraft;
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveTarget, setLeaveTarget] = useState<"library" | "other">(
    "library",
  );
  const pendingNavigation = useRef<(() => void) | null>(null);
  const historyGuardArmed = useRef(false);
  const rearmHistoryOnCancel = useRef(false);
  const leavingConfirmed = useRef(false);
  const saveFocusRequested = useRef(false);
  const saveStatus = useRef<HTMLOutputElement>(null);
  const dirty =
    status !== game.status ||
    rating !== (game.rating ?? 0) ||
    note !== (game.note ?? "");
  useEffect(() => {
    if (leavingConfirmed.current) return;
    if (!dirty) {
      if (historyGuardArmed.current) {
        historyGuardArmed.current = false;
        window.history.back();
      }
      return;
    }
    const currentUrl = window.location.href;
    const currentHistoryState = window.history.state;
    if (
      !historyGuardArmed.current &&
      !rearmHistoryOnCancel.current &&
      window.history.length > 1
    ) {
      // Back first reaches this same-page entry, before Next can leave the route.
      window.history.pushState(currentHistoryState, "", currentUrl);
      historyGuardArmed.current = true;
    }
    const askToLeave = (
      continueNavigation: () => void,
      target: "library" | "other",
    ) => {
      pendingNavigation.current = continueNavigation;
      setLeaveTarget(target);
      setLeaveOpen(true);
    };
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const guardLibraryLink = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      )
        return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (
        !link ||
        link.hasAttribute("download") ||
        (link.target && link.target !== "_self")
      )
        return;
      const destination = new URL(link.href);
      if (
        destination.origin !== window.location.origin ||
        destination.pathname !== "/"
      )
        return;
      event.preventDefault();
      askToLeave(() => {
        if (historyGuardArmed.current) router.replace("/");
        else router.push("/");
      }, "library");
    };
    const guardHistory = (event: PopStateEvent) => {
      const leftCurrentUrl = window.location.href !== currentUrl;
      if (!leftCurrentUrl && !historyGuardArmed.current) return;
      event.stopImmediatePropagation();
      if (leftCurrentUrl) {
        window.history.pushState(currentHistoryState, "", currentUrl);
        historyGuardArmed.current = true;
      } else {
        historyGuardArmed.current = false;
        rearmHistoryOnCancel.current = true;
      }
      askToLeave(() => router.replace("/"), "library");
    };
    const guardNavigationRequest = (event: Event) => {
      const request = event as CustomEvent<NavigationRequest>;
      if (request.detail.destination === window.location.pathname) return;
      event.preventDefault();
      askToLeave(
        () => request.detail.continueNavigation(historyGuardArmed.current),
        "other",
      );
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    window.addEventListener("popstate", guardHistory, true);
    window.addEventListener(navigationRequestEvent, guardNavigationRequest);
    document.addEventListener("click", guardLibraryLink, true);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload);
      window.removeEventListener("popstate", guardHistory, true);
      window.removeEventListener(
        navigationRequestEvent,
        guardNavigationRequest,
      );
      document.removeEventListener("click", guardLibraryLink, true);
    };
  }, [dirty, router]);
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
      saveFocusRequested.current = true;
    },
  });
  useEffect(() => {
    if (!dirty && update.isSuccess && saveFocusRequested.current) {
      saveFocusRequested.current = false;
      saveStatus.current?.focus();
    }
  }, [dirty, update.isSuccess]);
  const remove = useMutation({
    mutationFn: () =>
      fetchJson(RemovedResponse, `/api/library/${game.id}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["library"] });
      router.push("/");
    },
  });
  const refresh = useMutation({
    mutationFn: () =>
      fetchJson(LibraryGameSchema, `/api/library/${game.id}/refresh`, {
        method: "POST",
      }),
    onSuccess: async (refreshed) => {
      queryClient.setQueryData(["library-game", game.id], refreshed);
      await queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });

  return (
    <article className="space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeftIcon size={17} aria-hidden="true" /> Torna alla libreria
      </Link>
      <AlertDialog
        open={leaveOpen}
        onOpenChange={(open) => {
          setLeaveOpen(open);
          if (!open && pendingNavigation.current) {
            if (rearmHistoryOnCancel.current) {
              if (dirty) {
                window.history.pushState(
                  window.history.state,
                  "",
                  window.location.href,
                );
                historyGuardArmed.current = true;
              }
              rearmHistoryOnCancel.current = false;
            }
            pendingNavigation.current = null;
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hai modifiche non salvate</AlertDialogTitle>
            <AlertDialogDescription>
              {leaveTarget === "library"
                ? "Se torni alla libreria, perderai le modifiche a stato, voto e nota."
                : "Se lasci questa pagina, perderai le modifiche a stato, voto e nota."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Resta qui</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                const continueNavigation = pendingNavigation.current;
                pendingNavigation.current = null;
                rearmHistoryOnCancel.current = false;
                leavingConfirmed.current = true;
                setLeaveOpen(false);
                continueNavigation?.();
              }}
            >
              {leaveTarget === "library"
                ? "Scarta e torna alla libreria"
                : "Scarta e continua"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <header className="grid overflow-hidden rounded-xl bg-card text-card-foreground md:min-h-96 md:grid-cols-[1fr_47%]">
        <div className="order-2 flex min-w-0 flex-col justify-center p-5 sm:p-8 md:order-1 lg:p-10">
          <div className="flex flex-wrap gap-2">
            {game.genres.slice(0, 3).map((genre) => (
              <Badge key={genre} variant="secondary">
                {genre}
              </Badge>
            ))}
          </div>
          <h1
            id="game-title"
            tabIndex={-1}
            className="mt-5 text-4xl leading-tight font-semibold tracking-tight text-balance focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring sm:text-5xl lg:text-6xl"
          >
            {game.title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {game.developers.join(", ") || "Sviluppatore non disponibile"}
            <span aria-hidden="true"> · </span>
            {game.releaseDate?.slice(0, 4) ?? "Anno ignoto"}
          </p>
          <div className="mt-6 flex flex-wrap gap-x-12 gap-y-5 border-t border-border pt-5 md:mt-10">
            <div className="flex flex-col gap-1">
              <small className="text-xs text-muted-foreground">
                Stato salvato
              </small>
              <strong className="text-lg font-semibold">
                {statuses.find((item) => item.value === game.status)?.label}
              </strong>
            </div>
            <div className="flex flex-col gap-1">
              <small className="text-xs text-muted-foreground">
                Voto salvato
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
          <Button
            type="button"
            variant="outline"
            className="mt-5 h-11 self-start md:hidden"
            onClick={() => {
              document.getElementById("checkpoint-title")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
              document.getElementById("status")?.focus({ preventScroll: true });
            }}
          >
            Modifica il tuo checkpoint
          </Button>
        </div>
        <div className="order-1 h-36 bg-muted md:order-2 md:h-full">
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
              className="scroll-mt-32 text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Il tuo checkpoint
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Modifica la tua bozza qui. La testata mostra i valori salvati.
            </p>
            <output
              ref={saveStatus}
              tabIndex={-1}
              aria-label="Stato delle modifiche"
              aria-live="polite"
              aria-atomic="true"
              className="mt-3 text-sm text-muted-foreground"
            >
              {update.isPending
                ? "Salvataggio in corso"
                : dirty
                  ? "Modifiche non salvate"
                  : "Tutto aggiornato"}
            </output>
          </div>
          <FieldGroup>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="status">Stato</FieldLabel>
                <Select
                  value={status}
                  disabled={update.isPending}
                  onValueChange={(value) => {
                    if (value && isTrackingStatus(value))
                      setDraft({ ...currentDraft, status: value });
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
                  disabled={update.isPending}
                  value={rating}
                  onValueChange={(value) =>
                    setDraft({ ...currentDraft, rating: value as number })
                  }
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
                disabled={update.isPending}
                value={note}
                onChange={(event) =>
                  setDraft({ ...currentDraft, note: event.target.value })
                }
                placeholder="Un momento da ricordare, una cosa da fare quando torni a giocare…"
              />
              <FieldDescription>
                Resta privata nella tua libreria.
              </FieldDescription>
            </Field>
            {update.isError && (
              <Alert variant="destructive">
                <AlertTitle>Modifica non riuscita</AlertTitle>
                <AlertDescription>
                  I dati che hai scritto sono ancora qui. Riprova tra poco.
                </AlertDescription>
              </Alert>
            )}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
              <span className="text-xs text-muted-foreground">
                {dirty
                  ? "Salva per aggiornare la tua libreria"
                  : "Le modifiche sono salvate"}
              </span>
              <Button
                onClick={() => update.mutate()}
                disabled={!dirty || update.isPending}
              >
                {update.isPending ? (
                  <Spinner data-icon="inline-start" aria-hidden="true" />
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
          {game.rawgId !== null && (
            <div className="mt-6 flex flex-col items-start gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={refresh.isPending}
                onClick={() => refresh.mutate()}
              >
                {refresh.isPending ? (
                  <Spinner data-icon="inline-start" aria-hidden="true" />
                ) : (
                  <RefreshCwIcon data-icon="inline-start" />
                )}
                Aggiorna dati del gioco
              </Button>
              {refresh.isError && (
                <p className="text-sm text-destructive">
                  Aggiornamento non riuscito. Riprova tra poco.
                </p>
              )}
            </div>
          )}
          <Separator className="my-6" />
          <div className="flex flex-col items-start gap-2">
            <p className="text-xs leading-relaxed text-muted-foreground">
              La rimozione elimina anche stato, voto e nota personali.
            </p>
            <AlertDialog onOpenChange={(open) => open && remove.reset()}>
              <AlertDialogTrigger
                render={<Button variant="destructive" size="sm" />}
                disabled={remove.isPending}
              >
                <Trash2Icon data-icon="inline-start" /> Rimuovi dalla libreria
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Rimuovere {game.title}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Il gioco verrà rimosso dalla tua libreria. Stato, voto e
                    nota personali andranno persi. Questa azione non può essere
                    annullata.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                {remove.isError && (
                  <Alert variant="destructive">
                    <AlertTitle>Rimozione non riuscita</AlertTitle>
                    <AlertDescription>
                      Il gioco è ancora nella tua libreria. Riprova tra poco.
                    </AlertDescription>
                  </Alert>
                )}
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={remove.isPending}>
                    Annulla
                  </AlertDialogCancel>
                  <Button
                    variant="destructive"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate()}
                  >
                    {remove.isPending ? (
                      <Spinner data-icon="inline-start" aria-hidden="true" />
                    ) : (
                      <Trash2Icon data-icon="inline-start" />
                    )}
                    Rimuovi il gioco
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </aside>
      </div>
    </article>
  );
}
