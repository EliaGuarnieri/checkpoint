"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, SearchIcon } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "~/components/ui/empty";
import { Field, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { fetchJson } from "~/lib/api";
import type { CatalogGame } from "~/modules/catalog/model";

export function CatalogSearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const queryClient = useQueryClient();
  const search = useQuery({
    queryKey: ["catalog-search", query],
    queryFn: () =>
      fetchJson<ReadonlyArray<CatalogGame>>(
        `/api/catalog/search?query=${encodeURIComponent(query)}`,
      ),
    enabled: open && query.trim().length >= 2,
  });
  const addGame = useMutation({
    mutationFn: (game: CatalogGame) =>
      fetchJson<{ added: true }>("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(game),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["library"] });
      setOpen(false);
      setQuery("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon data-icon="inline-start" />
        Aggiungi gioco
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Aggiungi dalla ricerca</DialogTitle>
          <DialogDescription>
            Cerca nel catalogo. Il gioco verrà aggiunto al backlog.
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="catalog-query">Titolo</FieldLabel>
          <div className="relative">
            <SearchIcon className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              id="catalog-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-9"
              placeholder="Hades, Celeste…"
            />
          </div>
        </Field>
        <div className="max-h-80 overflow-y-auto">
          {search.isFetching ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Spinner />
              Ricerca in corso…
            </div>
          ) : search.data?.length ? (
            <ul className="flex flex-col gap-2">
              {search.data.map((game) => (
                <li
                  key={game.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{game.title}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {game.genres.slice(0, 2).map((genre) => (
                        <Badge key={genre} variant="secondary">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addGame.mutate(game)}
                    disabled={addGame.isPending}
                  >
                    Aggiungi
                  </Button>
                </li>
              ))}
            </ul>
          ) : query.trim().length >= 2 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Nessun risultato</EmptyTitle>
                <EmptyDescription>
                  Prova con un titolo diverso.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : null}
        </div>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
