import type { Site } from "../types";

export default function Footer({ site }: { site: Site }) {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <span>
          &copy; {new Date().getFullYear()} {site.name}
        </span>
        <a href="#top">Back to top</a>
      </div>
    </footer>
  );
}
