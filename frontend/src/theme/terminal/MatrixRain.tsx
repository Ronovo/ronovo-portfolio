import { useEffect, useRef } from "react";
import type { Site } from "../../types";

const KATAKANA = Array.from({ length: 56 }, (_, i) => String.fromCharCode(0xff66 + i)).join("");
const CELL = 18;
const FRAME_MS = 1000 / 30;

export default function MatrixRain({ site }: { site: Site }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const letters = new Set(site.projects.map((p) => p.title.toUpperCase().replace(/[^A-Z0-9]/g, "")).join(""));
    const glyphs = KATAKANA + "0123456789" + [...letters].join("");
    const glyph = () => glyphs[Math.floor(Math.random() * glyphs.length)];
    const style = getComputedStyle(document.documentElement);
    const [bg, trail, head] = ["--bg", "--text", "--highlight"].map((name) => style.getPropertyValue(name).trim());

    // rows[c] is the row of column c's falling head; flashes[c] counts down a column's glitch flash.
    let rows: number[] = [];
    let flashes: number[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let last = 0;

    const resize = () => {
      const scale = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * scale;
      canvas.height = height * scale;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.font = `${CELL - 4}px "JetBrains Mono", monospace`;
      ctx.textBaseline = "top";
      ctx.shadowColor = head;
      rows = Array.from({ length: Math.ceil(width / CELL) }, () => -Math.floor((Math.random() * height) / CELL));
      flashes = rows.map(() => 0);
    };

    const paint = (column: number, row: number, color: string, glow = 0) => {
      ctx.fillStyle = bg;
      ctx.fillRect(column * CELL, row * CELL, CELL, CELL);
      ctx.fillStyle = color;
      ctx.shadowBlur = glow;
      ctx.fillText(glyph(), column * CELL + 2, row * CELL + 1);
      ctx.shadowBlur = 0;
    };

    const draw = (time: number) => {
      frame = requestAnimationFrame(draw);
      if (time - last < FRAME_MS) return;
      last = time;

      // Fade everything a little, so older glyphs trail off.
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;

      rows.forEach((row, column) => {
        paint(column, row - 1, trail);
        if (Math.random() < 0.002) flashes[column] = 14;
        paint(column, row, head, flashes[column] > 0 ? 14 : 0);
        flashes[column] = Math.max(0, flashes[column] - 1);
        rows[column] = row * CELL > height && Math.random() > 0.975 ? 0 : row + 1;
      });

      // A few glyphs in the trails change as they fall.
      for (let i = 0; i < 3; i++) {
        const column = Math.floor(Math.random() * rows.length);
        const row = rows[column] - 2 - Math.floor(Math.random() * 14);
        if (row >= 0) paint(column, row, trail);
      }
    };

    resize();
    frame = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [site]);

  return <canvas ref={ref} className="backdrop-canvas" aria-hidden="true" />;
}
