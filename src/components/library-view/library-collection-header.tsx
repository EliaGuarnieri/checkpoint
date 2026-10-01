import type { RefObject } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

import { isSort, sortLabels, type Sort } from "./filter-options";

export function LibraryCollectionHeader({
  collectionHeading,
  countLabel,
  sort,
  onSortChange,
}: {
  readonly collectionHeading: RefObject<HTMLHeadingElement | null>;
  readonly countLabel: string;
  readonly sort: Sort;
  readonly onSortChange: (sort: Sort) => void;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-baseline gap-3">
        <h2
          ref={collectionHeading}
          tabIndex={-1}
          className="text-2xl font-semibold tracking-tight focus-visible:ring-2 focus-visible:ring-ring sm:text-3xl"
        >
          La collezione
        </h2>
        <span className="text-sm text-muted-foreground" aria-live="polite">
          {countLabel}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="whitespace-nowrap">Ordina per</span>
        <Select
          value={sort}
          onValueChange={(value) => {
            if (isSort(value)) onSortChange(value);
          }}
        >
          <SelectTrigger
            aria-label="Ordina libreria"
            className="w-47.5 data-[size=default]:h-11 sm:data-[size=default]:h-8"
          >
            <SelectValue>
              {(value) => (isSort(value) ? sortLabels[value] : "Ordina")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {(Object.keys(sortLabels) as Sort[]).map((value) => (
                <SelectItem key={value} value={value}>
                  {sortLabels[value]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
