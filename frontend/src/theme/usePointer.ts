import { useEffect, type RefObject } from "react";

// Writes the pointer position to --mx and --my on the element, once a frame, without re-rendering.
export function usePointer(ref: RefObject<HTMLElement>, onMove?: (x: number, y: number) => void) {
  useEffect(() => {
    const element = ref.current;
    if (!element || !window.matchMedia("(hover: hover)").matches) return;
    let frame = 0;
    const move = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        element.style.setProperty("--mx", `${event.clientX}px`);
        element.style.setProperty("--my", `${event.clientY}px`);
        onMove?.(event.clientX, event.clientY);
      });
    };
    window.addEventListener("pointermove", move);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(frame);
    };
  }, [ref]);
}
