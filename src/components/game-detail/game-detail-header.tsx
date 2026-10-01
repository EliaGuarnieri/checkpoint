import { GameCover } from "~/components/game-cover";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import type { LibraryGame } from "~/modules/library/model";

import { statuses } from "./tracking-status";

export function GameDetailHeader({ game }: { readonly game: LibraryGame }) {
  return (
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
  );
}
