import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import { StatusPage } from "~/components/status-page";
import { buttonVariants } from "~/components/ui/button";

export default function NotFoundPage() {
  return (
    <StatusPage
      title="Pagina non trovata"
      description="L'indirizzo che hai aperto non corrisponde a una pagina di Checkpoint. Torna alla libreria per continuare."
      code="404"
    >
      <Link href="/" className={buttonVariants({ size: "lg" })}>
        <ArrowLeftIcon data-icon="inline-start" />
        Torna alla libreria
      </Link>
    </StatusPage>
  );
}
