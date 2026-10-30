import { useEffect, useRef, useState } from "react";

// Dimension lines with the live size of the card this is rendered in.
export default function Dimensions() {
  const ref = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const card = ref.current?.parentElement;
    if (!card) return;
    const observer = new ResizeObserver(([entry]) => {
      const [box] = entry.borderBoxSize;
      setSize({ width: Math.round(box.inlineSize), height: Math.round(box.blockSize) });
    });
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return (
    <span ref={ref} className="dims" aria-hidden="true">
      {size && (
        <>
          <span className="dim dim-width">
            <span>{size.width} px</span>
          </span>
          <span className="dim dim-height">
            <span>{size.height} px</span>
          </span>
        </>
      )}
    </span>
  );
}
