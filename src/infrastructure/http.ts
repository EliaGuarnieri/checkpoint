import {
  Cause,
  Effect,
  Exit,
  ManagedRuntime,
  Option,
  ParseResult,
} from "effect";

import { ConfigurationInvalid } from "~/infrastructure/config";
import { InvalidJsonBody } from "~/infrastructure/request";
import { type CatalogError } from "~/modules/catalog/service";
import {
  type LibraryCatalogIdMissing,
  type LibraryEntryNotFound,
  type LibraryPersistenceError,
} from "~/modules/library/service";

export type HttpError =
  | ConfigurationInvalid
  | InvalidJsonBody
  | ParseResult.ParseError
  | CatalogError
  | LibraryPersistenceError
  | LibraryEntryNotFound
  | LibraryCatalogIdMissing;

const failureStatus = (error: HttpError): number => {
  switch (error._tag) {
    case "LibraryEntryNotFound":
      return 404;
    case "LibraryCatalogIdMissing":
      return 422;
    case "ParseError":
    case "InvalidJsonBody":
      return 400;
    case "CatalogUnavailable":
    case "DatabaseUnavailable":
      return 503;
    case "CatalogTimeout":
      return 504;
    case "CatalogResponseInvalid":
      return 502;
    case "CatalogHttpError":
      return error.status === 404 ? 404 : error.status === 429 ? 503 : 502;
    case "ConfigurationInvalid":
    case "DatabaseQueryFailed":
      return 500;
    default: {
      const unreachable: never = error;
      return unreachable;
    }
  }
};

export const runHttp = async <A, R>(
  effect: Effect.Effect<A, HttpError, R>,
  runtime: ManagedRuntime.ManagedRuntime<R, ConfigurationInvalid>,
  request: Request,
) => {
  const exit = await runtime.runPromiseExit(effect, { signal: request.signal });
  if (Exit.isSuccess(exit)) return Response.json(exit.value);

  if (Cause.isInterruptedOnly(exit.cause)) {
    return Response.json({ error: "RequestInterrupted" }, { status: 499 });
  }
  const failure = Cause.failureOption(exit.cause);
  // A defect must remain a 500 even if another branch has a typed failure.
  const error =
    Option.isSome(failure) && Option.isNone(Cause.dieOption(exit.cause))
      ? failure.value
      : undefined;
  const status = error ? failureStatus(error) : 500;
  if (status >= 500) {
    await Effect.runPromise(
      Effect.logError("HTTP request failed", exit.cause).pipe(
        Effect.annotateLogs({
          method: request.method,
          path: new URL(request.url).pathname,
        }),
      ),
    );
  }
  return Response.json({ error: error?._tag ?? "UnexpectedError" }, { status });
};
