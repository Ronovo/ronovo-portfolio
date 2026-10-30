import type { Site } from "../types";
import { useKit } from "../theme/kits";

export default function Footer({ site }: { site: Site }) {
  const kit = useKit();
  return (
    <footer className="site-footer">
      <div className="wrap">
        {kit.FooterExtra && <kit.FooterExtra site={site} />}
        <span>
          &copy; {new Date().getFullYear()} {site.name}
        </span>
        <a href="#top">Back to top</a>
      </div>
    </footer>
  );
}
