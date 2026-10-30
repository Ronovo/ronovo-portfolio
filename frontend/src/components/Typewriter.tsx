import { useEffect, useState } from "react";
import { useReducedMotion } from "../theme/useTheme";

export default function Typewriter({ text, speed = 28, onDone }: { text: string; speed?: number; onDone?: () => void }) {
  const reduced = useReducedMotion();
  const [typed, setTyped] = useState(0);
  const shown = reduced ? text.length : typed;
  const done = shown >= text.length;

  useEffect(() => {
    if (done) return;
    const timer = window.setTimeout(() => setTyped(typed + 1), speed);
    return () => window.clearTimeout(timer);
  }, [typed, done, speed]);

  useEffect(() => {
    if (done) onDone?.();
  }, [done]);

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.slice(0, shown)}
        <span className="cursor" />
      </span>
    </>
  );
}
