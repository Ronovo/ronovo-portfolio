import { useRef } from "react";
import { usePointer } from "../usePointer";

const pad = (n: number) => String(Math.round(n)).padStart(4, "0");

export default function Crosshair() {
  const ref = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  usePointer(ref, (x, y) => {
    readout.current!.textContent = `X ${pad(x)}  Y ${pad(y)}`;
  });
  return (
    <div ref={ref} className="crosshair" aria-hidden="true">
      <span ref={readout} className="crosshair-readout" />
    </div>
  );
}
