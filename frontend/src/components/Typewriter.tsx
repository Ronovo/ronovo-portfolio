import { useEffect, useState } from "react";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function Typewriter({ text, speed = 28 }: { text: string; speed?: number }) {
  const [shown, setShown] = useState(() => (reducedMotion() ? text.length : 0));

  useEffect(() => {
    if (shown >= text.length) return;
    const timer = window.setTimeout(() => setShown(shown + 1), speed);
    return () => window.clearTimeout(timer);
  }, [shown, text, speed]);

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
