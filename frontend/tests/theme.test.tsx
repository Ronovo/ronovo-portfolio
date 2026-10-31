import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { createRoot } from "react-dom/client";
import { useRef } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";
import Hero from "../src/components/Hero";
import BootSequence from "../src/theme/terminal/BootSequence";
import D20Roll from "../src/theme/grimoire/D20Roll";
import Dimensions from "../src/theme/blueprint/Dimensions";
import Crosshair from "../src/theme/blueprint/Crosshair";
import TitleBlock from "../src/theme/blueprint/TitleBlock";
import Taskbar from "../src/theme/retro/Taskbar";
import MatrixRain from "../src/theme/terminal/MatrixRain";
import ThemePicker from "../src/theme/ThemePicker";
import { usePointer } from "../src/theme/usePointer";
import { makeSite, mediaQuery, project, reducedMotion, themeStore } from "./fakes";

let frames: FrameRequestCallback[];

beforeEach(() => {
  frames = [];
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => frames.push(callback));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});

function runFrame(time = 0) {
  act(() => frames.shift()!(time));
}

/* Steps fake timers one tick at a time, so each render can schedule the next timer. */
function tick(ms: number, times: number) {
  for (let i = 0; i < times; i++) act(() => vi.advanceTimersByTime(ms));
}

describe("ThemePicker", () => {
  it("switches themes and offers the rain only on the terminal theme", () => {
    render(<ThemePicker site={makeSite()} />);
    const select = screen.getByLabelText("Theme") as HTMLSelectElement;
    expect(select.value).toBe("cyberpunk");
    expect(screen.queryByLabelText("Rain")).toBeNull();
    act(() => {
      fireEvent.change(select, { target: { value: "terminal" } });
    });
    expect(themeStore.set).toHaveBeenCalledWith("terminal", select);
    const rain = screen.getByLabelText("Rain") as HTMLInputElement;
    expect(rain.checked).toBe(true);
    act(() => {
      fireEvent.click(rain);
    });
    expect(themeStore.setRain).toHaveBeenCalledWith(false);
    expect(rain.checked).toBe(false);
  });
});

describe("theme kits", () => {
  const title = () => screen.getByRole("heading", { level: 1 });

  it.each([
    ["cyberpunk", "glitch"],
    ["nonsense", "glitch"],
    ["light", null],
  ])("draws titles for the %s theme", (theme, glitch) => {
    themeStore.set(theme);
    render(<Hero title="Home" subtitle="Hi" />);
    expect(title().querySelector("span")?.className ?? null).toBe(glitch);
  });

  it("draws the terminal prompt title", () => {
    themeStore.set("terminal");
    render(<Hero title="Home" subtitle="Hi" />);
    expect(title().textContent).toBe("~/Home");
  });

  function serve(site = makeSite()) {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => site })));
  }

  async function home() {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    await screen.findByText("Browse by category");
  }

  it("rains on the terminal theme only while the rain is on and motion is allowed", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(fakeContext() as never);
    themeStore.set("terminal");
    serve();
    await home();
    expect(await screen.findByText((_, el) => el?.tagName === "CANVAS")).toBeTruthy();
    act(() => themeStore.setRain(false));
    expect(document.querySelector("canvas")).toBeNull();
    act(() => themeStore.setRain(true));
    act(() => reducedMotion().set(true));
    expect(document.querySelector("canvas")).toBeNull();
  });

  it("adds the blueprint crosshair, card dimensions and title block", async () => {
    stubResizeObserver();
    themeStore.set("blueprint");
    serve();
    await home();
    expect(await screen.findByText("Drawn by")).toBeTruthy();
    expect(document.querySelectorAll(".dims").length).toBeGreaterThan(0);
    expect(await screen.findByText((_, el) => el?.className === "crosshair")).toBeTruthy();
  });

  it("adds the d20 on the grimoire home page", async () => {
    themeStore.set("grimoire");
    serve();
    await home();
    expect(screen.getByText("Roll for a project")).toBeTruthy();
  });

  it("adds the taskbar on the retro home page", async () => {
    themeStore.set("retro");
    serve();
    await home();
    expect(await screen.findByText("Start")).toBeTruthy();
    expect(screen.getByText("Home - Ronovo")).toBeTruthy();
  });
});

describe("Taskbar", () => {
  const at = (path: string) =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <Taskbar site={makeSite()} />
      </MemoryRouter>,
    );

  it("names the page and keeps the clock ticking", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 31, 9, 5));
    const { container } = at("/about");
    expect(screen.getByText("About - Ronovo")).toBeTruthy();
    const tray = container.querySelector(".tray")!;
    expect(tray.textContent).toMatch(/09:05/);
    vi.setSystemTime(new Date(2026, 9, 31, 9, 6));
    tick(30_000, 1);
    expect(tray.textContent).toMatch(/09:06/);
  });

  it("says when the page is not in the nav", () => {
    at("/nowhere");
    expect(screen.getByText("Not found - Ronovo")).toBeTruthy();
  });
});

