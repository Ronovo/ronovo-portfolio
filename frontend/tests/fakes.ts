import { vi } from "vitest";
import type { Site } from "../src/types";

type Listener = () => void;

/* A media query whose answer the tests change. */
export class FakeMediaQuery {
  matches = false;
  readonly listeners = new Set<Listener>();

  addEventListener(_type: string, listener: Listener) {
    this.listeners.add(listener);
  }

  removeEventListener(_type: string, listener: Listener) {
    this.listeners.delete(listener);
  }

  set(matches: boolean) {
    this.matches = matches;
    this.listeners.forEach((listener) => listener());
  }
}

const queries = new Map<string, FakeMediaQuery>();

export function mediaQuery(query: string) {
  if (!queries.has(query)) queries.set(query, new FakeMediaQuery());
  return queries.get(query)!;
}

export const reducedMotion = () => mediaQuery("(prefers-reduced-motion: reduce)");

/* The store static/theme.js puts on window before the bundle loads. */
const themeListeners = new Set<Listener>();
const themeState = { theme: "cyberpunk", rain: true };

export const themeStore = {
  get: () => themeState.theme,
  set: vi.fn((theme: string) => {
    themeState.theme = theme;
    themeListeners.forEach((listener) => listener());
  }),
  rain: () => themeState.rain,
  setRain: vi.fn((on: boolean) => {
    themeState.rain = on;
    themeListeners.forEach((listener) => listener());
  }),
  subscribe: (listener: Listener) => {
    themeListeners.add(listener);
    return () => themeListeners.delete(listener);
  },
};

export function installFakes() {
  window.matchMedia = ((query: string) => mediaQuery(query)) as unknown as typeof window.matchMedia;
  window.ronovoTheme = themeStore;
}

export function resetFakes() {
  queries.forEach((query) => query.set(false));
  themeState.theme = "cyberpunk";
  themeState.rain = true;
  themeStore.set.mockClear();
  themeStore.setRain.mockClear();
  sessionStorage.clear();
}

export function makeSite(overrides: Partial<Site> = {}): Site {
  return {
    name: "Ronovo",
    tagline: "Tools and games.",
    intro: "I am Ronovo.",
    nav: [
      { label: "Home", href: "/" },
      { label: "Projects", href: "/projects" },
      { label: "About", href: "/about" },
    ],
    account: null,
    categories: [
      { name: "General", blurb: "Odds and ends" },
      { name: "Games", blurb: "Browser games" },
      { name: "TTRPG", blurb: "Tabletop tools" },
    ],
    themes: [
      { name: "Standard", themes: [{ id: "cyberpunk", label: "Cyberpunk" }, { id: "light", label: "Light" }] },
      { name: "Experimental", themes: [{ id: "terminal", label: "Terminal" }, { id: "blueprint", label: "Blueprint" }] },
    ],
    tags: ["Python", "TypeScript"],
    projects: [
      project({ title: "Casino", category: "Games", tags: ["Python"], featured: true }),
      project({ title: "Chat", category: "General", tags: ["TypeScript"] }),
    ],
    ...overrides,
  };
}

export function project(overrides: Partial<Site["projects"][number]> = {}): Site["projects"][number] {
  return {
    title: "Project",
    category: "Games",
    desc: "A project.",
    tags: [],
    featured: false,
    thumb: null,
    source: "https://github.com/Ronovo/project",
    about: "/projects/project/",
    links: [],
    ...overrides,
  };
}
