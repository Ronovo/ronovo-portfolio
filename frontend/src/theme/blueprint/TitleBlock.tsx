import type { Site } from "../../types";
import { useNavIndex } from "../useNavIndex";

export default function TitleBlock({ site }: { site: Site }) {
  const sheet = useNavIndex(site) + 1;
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
