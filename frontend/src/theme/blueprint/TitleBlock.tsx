import { useLocation } from "react-router-dom";
import type { Site } from "../../types";

export default function TitleBlock({ site }: { site: Site }) {
  const { pathname } = useLocation();
  const sheet = site.nav.findIndex((item) => item.href === pathname) + 1;
  const rows = [
    ["Drawn by", site.name],
    ["Sheet", `${sheet || "-"} of ${site.nav.length}`],
    ["Date", new Date().toLocaleDateString("en-CA")],
    ["Scale", "1:1"],
  ];
  return (
    <dl className="title-block">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
