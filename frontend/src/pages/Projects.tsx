import { useSearchParams } from "react-router-dom";
import type { Site } from "../types";
import { usePageTitle } from "../usePageTitle";
import Hero from "../components/Hero";
import SectionHead from "../components/SectionHead";
import Filters from "../components/Filters";
import CardGrid from "../components/CardGrid";

const UNFILTERED_PER_CATEGORY = 4;

export default function Projects({ site }: { site: Site }) {
  usePageTitle("Projects", site.name);
  const [params, setParams] = useSearchParams();
  const category = (params.get("category") ?? "").toLowerCase();
  const tag = params.get("tag") ?? "";
  const filtered = Boolean(category || tag);

  const shown = site.projects.filter(
    (p) => (!category || p.category.toLowerCase() === category) && (!tag || p.tags.includes(tag)),
  );
  const groups = site.categories
    .map((c) => ({ name: c.name, projects: shown.filter((p) => p.category === c.name) }))
    .filter((g) => g.projects.length > 0);

  const setFilters = (nextCategory: string, nextTag: string) => {
    const next = new URLSearchParams();
    if (nextCategory) next.set("category", nextCategory);
    if (nextTag) next.set("tag", nextTag);
    setParams(next);
  };

  return (
    <>
      <Hero title="Projects" subtitle="Portfolio | Ian Kent (Ronovo)" />
      <Filters site={site} category={category} tag={tag} matches={shown.length} onChange={setFilters} />
      {groups.map((g) => (
        <section key={`${g.name}|${category}|${tag}`}>
          <SectionHead
            title={g.name}
            link={filtered ? undefined : `/projects?category=${g.name.toLowerCase()}`}
            linkText={`All ${g.name}`}
          />
          <CardGrid projects={filtered ? g.projects : g.projects.slice(0, UNFILTERED_PER_CATEGORY)} />
        </section>
      ))}
      {groups.length === 0 && <p className="soon">No projects match these filters.</p>}
    </>
  );
}
