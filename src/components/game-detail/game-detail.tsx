"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Spinner } from "~/components/ui/spinner";
import { useLibraryEntry } from "~/modules/library/hooks";

import { GameDetailEditor } from "./game-detail-editor";

export function GameDetail({ gameId }: { readonly gameId: string }) {
  const retryRequested = useRef(false);
  const game = useLibraryEntry(gameId);
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
