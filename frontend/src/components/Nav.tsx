import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import type { Site } from "../types";
import { useKit } from "../theme/kits";
import ThemePicker from "../theme/ThemePicker";

export default function Nav({ site }: { site: Site }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const kit = useKit();

  useEffect(() => setOpen(false), [location]);

  return (
    <nav className={`site-nav${open ? " open" : ""}`} aria-label="Main">
      <div className="wrap">
        <Link className="brand" to="/">
          <kit.Brand text={site.name} />
        </Link>
        <button className="menu-toggle" aria-expanded={open} aria-controls="nav-links" onClick={() => setOpen(!open)}>
          Menu
        </button>
        <ul id="nav-links">
          {site.nav.map((item) => (
            <li key={item.href}>
              <NavLink to={item.href} end>
                {item.label}
              </NavLink>
            </li>
          ))}
          <li>
            <a href="/account">{site.account ?? "Log in"}</a>
          </li>
          <li>
            <ThemePicker site={site} />
          </li>
        </ul>
      </div>
    </nav>
  );
}
