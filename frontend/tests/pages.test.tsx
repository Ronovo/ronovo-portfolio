import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import App from "../src/App";
import Projects from "../src/pages/Projects";
import type { Site } from "../src/types";
import { makeSite, project } from "./fakes";

function serve(site: Site = makeSite(), ok = true) {
  const fetch = vi.fn(async () => ({ ok, status: ok ? 200 : 503, json: async () => site }));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

function Search() {
  return <output data-testid="search">{useLocation().search}</output>;
}

function renderAt(path: string, page = <App />) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              {page}
              <Search />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

const search = () => screen.getByTestId("search").textContent;

describe("App", () => {
  it("boots, then draws the home page from /api/site", async () => {
    const fetch = serve();
    renderAt("/");
    expect(screen.getByText("booting...")).toBeTruthy();
    expect(await screen.findByText("Browse by category")).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith("/api/site");
    expect(document.title).toBe("Ronovo");
    const featured = screen.getByText("Featured").closest("section")!;
    expect(within(featured).getByText("Casino")).toBeTruthy();
    expect(within(featured).queryByText("Chat")).toBeNull();
  });

  it("says when the site can't be loaded", async () => {
    serve(makeSite(), false);
    renderAt("/");
    expect(await screen.findByText("connection failed. Reload to try again.")).toBeTruthy();
  });

  it.each([
    ["/about", "About - Ronovo", "What I make"],
    ["/projects", "Projects - Ronovo", "Portfolio | Ian Kent (Ronovo)"],
    ["/no-such-page", "Page not found - Ronovo", "Signal lost. That page doesn't exist or has moved."],
  ])("routes %s to its page", async (path, title, text) => {
    serve();
    renderAt(path);
    expect(await screen.findByText(text)).toBeTruthy();
    expect(document.title).toBe(title);
  });
});

describe("Projects", () => {
  const games = Array.from({ length: 5 }, (_, i) =>
    project({ title: `Game ${i + 1}`, category: "Games", tags: i === 0 ? ["Python"] : [] }),
  );
  const site = makeSite({ projects: [...games, project({ title: "Chat", category: "General", tags: ["TypeScript"] })] });

  it("shows up to four projects a category, each with a link to the rest", () => {
    renderAt("/projects", <Projects site={site} />);
    const section = screen.getByRole("heading", { name: "Games" }).closest("section")!;
    expect(within(section).getAllByRole("article")).toHaveLength(4);
    expect(within(section).getByText(/All Games/).getAttribute("href")).toBe("/projects?category=games");
    expect(screen.queryByRole("heading", { name: "TTRPG" })).toBeNull();
    expect(screen.getByText("6 matches")).toBeTruthy();
  });

  it("filters by category and tag through the URL", () => {
    renderAt("/projects", <Projects site={site} />);
    act(() => {
      fireEvent.change(screen.getByLabelText("Category"), { target: { value: "games" } });
    });
    expect(search()).toBe("?category=games");
    expect(screen.getAllByRole("article")).toHaveLength(5);
    expect(screen.queryByText(/All Games/)).toBeNull();
    act(() => {
      fireEvent.change(screen.getByLabelText("Tag"), { target: { value: "Python" } });
    });
    expect(search()).toBe("?category=games&tag=Python");
    expect(screen.getByText("1 match")).toBeTruthy();
    act(() => {
      fireEvent.change(screen.getByLabelText("Category"), { target: { value: "" } });
      fireEvent.change(screen.getByLabelText("Tag"), { target: { value: "" } });
    });
    expect(search()).toBe("");
  });

  it("reads a category in any case from the URL", () => {
    renderAt("/projects?category=GENERAL", <Projects site={site} />);
    expect((screen.getByLabelText("Category") as HTMLSelectElement).value).toBe("general");
    expect(screen.getAllByRole("article").map((card) => within(card).getByRole("heading").textContent)).toEqual([
      "Chat",
    ]);
  });

  it("keeps the page when the filter form is submitted", () => {
    renderAt("/projects", <Projects site={site} />);
    const submitted = fireEvent.submit(screen.getByRole("form", { name: "Filter projects" }));
    expect(submitted).toBe(false);
  });

  it("says when nothing matches", () => {
    renderAt("/projects?category=games&tag=TypeScript", <Projects site={site} />);
    expect(screen.getByText("No projects match these filters.")).toBeTruthy();
    expect(screen.getByText("0 matches")).toBeTruthy();
  });
});
