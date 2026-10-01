import { SearchIcon, SlidersHorizontalIcon } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Field, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Slider } from "~/components/ui/slider";
import type { LibraryGame } from "~/modules/library/model";

import { statuses } from "./filter-options";
import type { LibraryViewFilters, ActiveFilter } from "./use-library-filters";

export function LibraryFilters({
  filters,
  activeFilters,
  entriesMatchingNonStatusCriteria,
  onChange,
  onReset,
}: {
  readonly filters: LibraryViewFilters;
  readonly activeFilters: ReadonlyArray<ActiveFilter>;
  readonly entriesMatchingNonStatusCriteria?: ReadonlyArray<LibraryGame>;
  readonly onChange: (fields: Partial<LibraryViewFilters>) => void;
  readonly onReset: () => void;
}) {
  const { query, status, genre, developer, publisher, minimumRating } = filters;

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-border pb-3 md:flex-row md:items-start md:justify-between">
        <fieldset className="flex min-w-0 gap-1 overflow-x-auto pb-1">
          <legend className="sr-only">Filtra per stato</legend>
          {statuses.map((item) => {
            const count = entriesMatchingNonStatusCriteria
              ? item.value === "all"
                ? entriesMatchingNonStatusCriteria.length
                : entriesMatchingNonStatusCriteria.filter(
                    (entry) => entry.status === item.value,
                  ).length
              : undefined;
            return (
              <Button
                key={item.value}
                type="button"
                variant={status === item.value ? "default" : "ghost"}
                size="sm"
                className="h-11 shrink-0 rounded-full sm:h-7"
                onClick={() => onChange({ status: item.value })}
                aria-pressed={status === item.value}
              >
                {item.label}
                <span className="ml-1 opacity-70">{count ?? "—"}</span>
              </Button>
            );
          })}
        </fieldset>
        <details className="group relative shrink-0">
          <summary className="flex h-11 cursor-pointer list-none items-center gap-2 rounded-lg px-2.5 text-[0.8rem] font-medium text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring sm:h-7 [&::-webkit-details-marker]:hidden">
            <SlidersHorizontalIcon size={17} aria-hidden="true" /> Filtri{" "}
            {activeFilters.length > 0 && (
              <Badge variant="secondary">{activeFilters.length}</Badge>
            )}
          </summary>
          <div className="z-20 mt-2 grid gap-4 rounded-xl border border-border bg-popover p-4 shadow-xl md:absolute md:right-0 md:w-90">
            <Field>
              <FieldLabel htmlFor="library-query">Titolo</FieldLabel>
              <div className="relative">
                <SearchIcon
                  size={16}
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="library-query"
                  value={query}
                  onChange={(event) => onChange({ query: event.target.value })}
                  placeholder="Cerca per titolo"
                  className="pl-9"
                />
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="library-genre">Genere</FieldLabel>
              <Input
                id="library-genre"
                value={genre}
                onChange={(event) => onChange({ genre: event.target.value })}
                placeholder="Es. RPG"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="library-developer">Sviluppatore</FieldLabel>
              <Input
                id="library-developer"
                value={developer}
                onChange={(event) =>
                  onChange({ developer: event.target.value })
                }
                placeholder="Es. Supergiant Games"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="library-publisher">Publisher</FieldLabel>
              <Input
                id="library-publisher"
                value={publisher}
                onChange={(event) =>
                  onChange({ publisher: event.target.value })
                }
                placeholder="Es. Annapurna"
              />
            </Field>
            <Field>
              <FieldLabel>Voto minimo</FieldLabel>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Qualsiasi voto</span>
                <strong className="font-semibold tabular-nums">
                  {minimumRating ? `${minimumRating}/10` : "—"}
                </strong>
              </div>
              <Slider
                min={0}
                max={10}
                step={1}
                value={minimumRating}
                onValueChange={(value) => {
                  if (typeof value === "number")
                    onChange({ minimumRating: value });
                }}
                thumbLabel="Voto minimo"
                valueText={
                  minimumRating
                    ? `Almeno ${minimumRating} su 10`
                    : "Nessun voto minimo"
                }
                className="py-3"
              />
            </Field>
            <Button variant="ghost" onClick={onReset}>
              Azzera filtri
            </Button>
          </div>
        </details>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>Filtri attivi:</span>
          {activeFilters.map(({ label, value }) => (
            <Badge
              key={label}
              variant="secondary"
              className="max-w-full break-all"
            >
              {label}: {value}
            </Badge>
          ))}
        </div>
      )}
    </>
  );
}
