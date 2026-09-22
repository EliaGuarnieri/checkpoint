import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "~/components/app-shell";
import { Providers } from "~/components/providers";
import { Geist, Geist_Mono } from "next/font/google";

import "~/styles/globals.css";
import { cn } from "cn";

export const metadata: Metadata = {
  title: "Checkpoint — il tuo diario videoludico",
  description: "Importa, organizza e racconta i videogiochi che hai giocato.",
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="it"
      className={cn(
        "typeset typeset-docs h-full antialiased",
        geist.variable,
        geistMono.variable,
      )}
    >
      <body className="flex min-h-full flex-col">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
