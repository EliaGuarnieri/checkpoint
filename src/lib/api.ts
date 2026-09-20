export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function fetchJson<A>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<A> {
  const response = await fetch(input, init);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new ApiError(response.status, body?.error ?? "Request failed");
  }
  return response.json() as Promise<A>;
}
