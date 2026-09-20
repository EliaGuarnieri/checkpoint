import { Data, Effect } from "effect";

export class InvalidJsonBody extends Data.TaggedError("InvalidJsonBody")<{
  readonly cause: unknown;
}> {}

export const jsonBody = (request: Request) =>
  Effect.tryPromise({
    try: async () => {
      const body: unknown = await request.json();
      return body;
    },
    catch: (cause) => new InvalidJsonBody({ cause }),
  });
