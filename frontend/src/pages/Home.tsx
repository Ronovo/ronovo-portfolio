import { Link } from "react-router-dom";
import type { Site } from "../types";
import { usePageTitle } from "../usePageTitle";
import Hero from "../components/Hero";
import SectionHead from "../components/SectionHead";
import CategoryTiles from "../components/CategoryTiles";
import CardGrid from "../components/CardGrid";
import AccountCallout from "../components/AccountCallout";

export default function Home({ site }: { site: Site }) {
  usePageTitle(site.name, site.name);
  return (
    <>
      <Hero title={site.name} subtitle={site.tagline} kicker="// portfolio online" home>
        <div className="cta">
          <Link className="btn" to="/projects">
            Browse projects
          </Link>
          <Link className="btn btn-ghost" to="/about">
            About me
          </Link>
          <a className="btn btn-ghost" href="https://ronovo.github.io/">
            My Github
          </a>
        </div>
      </Hero>

      <section>
        <SectionHead title="Browse by category" />
        <CategoryTiles site={site} />
      </section>

      <section>
        <SectionHead title="Featured" link="/projects" linkText="All projects" />
        <CardGrid projects={site.projects.filter((p) => p.featured)} />
      </section>

      <section>
        <AccountCallout site={site} />
      </section>

      <section>
        <SectionHead title="About" link="/about" linkText="More about me" />
        <p className="tag">{site.intro}</p>
      </section>
    </>
  );
}
