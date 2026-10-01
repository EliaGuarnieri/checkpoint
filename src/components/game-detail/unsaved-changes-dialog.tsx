import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";

import { useUnsavedChangesGuard } from "./use-unsaved-changes-guard";

export function UnsavedChangesDialog({ dirty }: { readonly dirty: boolean }) {
  const { leaveOpen, leaveTarget, onLeaveOpenChange, confirmLeave } =
    useUnsavedChangesGuard(dirty);

  return (
    <AlertDialog open={leaveOpen} onOpenChange={onLeaveOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hai modifiche non salvate</AlertDialogTitle>
          <AlertDialogDescription>
            {leaveTarget === "library"
              ? "Se torni alla libreria, perderai le modifiche a stato, voto e nota."
              : "Se lasci questa pagina, perderai le modifiche a stato, voto e nota."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Resta qui</AlertDialogCancel>
          <Button variant="destructive" onClick={confirmLeave}>
            {leaveTarget === "library"
              ? "Scarta e torna alla libreria"
              : "Scarta e continua"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
