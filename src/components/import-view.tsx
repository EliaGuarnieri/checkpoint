"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Schema } from "effect";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  DownloadIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { fetchJson } from "~/lib/api";
import {
  SteamImportPreviewSchema,
  type SteamImportPreview,
} from "~/modules/steam-import/model";

const ImportConfirmationResponse = Schema.Struct({ imported: Schema.Number });

export function ImportView() {
  const [steamId, setSteamId] = useState("demo");
  const [preview, setPreview] = useState<SteamImportPreview | null>(null);
  const [acceptedCandidates, setAcceptedCandidates] = useState<
    ReadonlyArray<string>
  >([]);
  const queryClient = useQueryClient();
  const previewImport = useMutation({
    mutationFn: () =>
      fetchJson(SteamImportPreviewSchema, "/api/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steamId }),
      }),
    onSuccess: (result) => {
      setPreview(result);
      setAcceptedCandidates([]);
    },
  });
  const confirmImport = useMutation({
    mutationFn: () => {
      const games = [
        ...(preview?.newGames.map(({ steamAppId, game }) => ({
          steamAppId,
          game,
        })) ?? []),
        ...(preview?.candidates
          .filter(({ steamAppId }) => acceptedCandidates.includes(steamAppId))
          .map(({ steamAppId, candidate }) => ({
            steamAppId,
            game: candidate,
          })) ?? []),
      ];
      return fetchJson(ImportConfirmationResponse, "/api/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ games }),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["library"] });
      setPreview(null);
    },
  });

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div>
        <p className="text-sm font-medium text-primary">Importazione guidata</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Importa da Steam
        </h1>
        <p className="mt-2 text-muted-foreground">
          Prima controlliamo ogni corrispondenza. Nulla viene salvato senza
          conferma.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Libreria Steam</CardTitle>
          <CardDescription>
            In modalità demo usa lo SteamID precompilato. In modalità live il
            profilo deve rendere pubblici i giochi posseduti.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="steam-id">SteamID</FieldLabel>
              <Input
                id="steam-id"
                value={steamId}
                onChange={(event) => setSteamId(event.target.value)}
              />
              <FieldDescription>
                Massimo 100 giochi per importazione.
              </FieldDescription>
            </Field>
            <Button
              onClick={() => previewImport.mutate()}
              disabled={previewImport.isPending || !steamId.trim()}
            >
              {previewImport.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <DownloadIcon data-icon="inline-start" />
              )}
              Prepara anteprima
            </Button>
          </FieldGroup>
        </CardContent>
      </Card>
      {(previewImport.isError || confirmImport.isError) && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>Importazione non riuscita</AlertTitle>
          <AlertDescription>
            {confirmImport.isError
              ? "Nessun nuovo gioco è stato confermato. La preview resta disponibile per riprovare."
              : "Non è stato possibile leggere la libreria Steam. Controlla lo SteamID e la configurazione."}
          </AlertDescription>
        </Alert>
      )}
      {preview && (
        <div className="flex flex-col gap-4">
          <Alert>
            <CheckCircle2Icon />
            <AlertTitle>Anteprima pronta</AlertTitle>
            <AlertDescription>
              {preview.newGames.length} nuovi, {preview.existingGames.length}{" "}
              già presenti, {preview.candidates.length} da confermare,{" "}
              {preview.unmatchedGames.length} non riconosciuti.
            </AlertDescription>
          </Alert>
          <PreviewSection
            title="Nuovi giochi"
            description="Verranno aggiunti al backlog."
          >
            {preview.newGames.map(({ steamAppId, title, game }) => (
              <PreviewRow
                key={steamAppId}
                title={title}
                detail={game.developers.join(", ")}
                badge="Nuovo"
              />
            ))}
          </PreviewSection>
          <PreviewSection
            title="Già presenti"
            description="I dati personali non verranno modificati."
          >
            {preview.existingGames.map(({ steamAppId, title }) => (
              <PreviewRow key={steamAppId} title={title} badge="Presente" />
            ))}
          </PreviewSection>
          <PreviewSection
            title="Candidati"
            description="Queste corrispondenze basate sul titolo richiedono una scelta."
          >
            {preview.candidates.map(({ steamAppId, ownedTitle, candidate }) => (
              <Field key={steamAppId} orientation="horizontal">
                <Checkbox
                  id={`candidate-${steamAppId}`}
                  checked={acceptedCandidates.includes(steamAppId)}
                  onCheckedChange={(checked) =>
                    setAcceptedCandidates((current) =>
                      checked
                        ? [...current, steamAppId]
                        : current.filter((id) => id !== steamAppId),
                    )
                  }
                />
                <FieldLabel htmlFor={`candidate-${steamAppId}`}>
                  {ownedTitle} → {candidate.title}
                </FieldLabel>
              </Field>
            ))}
          </PreviewSection>
          {(preview.unmatchedGames.length > 0 ||
            preview.failures.length > 0) && (
            <Alert variant="destructive">
              <AlertTriangleIcon />
              <AlertTitle>Elementi non importati</AlertTitle>
              <AlertDescription>
                {[...preview.unmatchedGames, ...preview.failures]
                  .map(({ title }) => title)
                  .join(", ")}
              </AlertDescription>
            </Alert>
          )}
          <Button
            className="self-end"
            onClick={() => confirmImport.mutate()}
            disabled={confirmImport.isPending}
          >
            {confirmImport.isPending ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <CheckCircle2Icon data-icon="inline-start" />
            )}
            Conferma importazione
          </Button>
        </div>
      )}
    </div>
  );
}

function PreviewSection({
  title,
  description,
  children,
}: {
  readonly title: string;
  readonly description: string;
  readonly children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {children || (
          <p className="text-sm text-muted-foreground">Nessun elemento.</p>
        )}
      </CardContent>
    </Card>
  );
}

function PreviewRow({
  title,
  detail,
  badge,
}: {
  readonly title: string;
  readonly detail?: string;
  readonly badge: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
      <div>
        <p className="font-medium">{title}</p>
        {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
      </div>
      <Badge variant="secondary">{badge}</Badge>
    </div>
  );
}
