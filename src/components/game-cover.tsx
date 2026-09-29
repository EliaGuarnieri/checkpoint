"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";

import { fetchJson } from "~/lib/api";
import { CatalogGameSchema } from "~/modules/catalog/model";

function rawgImage(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === "media.rawg.io"
      ? url
      : null;
  } catch {
    return null;
  }
}

export function GameCover({
  title,
  coverUrl,
  rawgId,
  sizes,
  priority = false,
}: {
  readonly title: string;
  readonly coverUrl: string | null;
  readonly rawgId?: number | null;
  readonly sizes: string;
  readonly priority?: boolean;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const missingCover = !rawgImage(coverUrl);
  const catalogGame = useQuery({
    queryKey: ["catalog-game", rawgId],
    queryFn: () => fetchJson(CatalogGameSchema, `/api/catalog/games/${rawgId}`),
    enabled: missingCover && rawgId != null,
    staleTime: 1000 * 60 * 60,
    retry: false,
  });
  const imageUrl =
    rawgImage(coverUrl) ?? rawgImage(catalogGame.data?.coverUrl ?? null);

  return (
    <div className="relative size-full overflow-hidden bg-muted">
      {imageUrl && imageUrl !== failedUrl ? (
        <Image
          src={imageUrl}
          alt={`Cover di ${title}`}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
          onError={() => setFailedUrl(imageUrl)}
        />
      ) : (
        <div
          className="flex size-full items-end bg-secondary p-5 text-secondary-foreground"
          aria-label={`Cover di ${title} non disponibile`}
        >
          <span className="max-w-full text-xl leading-tight font-semibold text-balance">
            {title}
          </span>
        </div>
      )}
    </div>
  );
}
