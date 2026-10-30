import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { Site } from "../types";
import { categoryHref } from "../category";
import { useKit } from "../theme/kits";

export default function CategoryTiles({ site }: { site: Site }) {
  const kit = useKit();
  return (
    <div className="grid">
      {site.categories.map((c, i) => {
        const count = site.projects.filter((p) => p.category === c.name).length;
        return (
          <Link
            key={c.name}
            className="card tile"
            to={categoryHref(c.name)}
            style={{ "--i": i } as CSSProperties}
          >
            <h3>{c.name}</h3>
            <p>{c.blurb}</p>
            <span className="count">
              {count} project{count === 1 ? "" : "s"} &rarr;
            </span>
            {kit.CardOverlay && <kit.CardOverlay />}
          </Link>
        );
      })}
    </div>
  );
}
