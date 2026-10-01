/* oxlint-disable jsx-a11y/prefer-tag-over-role, jsx-a11y/no-noninteractive-element-to-interactive-role -- The search uses the ARIA combobox pattern with custom game options. */

import { ArrowUpRightIcon, LoaderCircleIcon, PlusIcon } from "lucide-react";

import { GameCover } from "~/components/game-cover";
import { Kbd } from "~/components/ui/kbd";

import type { SearchResult } from "./search-results";

export function SearchResultOption({
  result,
  index,
  selectedIndex,
  disabled,
  adding = false,
  onActivate,
}: {
  readonly result: SearchResult;
  readonly index: number;
  readonly selectedIndex: number;
  readonly disabled: boolean;
  readonly adding?: boolean;
  readonly onActivate: (result: SearchResult) => void;
}) {
  if (result.kind === "library") {
    const { game } = result;
    return (
      <button
        id={`global-search-option-${index}`}
        type="button"
        role="option"
        aria-selected={selectedIndex === index}
        aria-label={`Apri ${[game.title, game.releaseDate?.slice(0, 4), game.developers[0]].filter(Boolean).join(", ")} nella tua libreria`}
        disabled={disabled}
        className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left outline-none hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 aria-selected:bg-accent"
        onClick={() => onActivate(result)}
      >
        <span className="relative aspect-3/2 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
          <GameCover
            title={game.title}
            coverUrl={game.coverUrl}
            rawgId={game.rawgId}
            sizes="128px"
          />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <strong className="truncate text-sm font-medium">{game.title}</strong>
          <small className="truncate text-xs text-muted-foreground">
            {[game.releaseDate?.slice(0, 4), game.developers[0]]
              .filter(Boolean)
              .join(" · ") || "Già nella tua libreria"}
          </small>
          <span className="flex items-center gap-1 text-xs font-medium text-foreground">
            Apri nella tua libreria{" "}
            <ArrowUpRightIcon size={14} aria-hidden="true" />
          </span>
        </span>
        <Kbd aria-hidden="true" className="ml-auto shrink-0">
          ⏎
        </Kbd>
      </button>
    );
  }
  const { game } = result;
  return (
    <button
      id={`global-search-option-${index}`}
      type="button"
      role="option"
      aria-selected={selectedIndex === index}
      aria-label={`Aggiungi ${[game.title, game.releaseDate?.slice(0, 4), ...game.genres.slice(0, 2)].filter(Boolean).join(", ")} alla libreria dal catalogo RAWG`}
      disabled={disabled}
      className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left outline-none hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 aria-selected:bg-accent"
      onClick={() => onActivate(result)}
    >
      <span className="relative aspect-3/2 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
        <GameCover title={game.title} coverUrl={game.coverUrl} sizes="128px" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <strong className="truncate text-sm font-medium">{game.title}</strong>
        <small className="truncate text-xs text-muted-foreground">
          {[game.releaseDate?.slice(0, 4), ...game.genres.slice(0, 2)]
            .filter(Boolean)
            .join(" · ") || "Data e genere non disponibili"}
        </small>
        <span className="flex items-center gap-1 text-xs font-semibold text-foreground">
          {adding ? (
            <>
              <LoaderCircleIcon
                size={14}
                className="animate-spin"
                aria-hidden="true"
              />{" "}
              Aggiunta in corso…
            </>
          ) : (
            <>
              Aggiungi alla libreria <PlusIcon size={14} aria-hidden="true" />
            </>
          )}
        </span>
      </span>
      <Kbd aria-hidden="true" className="ml-auto shrink-0">
        ⏎
      </Kbd>
    </button>
  );
}
