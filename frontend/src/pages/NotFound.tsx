import { Link } from "react-router-dom";
import type { Site } from "../types";
import { usePageTitle } from "../usePageTitle";
import Hero from "../components/Hero";

export default function NotFound({ site }: { site: Site }) {
  usePageTitle("Page not found", site.name);
  return (
    <>
      <Hero title="404" subtitle="Signal lost. That page doesn't exist or has moved." kicker="// error" />
      <p>
        <Link to="/">&larr; Back to the home page</Link>
      </p>
    </>
  );
}
