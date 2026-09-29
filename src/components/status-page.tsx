import type { ReactNode } from "react";

export function StatusPage({
  title,
  description,
  code,
  children,
}: {
  readonly title: string;
  readonly description: string;
  readonly code?: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="flex min-h-[55vh] items-center">
      <div className="w-full border-t border-border pt-8 sm:pt-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between sm:gap-12">
          <div className="max-w-2xl">
            <h1 className="text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {title}
              <span className="text-primary">.</span>
            </h1>
            <p className="mt-5 max-w-[65ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
              {description}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {children}
            </div>
          </div>
          {code && (
            <span className="font-mono text-sm text-muted-foreground sm:pt-2">
              {code}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
