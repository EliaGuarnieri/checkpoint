import { ArrowLeftIcon, SaveIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
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
import { Slider } from "~/components/ui/slider";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { useUpdateLibraryEntry } from "~/modules/library/hooks";
import type { LibraryGame } from "~/modules/library/model";

import { GameDetailHeader } from "./game-detail-header";
import { GameMetadata } from "./game-metadata";
import { isTrackingStatus, statuses } from "./tracking-status";
import { UnsavedChangesDialog } from "./unsaved-changes-dialog";
import { useLibraryEntryDraft } from "./use-library-entry-draft";

export function GameDetailEditor({ game }: { readonly game: LibraryGame }) {
  const { draft, dirty, change, toUpdate } = useLibraryEntryDraft(game);
  const { status, rating, note } = draft;
  const saveFocusRequested = useRef(false);
  const saveStatus = useRef<HTMLOutputElement>(null);
  const update = useUpdateLibraryEntry(game.id);
  useEffect(() => {
    if (!dirty && update.isSuccess && saveFocusRequested.current) {
      saveFocusRequested.current = false;
      saveStatus.current?.focus();
    }
  }, [dirty, update.isSuccess]);

  return (
    <article className="space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeftIcon size={17} aria-hidden="true" /> Torna alla libreria
      </Link>
      <UnsavedChangesDialog dirty={dirty} />

      <GameDetailHeader game={game} />

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
                      change({ status: value });
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
                  onValueChange={(value) => {
                    if (typeof value === "number") change({ rating: value });
                  }}
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
                onChange={(event) => change({ note: event.target.value })}
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
                onClick={() =>
                  update.mutate(toUpdate(), {
                    onSuccess: () => {
                      saveFocusRequested.current = true;
                    },
                  })
                }
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

        <GameMetadata game={game} />
      </div>
    </article>
  );
}
