import { useSyncExternalStore } from "react";

declare global {
  interface Window {
    // static/theme.js, loaded in index.html before this bundle.
    ronovoTheme: {
      get(): string;
      set(theme: string, from?: Element): void;
      rain(): boolean;
      setRain(on: boolean): void;
      subscribe(listener: () => void): () => void;
    };
  }
}

const store = window.ronovoTheme;

export const useTheme = () => useSyncExternalStore(store.subscribe, store.get);

export const useRain = () => useSyncExternalStore(store.subscribe, store.rain);

const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
const watchMotion = (listener: () => void) => {
  motion.addEventListener("change", listener);
  return () => motion.removeEventListener("change", listener);
};

export const useReducedMotion = () => useSyncExternalStore(watchMotion, () => motion.matches);
