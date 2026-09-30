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

import { GameDetail } from "./game-detail";
import { GlobalSearch } from "./global-search";

const push = vi.fn();
const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }) }));

const savedEntry = {
  id: "entry-1",
  rawgId: null,
  title: "Hades",
  slug: "hades",
  coverUrl: null,
  releaseDate: "2020-09-17",
  status: "playing",
  rating: 9,
  note: "Prima nota",
  genres: ["Roguelike"],
  developers: ["Supergiant Games"],
  publishers: ["Supergiant Games"],
  updatedAt: "2026-09-20T12:00:00.000Z",
};

function response(body: unknown, ok = true) {
  return { ok, status: ok ? 200 : 503, json: async () => body };
}

function renderDetail(
  getEntry: () => Promise<ReturnType<typeof response>>,
  patch: () => Promise<ReturnType<typeof response>> = async () =>
    response({ updated: true }),
  refresh: () => Promise<ReturnType<typeof response>> = async () =>
    response(savedEntry),
  withSearch = false,
  withHistory = true,
) {
  window.history.replaceState(null, "", "/");
  if (withHistory) {
    window.history.pushState(null, "", `/games/${savedEntry.id}`);
  } else {
    window.history.replaceState(null, "", `/games/${savedEntry.id}`);
  }
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method === "PATCH") return patch();
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (init?.method === "POST" && url.endsWith("/refresh")) return refresh();
    if (url === "/api/library")
      return Promise.resolve(
        response([
          savedEntry,
          { ...savedEntry, id: "entry-2", title: "Celeste", slug: "celeste" },
        ]),
      );
    if (url.startsWith("/api/catalog/search"))
      return Promise.resolve(response([]));
    return getEntry();
  });
  vi.stubGlobal("fetch", fetchMock);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      {withSearch && <GlobalSearch />}
      <GameDetail gameId={savedEntry.id} />
    </QueryClientProvider>,
  );
  return fetchMock;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  push.mockClear();
  replace.mockClear();
  window.history.replaceState(null, "", "/");
});

