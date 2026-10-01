import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";

import { GameCover } from "~/components/game-cover";
import { Badge } from "~/components/ui/badge";
import type { LibraryGame } from "~/modules/library/model";

import { statusLabels } from "./filter-options";

export function LibraryEntryCard({ game }: { readonly game: LibraryGame }) {
  return (
    <Link
      href={`/games/${game.id}`}
      className="group block min-w-0 overflow-hidden rounded-xl border border-border bg-card text-card-foreground transition-[transform,box-shadow] duration-300 outline-none hover:-translate-y-1 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none"
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
          <span>{game.releaseDate?.slice(0, 4) ?? "Anno ignoto"}</span>
          <span>{game.genres[0] ?? "Videogioco"}</span>
        </div>
        <h3 className="mt-4 text-2xl leading-tight font-semibold tracking-tight text-balance">
          {game.title}
        </h3>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {game.developers.join(", ") || "Sviluppatore non disponibile"}
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
  );
}
