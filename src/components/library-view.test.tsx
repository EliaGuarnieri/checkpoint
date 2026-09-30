// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LibraryView } from "./library-view";

const entries = [
  {
    id: "hades",
    rawgId: null,
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
  },
  {
    id: "celeste",
    rawgId: null,
    title: "Celeste",
    slug: "celeste",
    coverUrl: null,
    releaseDate: "2018-01-25",
    status: "playing",
    rating: 8,
    note: null,
    genres: ["Platformer"],
    developers: ["Maddy Makes Games"],
    publishers: ["Maddy Makes Games"],
    updatedAt: "2026-09-19T12:00:00.000Z",
  },
  {
    id: "baldurs-gate",
    rawgId: null,
    title: "Baldur's Gate 3",
    slug: "baldurs-gate-3",
    coverUrl: null,
    releaseDate: "2023-08-03",
    status: "completed",
    rating: 10,
    note: null,
    genres: ["RPG"],
    developers: ["Larian Studios"],
    publishers: ["Larian Studios"],
    updatedAt: "2026-09-18T12:00:00.000Z",
  },
];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderLibrary(
  response: Promise<{
    ok: boolean;
    json: () => Promise<unknown>;
  }> = Promise.resolve({ ok: true, json: async () => entries }),
) {
  vi.stubGlobal("fetch", vi.fn().mockReturnValue(response));
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <LibraryView />
    </QueryClientProvider>,
  );
}

function visibleLibraryEntryIds() {
  return screen
    .queryAllByRole("link")
    .map((link) => link.getAttribute("href")?.split("/").at(-1));
}

function statusCount(label: string) {
  return screen.getByRole("button", { name: new RegExp(`^${label}`) })
    .textContent;
}

