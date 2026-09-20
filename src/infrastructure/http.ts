import { Cause, Effect, Exit } from "effect";

export const runHttp = async <A, E>(effect: Effect.Effect<A, E, never>) => {
  const exit = await Effect.runPromiseExit(effect);
  if (Exit.isSuccess(exit)) return Response.json(exit.value);

  const failure = Cause.failureOption(exit.cause);
  if (failure._tag === "Some") {
    const error = failure.value;
    const tag =
      typeof error === "object" && error !== null && "_tag" in error
        ? String(error._tag)
        : "UnexpectedError";
    const status =
      tag === "LibraryEntryNotFound" ? 404 : tag === "ParseError" ? 400 : 503;
    return Response.json({ error: tag }, { status });
  }
  return Response.json({ error: "UnexpectedError" }, { status: 500 });
};
