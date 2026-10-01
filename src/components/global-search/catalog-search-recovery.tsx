import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";

import type { useGlobalSearch } from "./use-global-search";

type Props = ReturnType<
  typeof useGlobalSearch
>["panelProps"]["retryCatalogProps"];

export function CatalogSearchRecovery({
  isFetching,
  onFocus,
  onBlur,
  onRetry,
}: Props) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Catalogo non disponibile</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <span>
          Non è stato possibile cercare i giochi nel catalogo. Riprova la
          ricerca corrente.
        </span>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 min-w-11 self-start"
          aria-disabled={isFetching}
          onFocus={onFocus}
          onBlur={onBlur}
          onClick={onRetry}
        >
          {isFetching && (
            <Spinner
              data-icon="inline-start"
              aria-hidden="true"
              className="motion-reduce:animate-none"
            />
          )}
          {isFetching ? "Riprovo…" : "Riprova"}
        </Button>
        <output className="sr-only" aria-label="Ricerca nel catalogo">
          {isFetching ? "Riprovo…" : "Ricerca non riuscita"}
        </output>
      </AlertDescription>
    </Alert>
  );
}
