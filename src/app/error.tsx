"use client";

import { ArrowLeftIcon, RotateCcwIcon } from "lucide-react";
import Link from "next/link";

import { StatusPage } from "~/components/status-page";
import { Button, buttonVariants } from "~/components/ui/button";

export default function ErrorPage({
  retry,
}: {
  readonly error: Error & { digest?: string };
  readonly retry: () => void;
}) {
  return (
    <StatusPage
      title="Qualcosa è andato storto"
      description="Non siamo riusciti a caricare questa pagina. Riprova; se il problema continua, torna alla libreria."
    >
      <Button type="button" size="lg" onClick={retry}>
        <RotateCcwIcon data-icon="inline-start" />
        Riprova
      </Button>
      <Link
        href="/"
        className={buttonVariants({ variant: "outline", size: "lg" })}
      >
        <ArrowLeftIcon data-icon="inline-start" />
        Torna alla libreria
      </Link>
    </StatusPage>
  );
}