describe("library filters", () => {
  it("counts each section after the other criteria and keeps counts stable when switching section", async () => {
    renderLibrary();
    await screen.findByRole("link", { name: /Hades/ });

    expect(screen.getByText("3 giochi")).toBeTruthy();
    expect(statusCount("Tutti")).toBe("Tutti3");
    expect(statusCount("In corso")).toBe("In corso2");
    expect(statusCount("Completati")).toBe("Completati1");

    fireEvent.click(screen.getByText("Filtri", { selector: "summary" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Genere" }), {
      target: { value: "RPG" },
    });

    expect(screen.getByText("1 di 3 giochi")).toBeTruthy();
    expect(visibleLibraryEntryIds()).toEqual(["baldurs-gate"]);
    expect(statusCount("Tutti")).toBe("Tutti1");
    expect(statusCount("In corso")).toBe("In corso0");
    expect(statusCount("Completati")).toBe("Completati1");

    fireEvent.click(screen.getByRole("button", { name: /^In corso/ }));
    expect(screen.getByText("0 di 3 giochi")).toBeTruthy();
    expect(visibleLibraryEntryIds()).toEqual([]);
    expect(statusCount("Tutti")).toBe("Tutti1");
    expect(statusCount("Completati")).toBe("Completati1");

    fireEvent.click(screen.getByRole("button", { name: /^Completati/ }));
    expect(screen.getByText("1 di 3 giochi")).toBeTruthy();
    expect(visibleLibraryEntryIds()).toEqual(["baldurs-gate"]);
  });

  it("applies title, genre, developer, publisher, and minimum rating to section counts", async () => {
    renderLibrary();
    await screen.findByRole("link", { name: /Hades/ });
    fireEvent.click(screen.getByText("Filtri", { selector: "summary" }));

    const criteria = [
      { field: "Titolo", value: "Hades", visible: ["hades"], completed: 0 },
      {
        field: "Genere",
        value: "RPG",
        visible: ["baldurs-gate"],
        completed: 1,
      },
      {
        field: "Sviluppatore",
        value: "Maddy",
        visible: ["celeste"],
        completed: 0,
      },
      {
        field: "Publisher",
        value: "Larian",
        visible: ["baldurs-gate"],
        completed: 1,
      },
    ];
    for (const { field: name, value, visible, completed } of criteria) {
      const field = screen.getByRole("textbox", { name });
      fireEvent.change(field, { target: { value } });
      expect(visibleLibraryEntryIds()).toEqual(visible);
      expect(statusCount("Tutti")).toBe("Tutti1");
      expect(statusCount("Completati")).toBe(`Completati${completed}`);
      fireEvent.change(field, { target: { value: "" } });
    }

    const rating = screen.getByRole("slider", { hidden: true });
    for (let value = 0; value < 9; value++) {
      fireEvent.keyDown(rating, { key: "ArrowRight" });
    }
    expect(visibleLibraryEntryIds()).toEqual(["hades", "baldurs-gate"]);
    expect(statusCount("Tutti")).toBe("Tutti2");
    expect(statusCount("In corso")).toBe("In corso1");
    expect(statusCount("Completati")).toBe("Completati1");

    fireEvent.change(screen.getByRole("textbox", { name: "Titolo" }), {
      target: { value: "Celeste" },
    });
    expect(screen.getByText("0 di 3 giochi")).toBeTruthy();
    expect(visibleLibraryEntryIds()).toEqual([]);
    expect(statusCount("Tutti")).toBe("Tutti0");
    expect(statusCount("In corso")).toBe("In corso0");
  });

  it("shows an unavailable count during loading and after a failed request", async () => {
    renderLibrary(new Promise(() => {}));
    expect(screen.getByText("— giochi")).toBeTruthy();
    expect(statusCount("Tutti")).toBe("Tutti—");
    cleanup();

    renderLibrary(Promise.reject(new Error("Network unavailable")));
    await screen.findByText("Libreria non disponibile");
    expect(screen.getByText("— giochi")).toBeTruthy();
    expect(statusCount("Tutti")).toBe("Tutti—");
  });

  it("resets status and advanced criteria from the panel while keeping the full collection visible", async () => {
    renderLibrary();
    await screen.findByRole("link", { name: /Hades/ });

    fireEvent.click(screen.getByRole("button", { name: /In corso/ }));
    fireEvent.click(screen.getByText("Filtri", { selector: "summary" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Titolo" }), {
      target: { value: "Hades" },
    });
    expect(visibleLibraryEntryIds()).toEqual(["hades"]);

    fireEvent.click(screen.getByRole("button", { name: "Azzera filtri" }));

    expect(
      screen
        .getByRole("button", { name: /Tutti/ })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen.getByRole("textbox", { name: "Titolo" }).getAttribute("value"),
    ).toBe("");
    expect(screen.queryByText("Filtri attivi:")).toBeNull();
    expect(visibleLibraryEntryIds()).toEqual([
      "hades",
      "celeste",
      "baldurs-gate",
    ]);
  });

  it("shows active criteria while the panel is closed and clears them from the empty state", async () => {
    renderLibrary();
    await screen.findByRole("link", { name: /Hades/ });

    fireEvent.click(screen.getByRole("button", { name: /In corso/ }));
    fireEvent.click(screen.getByText("Filtri", { selector: "summary" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Genere" }), {
      target: { value: "RPG" },
    });
    fireEvent.click(screen.getByText("Filtri", { selector: "summary" }));

    expect(screen.getByText("Stato: In corso")).toBeTruthy();
    expect(screen.getByText("Genere: RPG")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Nessun gioco con questi filtri" }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Azzera i filtri" }));

    expect(screen.queryByText("Stato: In corso")).toBeNull();
    expect(screen.queryByText("Genere: RPG")).toBeNull();
    expect(
      screen
        .getByRole("button", { name: /Tutti/ })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(visibleLibraryEntryIds()).toEqual([
      "hades",
      "celeste",
      "baldurs-gate",
    ]);
  });

  it("clears every advanced criterion without changing the chosen sort", async () => {
    const user = userEvent.setup();
    renderLibrary();
    await screen.findByRole("link", { name: /Hades/ });

    await user.click(screen.getByRole("combobox", { name: "Ordina libreria" }));
    await user.click(await screen.findByRole("option", { name: "Titolo A–Z" }));
    fireEvent.click(screen.getByRole("button", { name: /In corso/ }));
    fireEvent.click(screen.getByText("Filtri", { selector: "summary" }));
    expect(
      screen
        .getByText("Filtri", { selector: "summary" })
        .parentElement?.hasAttribute("open"),
    ).toBe(true);
    for (const [name, value] of [
      ["Titolo", "Hades"],
      ["Genere", "Roguelike"],
      ["Sviluppatore", "Supergiant"],
      ["Publisher", "Supergiant"],
    ]) {
      fireEvent.change(screen.getByRole("textbox", { name }), {
        target: { value },
      });
    }
    fireEvent.keyDown(
      screen.getByLabelText("Voto minimo", { selector: 'input[type="range"]' }),
      {
        key: "ArrowRight",
      },
    );
    expect(visibleLibraryEntryIds()).toEqual(["hades"]);
    expect(screen.getByText("Voto minimo: 1/10")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Azzera filtri" }));

    for (const name of ["Titolo", "Genere", "Sviluppatore", "Publisher"]) {
      expect(screen.getByRole("textbox", { name }).getAttribute("value")).toBe(
        "",
      );
    }
    expect(
      screen
        .getByLabelText("Voto minimo", { selector: 'input[type="range"]' })
        .getAttribute("aria-valuenow"),
    ).toBe("0");
    expect(
      screen.getByRole("combobox", { name: "Ordina libreria" }).textContent,
    ).toContain("Titolo A–Z");
    expect(visibleLibraryEntryIds()).toEqual([
      "baldurs-gate",
      "celeste",
      "hades",
    ]);
  });
});
