import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { Site } from "../types";

export default function CategoryTiles({ site }: { site: Site }) {
  return (
    <div className="grid">
      {site.categories.map((c, i) => {
        const count = site.projects.filter((p) => p.category === c.name).length;
        return (
          <Link
            key={c.name}
            className="card tile"
            to={`/projects?category=${c.name.toLowerCase()}`}
            style={{ "--i": i } as CSSProperties}
          >
            <h3>{c.name}</h3>
            <p>{c.blurb}</p>
            <span className="count">
              {count} project{count === 1 ? "" : "s"} &rarr;
            </span>
          </Link>
        );
      })}
    </div>
  );
}
