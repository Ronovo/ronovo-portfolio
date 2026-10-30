// Loaded in <head> on every page, so the saved theme is on <html> before the first paint.
(() => {
  const root = document.documentElement;
  const listeners = new Set();
  const read = (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const write = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  };
  const notify = () => listeners.forEach((listener) => listener());
  const show = (theme) => {
    root.dataset.theme = theme;
    notify();
  };

  let rain = read("theme-rain") === "on";
  root.dataset.theme = read("theme") || "cyberpunk";

  const store = {
    get: () => root.dataset.theme,
    rain: () => rain,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    set(theme, from) {
      write("theme", theme);
      if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) {
        show(theme);
        return;
      }
      if (from) {
        const box = from.getBoundingClientRect();
        root.style.setProperty("--wipe-x", `${box.left + box.width / 2}px`);
        root.style.setProperty("--wipe-y", `${box.top + box.height / 2}px`);
      }
      document.startViewTransition(() => show(theme));
    },
    setRain(on) {
      rain = on;
      write("theme-rain", on ? "on" : "off");
      notify();
    },
  };
  window.ronovoTheme = store;

  // Keeps every open tab on the same settings.
  addEventListener("storage", (event) => {
    if (event.key === "theme") show(event.newValue || "cyberpunk");
    if (event.key === "theme-rain") {
      rain = event.newValue === "on";
      notify();
    }
  });

  // The pickers on the pages React doesn't render.
  addEventListener("DOMContentLoaded", () => {
    for (const picker of document.querySelectorAll("select[data-theme-picker]")) {
      picker.value = store.get();
      picker.addEventListener("change", () => store.set(picker.value, picker));
      listeners.add(() => {
        picker.value = store.get();
      });
    }
  });
})();