describe("library entry detail", () => {
  it("keeps the game identity and offers a direct path to the first editor field", async () => {
    const user = userEvent.setup();
    renderDetail(async () => response(savedEntry));

    expect(await screen.findByRole("heading", { name: "Hades" })).toBeTruthy();
    expect(
      screen.getByLabelText("Cover di Hades non disponibile"),
    ).toBeTruthy();
    const edit = screen.getByRole("button", {
      name: "Modifica il tuo checkpoint",
    });
    await user.click(edit);
    expect(screen.getByRole("combobox", { name: "Stato" })).toHaveProperty(
      "ownerDocument.activeElement",
      screen.getByRole("combobox", { name: "Stato" }),
    );
  });

  it("distinguishes the saved summary from a status, rating, and note draft and preserves it when staying", async () => {
    const user = userEvent.setup();
    renderDetail(async () => response(savedEntry));
    await screen.findByRole("heading", { name: "Hades" });

    expect(screen.getByText("Stato salvato")).toBeTruthy();
    expect(screen.getByText("Voto salvato")).toBeTruthy();
    expect(
      screen.getByRole("status", { name: "Stato delle modifiche" }).textContent,
    ).toContain("Tutto aggiornato");
    await user.click(screen.getByRole("combobox", { name: "Stato" }));
    await user.click(await screen.findByRole("option", { name: "Completato" }));
    const rating = screen.getByLabelText("Il tuo voto", {
      selector: 'input[type="range"]',
    });
    fireEvent.keyDown(rating, {
      key: "ArrowLeft",
    });
    await user.clear(screen.getByRole("textbox", { name: /La tua nota/ }));
    await user.type(
      screen.getByRole("textbox", { name: /La tua nota/ }),
      "Nuova nota",
    );

    expect(
      screen.getByText("Stato salvato").parentElement?.textContent,
    ).toContain("In corso");
    expect(
      screen.getByText("Voto salvato").parentElement?.textContent,
    ).toContain("9/10");
    expect(
      screen.getByRole("status", { name: "Stato delle modifiche" }).textContent,
    ).toContain("Modifiche non salvate");
    expect(
      screen.getByRole("combobox", { name: "Stato" }).textContent,
    ).toContain("Completato");
    expect(rating).toHaveProperty("value", "8");

    await user.click(screen.getByRole("link", { name: "Torna alla libreria" }));
    expect(
      screen.getByRole("alertdialog", { name: /modifiche non salvate/i }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Resta qui" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.getByRole("textbox", { name: /La tua nota/ })).toHaveProperty(
      "value",
      "Nuova nota",
    );
    expect(push).not.toHaveBeenCalled();

    await user.click(screen.getByRole("link", { name: "Torna alla libreria" }));
    await user.click(
      screen.getByRole("button", { name: "Scarta e torna alla libreria" }),
    );
    expect(replace).toHaveBeenCalledWith("/");
    expect(push).not.toHaveBeenCalled();
  });

  it("announces saving, aligns the summary with the server response, and stops warning after save", async () => {
    const user = userEvent.setup();
    let entry = savedEntry;
    let finishPatch: (() => void) | undefined;
    const patch = new Promise<ReturnType<typeof response>>((resolve) => {
      finishPatch = () => {
        entry = {
          ...savedEntry,
          status: "completed",
          rating: 8,
          note: "Nota salvata",
          updatedAt: "2026-09-21T12:00:00.000Z",
        };
        resolve(response({ updated: true }));
      };
    });
    const fetchMock = renderDetail(
      async () => response(entry),
      () => patch,
    );
    await screen.findByRole("heading", { name: "Hades" });
    const unloadClean = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unloadClean);
    expect(unloadClean.defaultPrevented).toBe(false);

    const note = screen.getByRole("textbox", { name: /La tua nota/ });
    await user.click(screen.getByRole("combobox", { name: "Stato" }));
    await user.click(await screen.findByRole("option", { name: "Completato" }));
    fireEvent.keyDown(
      screen.getByLabelText("Il tuo voto", {
        selector: 'input[type="range"]',
      }),
      { key: "ArrowLeft" },
    );
    await user.clear(note);
    await user.type(note, "Nota salvata");
    const unloadDirty = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unloadDirty);
    expect(unloadDirty.defaultPrevented).toBe(true);

    await user.click(screen.getByRole("button", { name: "Salva modifiche" }));
    expect(
      screen.getByRole("status", { name: "Stato delle modifiche" }).textContent,
    ).toContain("Salvataggio in corso");
    expect(
      screen.getByRole("button", { name: "Salva modifiche" }),
    ).toHaveProperty("disabled", true);
    expect(note).toHaveProperty("disabled", true);
    expect(screen.getByRole("combobox", { name: "Stato" })).toHaveProperty(
      "disabled",
      true,
    );
    expect(
      screen.getByLabelText("Il tuo voto", { selector: 'input[type="range"]' }),
    ).toHaveProperty("disabled", true);
    await user.type(note, " non salvata");
    expect(note).toHaveProperty("value", "Nota salvata");
    const request = fetchMock.mock.calls.find(
      ([, init]) => init?.method === "PATCH",
    );
    const body = request?.[1]?.body;
    if (typeof body !== "string") throw new Error("PATCH body was not JSON");
    expect(JSON.parse(body)).toEqual({
      status: "completed",
      rating: 8,
      note: "Nota salvata",
    });
    if (!finishPatch) throw new Error("PATCH was not ready");
    finishPatch();

    await waitFor(() =>
      expect(
        screen.getByRole("status", { name: "Stato delle modifiche" })
          .textContent,
      ).toContain("Tutto aggiornato"),
    );
    expect(document.activeElement).toBe(
      screen.getByRole("status", { name: "Stato delle modifiche" }),
    );
    expect(screen.getByRole("textbox", { name: /La tua nota/ })).toHaveProperty(
      "value",
      "Nota salvata",
    );
    expect(
      screen.getByText("Stato salvato").parentElement?.textContent,
    ).toContain("Completato");
    expect(
      screen.getByText("Voto salvato").parentElement?.textContent,
    ).toContain("8/10");
    const unloadSaved = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unloadSaved);
    expect(unloadSaved.defaultPrevented).toBe(false);
  });

  it("retries an initial detail error locally and keeps a route back to the library", async () => {
    const user = userEvent.setup();
    let attempts = 0;
    let finishRetry: (() => void) | undefined;
    const pendingRetry = new Promise<ReturnType<typeof response>>((resolve) => {
      finishRetry = () => resolve(response({ error: "Unavailable" }, false));
    });
    const fetchMock = renderDetail(async () => {
      attempts += 1;
      if (attempts === 1) return response({ error: "Unavailable" }, false);
      if (attempts === 2) return pendingRetry;
      return response(savedEntry);
    });

    expect(
      await screen.findByText(/Non è stato possibile caricare/),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Torna alla libreria" }),
    ).toHaveProperty("href", "http://localhost:3000/");
    const retry = screen.getByRole("button", { name: "Riprova" });
    retry.focus();
    await user.keyboard("{Enter}");
    expect(
      screen
        .getByRole("button", { name: "Riprovo…" })
        .getAttribute("aria-disabled"),
    ).toBe("true");
    if (!finishRetry) throw new Error("Retry was not ready");
    finishRetry();
    await screen.findByRole("button", { name: "Riprova" });
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Riprova" }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await user.click(screen.getByRole("button", { name: "Riprova" }));
    expect(await screen.findByRole("heading", { name: "Hades" })).toBeTruthy();
    expect(document.activeElement).toBe(
      screen.getByRole("heading", { name: "Hades" }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("keeps the personal draft while catalog metadata is refreshed", async () => {
    const user = userEvent.setup();
    const entry = {
      ...savedEntry,
      rawgId: 1,
      coverUrl: "https://media.rawg.io/media/games/hades.jpg",
    };
    const fetchMock = renderDetail(
      async () => response(entry),
      undefined,
      async () => response({ ...entry, genres: ["Action"] }),
    );
    await screen.findByRole("heading", { name: "Hades" });
    const note = screen.getByRole("textbox", { name: /La tua nota/ });
    await user.clear(note);
    await user.type(note, "Bozza da tenere");

    await user.click(
      screen.getByRole("button", { name: "Aggiorna dati del gioco" }),
    );
    await waitFor(() => expect(screen.getAllByText("Action")).toHaveLength(2));
    expect(screen.getByRole("textbox", { name: /La tua nota/ })).toHaveProperty(
      "value",
      "Bozza da tenere",
    );
    expect(
      screen.getByRole("status", { name: "Stato delle modifiche" }).textContent,
    ).toContain("Modifiche non salvate");
    expect(
      fetchMock.mock.calls.filter(([, init]) => init?.method === "PATCH"),
    ).toHaveLength(0);
  });

  it("asks before browser history leaves the detail and preserves the draft when staying", async () => {
    const user = userEvent.setup();
    const pushHistory = vi.spyOn(window.history, "pushState");
    renderDetail(async () => response(savedEntry));
    await screen.findByRole("heading", { name: "Hades" });
    await user.type(
      screen.getByRole("textbox", { name: /La tua nota/ }),
      "Bozza",
    );

    const entriesBeforeBack = pushHistory.mock.calls.length;
    fireEvent.popState(window);
    expect(window.location.pathname).toBe(`/games/${savedEntry.id}`);
    expect(
      screen.getByRole("alertdialog", { name: /modifiche non salvate/i }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Resta qui" }));
    expect(screen.getByRole("textbox", { name: /La tua nota/ })).toHaveProperty(
      "value",
      "Prima notaBozza",
    );
    expect(pushHistory).toHaveBeenCalledTimes(entriesBeforeBack + 1);
    expect(push).not.toHaveBeenCalled();

    fireEvent.popState(window);
    const entriesBeforeDiscard = pushHistory.mock.calls.length;
    await user.click(
      screen.getByRole("button", { name: "Scarta e torna alla libreria" }),
    );
    expect(pushHistory).toHaveBeenCalledTimes(entriesBeforeDiscard);
    expect(replace).toHaveBeenCalledWith("/");
  });

  it("does not create a Back destination for a directly opened detail", async () => {
    const user = userEvent.setup();
    vi.spyOn(window.history, "length", "get").mockReturnValue(1);
    const pushHistory = vi.spyOn(window.history, "pushState");
    renderDetail(
      async () => response(savedEntry),
      undefined,
      undefined,
      false,
      false,
    );
    await screen.findByRole("heading", { name: "Hades" });
    await user.type(
      screen.getByRole("textbox", { name: /La tua nota/ }),
      "Bozza",
    );

    expect(pushHistory).not.toHaveBeenCalled();
    fireEvent.popState(window);
    expect(screen.queryByRole("alertdialog")).toBeNull();

    await user.click(screen.getByRole("link", { name: "Torna alla libreria" }));
    await user.click(screen.getByRole("button", { name: "Resta qui" }));
    expect(pushHistory).not.toHaveBeenCalled();
  });

  it("returns to the library when Back has no predecessor despite forward history", async () => {
    const user = userEvent.setup();
    vi.spyOn(window.history, "length", "get").mockReturnValue(2);
    const go = vi.spyOn(window.history, "go").mockImplementation(() => {});
    renderDetail(async () => response(savedEntry));
    await screen.findByRole("heading", { name: "Hades" });
    await user.type(
      screen.getByRole("textbox", { name: /La tua nota/ }),
      "Bozza",
    );

    fireEvent.popState(window);
    await user.click(
      screen.getByRole("button", { name: "Scarta e torna alla libreria" }),
    );
    expect(replace).toHaveBeenCalledWith("/");
    expect(go).not.toHaveBeenCalled();
  });

  it("asks before global search opens another game and keeps the draft on cancel", async () => {
    const user = userEvent.setup();
    renderDetail(async () => response(savedEntry), undefined, undefined, true);
    await screen.findByRole("heading", { name: "Hades" });
    await user.type(
      screen.getByRole("textbox", { name: /La tua nota/ }),
      "Bozza",
    );
    await user.type(
      screen.getByRole("combobox", { name: /libreria.*catalogo RAWG/i }),
      "Celeste",
    );
    await user.click(
      await screen.findByRole("option", {
        name: /Apri Celeste.*nella tua libreria/i,
      }),
    );
    expect(
      screen.getByRole("alertdialog", { name: /modifiche non salvate/i }),
    ).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Resta qui" }));
    expect(screen.getByRole("textbox", { name: /La tua nota/ })).toHaveProperty(
      "value",
      "Prima notaBozza",
    );

    await user.click(
      screen.getByRole("combobox", { name: /libreria.*catalogo RAWG/i }),
    );
    await user.click(
      await screen.findByRole("option", {
        name: /Apri Celeste.*nella tua libreria/i,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Scarta e continua" }));
    expect(replace).toHaveBeenCalledWith("/games/entry-2");
    expect(push).not.toHaveBeenCalled();
  });

  it("keeps the current game draft when its own search result is selected", async () => {
    const user = userEvent.setup();
    renderDetail(async () => response(savedEntry), undefined, undefined, true);
    await screen.findByRole("heading", { name: "Hades" });
    await user.type(
      screen.getByRole("textbox", { name: /La tua nota/ }),
      "Bozza",
    );
    await user.type(
      screen.getByRole("combobox", { name: /libreria.*catalogo RAWG/i }),
      "Hades",
    );
    await user.click(
      await screen.findByRole("option", {
        name: /Apri Hades.*nella tua libreria/i,
      }),
    );

    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.getByRole("textbox", { name: /La tua nota/ })).toHaveProperty(
      "value",
      "Prima notaBozza",
    );
    expect(push).not.toHaveBeenCalled();
  });
});