describe("BootSequence", () => {
  const site = makeSite({ name: "Ronovo" });

  it("types each boot line, then the tagline, and remembers it was seen", () => {
    vi.useFakeTimers();
    const { container } = render(<BootSequence site={site} />);
    tick(14, 300);
    const lines = [...container.querySelectorAll(".boot-line")].map((line) => line.textContent);
    expect(lines).toEqual(["> booting ronovo.sys ... ok", "> mounting 3 categories ... ok",
      "> indexing 2 projects ... ok", "ronovo@portfolio:~$ cat tagline.txt"]);
    expect(container.textContent).toContain("Tools and games.");
    expect(sessionStorage.getItem("boot-seen")).toBe("1");
  });

  it("skips to the end on a key press", () => {
    vi.useFakeTimers();
    const { container } = render(<BootSequence site={site} />);
    act(() => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    expect(container.querySelectorAll(".boot-line")).toHaveLength(4);
    expect(container.querySelector(".cursor")).toBeTruthy();
  });

  it("starts at the end once seen, or for reduced motion", () => {
    sessionStorage.setItem("boot-seen", "1");
    const { container } = render(<BootSequence site={site} />);
    expect(container.textContent).toContain("Tools and games.");
    sessionStorage.clear();
    reducedMotion().set(true);
    render(<BootSequence site={site} />);
    expect(screen.getAllByText(/Tools and games\./)).toHaveLength(2);
  });

  it("still runs when the browser blocks session storage", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { container } = render(<BootSequence site={site} />);
    expect(container.querySelectorAll(".boot-line")).toHaveLength(1);
    act(() => {
      fireEvent.pointerDown(window);
    });
    expect(container.textContent).toContain("Tools and games.");
  });
});

