import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { useRemoveLibraryEntry } from "~/modules/library/hooks";

export function RemoveLibraryEntryDialog({
  entryId,
  gameTitle,
}: {
  readonly entryId: string;
  readonly gameTitle: string;
}) {
  const router = useRouter();
  const remove = useRemoveLibraryEntry(entryId);

  return (
    <AlertDialog onOpenChange={(open) => open && remove.reset()}>
      <AlertDialogTrigger
        render={<Button variant="destructive" size="sm" />}
        disabled={remove.isPending}
      >
        <Trash2Icon data-icon="inline-start" /> Rimuovi dalla libreria
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Rimuovere {gameTitle}?</AlertDialogTitle>
          <AlertDialogDescription>
            Il gioco verrà rimosso dalla tua libreria. Stato, voto e nota
            personali andranno persi. Questa azione non può essere annullata.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {remove.isError && (
          <Alert variant="destructive">
            <AlertTitle>Rimozione non riuscita</AlertTitle>
            <AlertDescription>
              Il gioco è ancora nella tua libreria. Riprova tra poco.
            </AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>
            Annulla
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={remove.isPending}
            onClick={() =>
              remove.mutate(undefined, {
                onSuccess: () => router.push("/"),
              })
            }
          >
            {remove.isPending ? (
              <Spinner data-icon="inline-start" aria-hidden="true" />
            ) : (
              <Trash2Icon data-icon="inline-start" />
            )}
            Rimuovi il gioco
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
