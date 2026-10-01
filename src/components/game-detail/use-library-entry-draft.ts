import { useState } from "react";

import type {
  LibraryEntryUpdate,
  LibraryGame,
  TrackingStatus,
} from "~/modules/library/model";

type LibraryEntryDraft = {
  readonly revision: string;
  readonly status: TrackingStatus;
  readonly rating: number;
  readonly note: string;
};

const createDraft = (game: LibraryGame): LibraryEntryDraft => ({
  revision: game.updatedAt,
  status: game.status,
  rating: game.rating ?? 0,
  note: game.note ?? "",
});

export function useLibraryEntryDraft(game: LibraryGame) {
  const [storedDraft, setDraft] = useState(() => createDraft(game));
  const draft =
    storedDraft.revision === game.updatedAt ? storedDraft : createDraft(game);
  const dirty =
    draft.status !== game.status ||
    draft.rating !== (game.rating ?? 0) ||
    draft.note !== (game.note ?? "");

  const change = (fields: Partial<Omit<LibraryEntryDraft, "revision">>) => {
    setDraft((previous) => ({
      ...(previous.revision === game.updatedAt ? previous : createDraft(game)),
      ...fields,
    }));
  };

  const toUpdate = (): LibraryEntryUpdate => ({
    status: draft.status,
    rating: draft.rating || null,
    note: draft.note || null,
  });

  return { draft, dirty, change, toUpdate };
}
