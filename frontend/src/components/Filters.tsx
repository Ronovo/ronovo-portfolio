import type { Site } from "../types";
import { categoryKey } from "../category";

interface Props {
  site: Site;
  category: string;
  tag: string;
  matches: number;
  onChange: (category: string, tag: string) => void;
}

export default function Filters({ site, category, tag, matches, onChange }: Props) {
  return (
    <form className="filters" aria-label="Filter projects" onSubmit={(e) => e.preventDefault()}>
      <label>
        Category
        <select value={category} onChange={(e) => onChange(e.target.value, tag)}>
          <option value="">All</option>
          {site.categories.map((c) => (
            <option key={c.name} value={categoryKey(c.name)}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Tag
        <select value={tag} onChange={(e) => onChange(category, e.target.value)}>
          <option value="">All</option>
          {site.tags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <output className="mono">
        {matches} match{matches === 1 ? "" : "es"}
      </output>
    </form>
  );
}
