import { Effect, Redacted } from "effect";

import {
  DatabaseQueryFailed,
  DatabaseUnavailable,
  type LibraryOperation,
} from "~/modules/library/service";

const connectionMessages = new Set([
  "Connection terminated unexpectedly",
  "Connection terminated",
  "timeout exceeded when trying to connect",
]);

// Drizzle also wraps driver connection errors that have a message but no code.
const driverDetails = (
  cause: unknown,
): { code?: string; unavailable?: boolean } => {
  let current = cause;
  const visited = new Set<unknown>();
  while (
    typeof current === "object" &&
    current !== null &&
    !visited.has(current)
  ) {
    visited.add(current);
    if ("code" in current && typeof current.code === "string")
      return { code: current.code };
    if (current instanceof Error && connectionMessages.has(current.message))
      return { unavailable: true };
    current = "cause" in current ? current.cause : undefined;
  }
  return {};
};

export const databaseFailure = (
  operation: LibraryOperation,
  cause: unknown,
): Effect.Effect<never, DatabaseUnavailable | DatabaseQueryFailed> => {
  const { code, unavailable } = driverDetails(cause);
  if (
    code &&
    (/^(08|53)/.test(code) ||
      [
        "57P01",
        "57P02",
        "57P03",
        "ECONNREFUSED",
        "ECONNRESET",
        "ETIMEDOUT",
        "ENOTFOUND",
        "EPIPE",
        "EAI_AGAIN",
      ].includes(code))
  ) {
    return Effect.fail(
      new DatabaseUnavailable({ operation, code, cause: Redacted.make(cause) }),
    );
  }
  if (code && /^[0-9A-Z]{5}$/.test(code)) {
    return Effect.fail(
      new DatabaseQueryFailed({ operation, code, cause: Redacted.make(cause) }),
    );
  }
  if (unavailable) {
    return Effect.fail(
      new DatabaseUnavailable({ operation, cause: Redacted.make(cause) }),
    );
  }
  // Unknown JavaScript exceptions and impossible adapter results are defects.
  return Effect.die(cause);
};
