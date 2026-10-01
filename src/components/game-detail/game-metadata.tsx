import { RefreshCwIcon } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Spinner } from "~/components/ui/spinner";
import { useRefreshLibraryEntryMetadata } from "~/modules/library/hooks";
import type { LibraryGame } from "~/modules/library/model";

import { RemoveLibraryEntryDialog } from "./remove-library-entry-dialog";

export function GameMetadata({ game }: { readonly game: LibraryGame }) {
  const refresh = useRefreshLibraryEntryMetadata(game.id);

  return (
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
        <RemoveLibraryEntryDialog entryId={game.id} gameTitle={game.title} />
      </div>
    </aside>
  );
}
