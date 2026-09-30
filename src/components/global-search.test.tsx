// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GlobalSearch } from "./global-search";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("~/components/game-cover", () => ({ GameCover: () => null }));
Element.prototype.scrollIntoView = vi.fn();

const libraryEntry = {
  id: "entry-1",
  rawgId: 1,
  title: "Hades",
  slug: "hades",
  coverUrl: null,
  releaseDate: "2020-09-17",
  status: "playing",
  rating: 9,
  note: null,
  genres: ["Roguelike"],
  developers: ["Supergiant Games"],
  publishers: ["Supergiant Games"],
  updatedAt: "2026-09-20T12:00:00.000Z",
};

const catalogGames = [
  {
    id: "1",
    title: "Hades",
    slug: "hades",
    coverUrl: null,
    releaseDate: "2020-09-17",
    genres: ["Roguelike"],
  },
  {
    id: "2",
    title: "Hades",
    slug: "hades-1998",
    coverUrl: null,
    releaseDate: "1998-01-01",
    genres: ["Strategy"],
  },
  {
    id: "3",
    title: "Hades II",
    slug: "hades-2",
    coverUrl: null,
    releaseDate: "2025-09-25",
    genres: ["Action"],
  },
  {
    id: "4",
    title: "Hades",
    slug: "hades-1998-adventure",
    coverUrl: null,
    releaseDate: "1998-02-01",
    genres: ["Adventure"],
  },
];

type MockResponse = {
  ok: boolean;
  status?: number;
  json: () => Promise<unknown>;
};

function renderSearch(
  post: () => Promise<MockResponse> = async () => ({
    ok: true,
    json: async () => ({ added: true, id: "entry-2" }),
  }),
) {
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") return post();
      if (typeof input === "string" && input.startsWith("/api/catalog/search"))
        return { ok: true, json: async () => catalogGames };
      return { ok: true, json: async () => [libraryEntry] };
    },
  );
  vi.stubGlobal("fetch", fetchMock);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <GlobalSearch />
    </QueryClientProvider>,
  );
  return fetchMock;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  push.mockClear();
});

describe("global search", () => {
  it("explains where to add a game on focus and distinguishes homonymous results", async () => {
    const user = userEvent.setup();
    renderSearch();
    const input = screen.getByRole("combobox", {
      name: /libreria.*catalogo RAWG/i,
    });
    await user.click(input);
    expect(screen.getByText(/catalogo RAWG per aggiungere/i)).toBeTruthy();

    await user.type(input, "Hades");
    await screen.findByRole("option", {
      name: /Apri Hades.*nella tua libreria/i,
    });
    const catalogOptions = await screen.findAllByRole("option", {
      name: /Aggiungi .* dal catalogo RAWG/i,
    });
    expect(catalogOptions).toHaveLength(3);
    expect(
      screen.getByRole("heading", { name: /Nella tua libreria.*Apri/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: /Catalogo RAWG.*Aggiungi/i }),
    ).toBeTruthy();
    expect(catalogOptions[0].textContent).toContain("1998");
    expect(catalogOptions[0].textContent).toContain("Strategy");
    expect(catalogOptions[1].textContent).toContain("2025");
    expect(catalogOptions[2].textContent).toContain("1998");
    expect(catalogOptions[0].getAttribute("aria-label")).toContain("Strategy");
    expect(catalogOptions[2].getAttribute("aria-label")).toContain("Adventure");
  });

  it("opens an existing entry by click and adds a catalog game by keyboard only after selection", async () => {
    const user = userEvent.setup();
    const fetchMock = renderSearch();
    const input = screen.getByRole("combobox");
    await user.type(input, "Hades");
    await screen.findByRole("option", {
      name: /Aggiungi Hades, 1998, Strategy.*dal catalogo RAWG/i,
    });

    fireEvent.keyDown(input, { key: "Enter" });
    expect(push).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("option", { name: /Apri Hades.*nella tua libreria/i }),
    );
    expect(push).toHaveBeenCalledWith("/games/entry-1");
    expect(
      fetchMock.mock.calls.filter(([, init]) => init?.method === "POST"),
    ).toHaveLength(0);

    await user.type(input, "Hades");
    await screen.findByRole("option", {
      name: /Aggiungi Hades, 1998, Strategy.*dal catalogo RAWG/i,
    });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(push).toHaveBeenCalledWith("/games/entry-2"));
    const posts = fetchMock.mock.calls.filter(
      ([, init]) => init?.method === "POST",
    );
    expect(posts).toHaveLength(1);
    const body = posts[0]?.[1]?.body;
    if (typeof body !== "string")
      throw new Error("Expected a JSON request body");
    expect(JSON.parse(body)).toEqual({ id: "2" });
  });

  it("announces a failed addition, keeps the query, and allows retry by touch or click", async () => {
    const user = userEvent.setup();
    let attempt = 0;
    const fetchMock = renderSearch(async () => {
      attempt += 1;
      return attempt === 1
        ? {
            ok: false,
            status: 503,
            json: async () => ({ error: "Unavailable" }),
          }
        : { ok: true, json: async () => ({ added: true, id: "entry-2" }) };
    });
    const input = screen.getByRole("combobox");
    await user.type(input, "Hades");
    const option = await screen.findByRole("option", {
      name: /Aggiungi Hades, 1998, Strategy.*dal catalogo RAWG/i,
    });
    await user.click(option);
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(input).toHaveProperty("value", "Hades");
    await user.click(option);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/games/entry-2"));
    expect(
      fetchMock.mock.calls.filter(([, init]) => init?.method === "POST"),
    ).toHaveLength(2);
  });

  it("announces the pending addition and sends one request for repeated activation", async () => {
    const user = userEvent.setup();
    let resolvePost: ((value: MockResponse) => void) | undefined;
    const pendingPost = new Promise<MockResponse>((resolve) => {
      resolvePost = resolve;
    });
    const fetchMock = renderSearch(() => pendingPost);
    await user.type(screen.getByRole("combobox"), "Hades");
    const option = await screen.findByRole("option", {
      name: /Aggiungi Hades, 1998, Strategy.*dal catalogo RAWG/i,
    });
    fireEvent.click(option);
    fireEvent.click(option);
    expect((await screen.findByRole("status")).textContent).toContain(
      "Aggiungo Hades",
    );
    expect(
      fetchMock.mock.calls.filter(([, init]) => init?.method === "POST"),
    ).toHaveLength(1);
    if (!resolvePost) throw new Error("POST was not ready");
    resolvePost({
      ok: true,
      json: async () => ({ added: true, id: "entry-2" }),
    });
    await waitFor(() => expect(push).toHaveBeenCalledWith("/games/entry-2"));
  });
});