describe("D20Roll", () => {
  function roll(face: number) {
    vi.spyOn(Math, "random").mockReturnValue((face - 1) / 20);
    act(() => {
      fireEvent.click(document.querySelector(".d20-controls button")!);
    });
  }

  it("tumbles, then lands on a project", () => {
    vi.useFakeTimers();
    const { container } = render(<D20Roll site={makeSite()} />);
    roll(5);
    expect(container.firstElementChild!.className).toBe("d20 tumbling");
    expect(screen.getByText(/Roll for a project/).closest("button")!.disabled).toBe(true);
    tick(60, 15);
    expect(container.firstElementChild!.className).toBe("d20");
    const result = container.querySelector(".d20-result")!;
    expect(result.textContent).toMatch(/^You rolled 5: /);
    expect(within(result as HTMLElement).getByRole("link").getAttribute("href")).toMatch(/^\/projects\//);
  });

  it("calls the crit and the fumble at once with reduced motion", () => {
    reducedMotion().set(true);
    const { container } = render(<D20Roll site={makeSite()} />);
    roll(20);
    expect(container.firstElementChild!.className).toBe("d20 crit");
    expect(container.querySelector(".d20-result")!.textContent).toBe("Natural 20, critical! The whole library");
    roll(1);
    expect(container.firstElementChild!.className).toBe("d20 fumble");
    expect(container.querySelector(".d20-result")!.textContent).toBe("Natural 1. The ink smudges. Roll again.");
    expect(screen.getByText("Roll again")).toBeTruthy();
  });

  it("shows the roll table and marks the face rolled", () => {
    reducedMotion().set(true);
    render(<D20Roll site={makeSite()} />);
    const toggle = screen.getByText("Show the table");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    roll(20);
    expect(document.querySelector("tr.rolled")!.textContent).toBe("20The whole library");
    fireEvent.click(screen.getByText("Hide the table"));
    expect(document.querySelector("table")).toBeNull();
  });

  it.each([1, 2, 7, 12, 18, 25])("splits faces 2-19 evenly among %i projects", (count) => {
    const projects = Array.from({ length: count }, (_, i) => project({ title: `P${i}`, about: null }));
    render(<D20Roll site={makeSite({ projects: [...projects, project({ title: "Hidden", source: null, about: null })] })} />);
    fireEvent.click(screen.getByText("Show the table"));
    const faces: number[] = [];
    for (const row of document.querySelectorAll("tbody tr")) {
      const [from, to = from] = row.firstElementChild!.textContent!.split("-").map(Number);
      for (let face = from; face <= to; face++) faces.push(face);
    }
    expect(faces).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    expect(screen.queryByText("Hidden")).toBeNull();
    expect(screen.getByText("P0").getAttribute("href")).toBe("https://github.com/Ronovo/project");
  });

  it("sends faces 2-19 to the whole library when no project has a page to link", () => {
    reducedMotion().set(true);
    render(<D20Roll site={makeSite({ projects: [project({ title: "Hidden", source: null, about: null })] })} />);
    roll(7);
    expect(document.querySelector(".d20-result")!.textContent).toBe("You rolled 7: The whole library");
    fireEvent.click(screen.getByText("Show the table"));
    expect([...document.querySelectorAll("tbody tr")].map((row) => row.textContent)).toEqual([
      "1The ink smudges. Roll again.",
      "2-19The whole library",
      "20The whole library",
    ]);
  });
});

describe("blueprint pieces", () => {
  it("measures the card it sits in", () => {
    const observers = stubResizeObserver();
    const { container } = render(
      <article>
        <Dimensions />
      </article>,
    );
    expect(observers[0].observed).toBe(container.querySelector("article"));
    act(() => observers[0].report(300.4, 200.6));
    expect(container.textContent).toBe("300 px201 px");
  });

  it("measures nothing when it has no card around it", () => {
    const observers = stubResizeObserver();
    const fragment = document.createDocumentFragment();
    act(() => createRoot(fragment).render(<Dimensions />));
    expect(observers).toHaveLength(0);
  });

  it("follows the pointer on hover screens", () => {
    mediaQuery("(hover: hover)").set(true);
    const { container, unmount } = render(<Crosshair />);
    act(() => {
      fireEvent.pointerMove(window, { clientX: 12, clientY: 345 });
    });
    runFrame();
    const crosshair = container.querySelector(".crosshair") as HTMLElement;
    expect(crosshair.style.getPropertyValue("--mx")).toBe("12px");
    expect(crosshair.textContent).toBe("X 0012  Y 0345");
    unmount();
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });

  it("ignores the pointer on touch screens and without an element", () => {
    function Detached() {
      usePointer(useRef<HTMLElement>(null));
      return null;
    }
    function Bare() {
      const ref = useRef<HTMLDivElement>(null);
      usePointer(ref);
      return <div ref={ref} />;
    }
    render(<Crosshair />);
    render(<Detached />);
    fireEvent.pointerMove(window, { clientX: 1, clientY: 1 });
    expect(frames).toHaveLength(0);
    mediaQuery("(hover: hover)").set(true);
    render(<Bare />);
    fireEvent.pointerMove(window, { clientX: 1, clientY: 1 });
    runFrame();
  });

  it.each([
    ["/", "1 of 3"],
    ["/projects", "2 of 3"],
    ["/projects/", "2 of 3"],
    ["/nowhere", "- of 3"],
  ])("numbers the title block sheet for %s", (path, sheet) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <TitleBlock site={makeSite()} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Sheet").nextElementSibling!.textContent).toBe(sheet);
    expect(screen.getByText("Date").nextElementSibling!.textContent).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("MatrixRain", () => {
  it("draws falling glyphs each frame and stops when it is removed", () => {
    const context = fakeContext();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as never);
    const random = vi.spyOn(Math, "random").mockReturnValue(0.99);
    window.devicePixelRatio = 2;
    window.innerHeight = 36;
    const { container, unmount } = render(<MatrixRain site={makeSite()} />);
    const canvas = container.querySelector("canvas")!;
    expect(canvas.width).toBe(window.innerWidth * 2);
    expect(context.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);

    runFrame(10);
    expect(context.fillText).not.toHaveBeenCalled();
    for (let time = 100; time <= 500; time += 100) runFrame(time);
    const drawn = context.fillText.mock.calls.length;
    expect(drawn).toBeGreaterThan(0);
    random.mockReturnValue(0.001);
    for (let time = 400; time <= 800; time += 100) runFrame(time);
    expect(context.fillText.mock.calls.length).toBeGreaterThan(drawn);

    window.devicePixelRatio = 0;
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(context.setTransform).toHaveBeenLastCalledWith(1, 0, 0, 1, 0, 0);
    unmount();
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });
});

function fakeContext() {
  return {
    setTransform: vi.fn(), fillRect: vi.fn(), fillText: vi.fn(),
    font: "", textBaseline: "", shadowColor: "", shadowBlur: 0, fillStyle: "", globalAlpha: 1,
  };
}

function stubResizeObserver() {
  const observers: { observed?: Element; report: (width: number, height: number) => void }[] = [];
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: ResizeObserverCallback) {
      const observer = {
        observed: undefined as Element | undefined,
        report: (width: number, height: number) =>
          callback([{ borderBoxSize: [{ inlineSize: width, blockSize: height }] }] as never, this as never),
      };
      observers.push(observer);
      Object.assign(this, { observe: (el: Element) => (observer.observed = el), disconnect: vi.fn() });
    }
  });
  return observers;
}
