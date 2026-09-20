export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const ErrorResponse = Schema.Struct({ error: Schema.String });

export async function fetchJson<A, I>(
  schema: Schema.Schema<A, I>,
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<A> {
  const response = await fetch(input, init);
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const decoded = await Schema.decodeUnknownPromise(ErrorResponse)(
      body,
    ).catch(() => ({ error: "Request failed" }));
    throw new ApiError(response.status, decoded.error);
  }
  const body: unknown = await response.json();
  return Schema.decodeUnknownPromise(schema)(body);
}
import { Schema } from "effect";
