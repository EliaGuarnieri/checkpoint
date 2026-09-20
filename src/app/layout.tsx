import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "~/components/app-shell";
import { Providers } from "~/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Checkpoint — il tuo diario videoludico",
  description: "Importa, organizza e racconta i videogiochi che hai giocato.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
