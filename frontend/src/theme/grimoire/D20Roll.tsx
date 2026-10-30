import { useEffect, useId, useState } from "react";
import type { Project, Site } from "../../types";
import { useReducedMotion } from "../useTheme";

interface Entry {
  from: number;
  to: number;
  title: string;
  href?: string;
}

const d20 = () => 1 + Math.floor(Math.random() * 20);

// 1 and 20 are the fumble and the crit; faces 2-19 are split as evenly as they go among the projects.
const rollTable = (projects: Project[]): Entry[] => {
  const pool = projects.filter((p) => p.about || p.source).slice(0, 18);
  return [
    { from: 1, to: 1, title: "The ink smudges. Roll again." },
    ...pool.map((p, i) => ({
      from: 2 + Math.floor((i * 18) / pool.length),
      to: 1 + Math.floor(((i + 1) * 18) / pool.length),
      title: p.title,
      href: (p.about ?? p.source)!,
    })),
    { from: 20, to: 20, title: "The whole library", href: "/projects" },
  ];
};

const EntryText = ({ entry }: { entry: Entry }) => (entry.href ? <a href={entry.href}>{entry.title}</a> : <>{entry.title}</>);

export default function D20Roll({ site }: { site: Site }) {
  const reduced = useReducedMotion();
  const tableId = useId();
  const [face, setFace] = useState<number | null>(null);
  const [tumbling, setTumbling] = useState(false);
  const [flicker, setFlicker] = useState(20);
  const [showTable, setShowTable] = useState(false);
  const table = rollTable(site.projects);

  useEffect(() => {
    if (!tumbling) return;
    const flick = window.setInterval(() => setFlicker(d20()), 60);
    const stop = window.setTimeout(() => setTumbling(false), 900);
    return () => {
      window.clearInterval(flick);
      window.clearTimeout(stop);
    };
  }, [tumbling]);

  const throwDie = () => {
    setFace(d20());
    setTumbling(!reduced);
  };

  const result = tumbling ? null : face;
  const rolled = result === null ? undefined : table.find((e) => e.from <= result && result <= e.to);
  const mood = result === 20 ? " crit" : result === 1 ? " fumble" : "";

  return (
    <div className={`d20${tumbling ? " tumbling" : ""}${mood}`}>
      <div className="d20-controls">
        <button className="btn btn-ghost" onClick={throwDie} disabled={tumbling}>
          <svg className="d20-die" viewBox="0 0 100 100" width="44" height="44" aria-hidden="true">
            <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" />
            <polygon points="50,24 77,70 23,70" />
            <path d="M50 4L50 24M90 27L50 24M90 27L77 70M90 73L77 70M50 96L77 70M50 96L23 70M10 73L23 70M10 27L23 70M10 27L50 24" />
            <text x="50" y="63" textAnchor="middle">
              {tumbling ? flicker : (face ?? 20)}
            </text>
          </svg>
          {result === 1 ? "Roll again" : "Roll for a project"}
        </button>
        <button
          className="btn btn-ghost"
          aria-expanded={showTable}
          aria-controls={tableId}
          onClick={() => setShowTable(!showTable)}
        >
          {showTable ? "Hide the table" : "Show the table"}
        </button>
        <p className="d20-result" aria-live="polite">
          {rolled && (
            <>
              {result === 1 ? "Natural 1. " : result === 20 ? "Natural 20, critical! " : `You rolled ${result}: `}
              <EntryText entry={rolled} />
            </>
          )}
        </p>
      </div>
      {showTable && (
        <table id={tableId} className="roll-table">
          <thead>
            <tr>
              <th scope="col">d20</th>
              <th scope="col">Result</th>
            </tr>
          </thead>
          <tbody>
            {table.map((entry) => (
              <tr key={entry.from} className={entry === rolled ? "rolled" : undefined}>
                <td>{entry.from === entry.to ? entry.from : `${entry.from}-${entry.to}`}</td>
                <td>
                  <EntryText entry={entry} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
