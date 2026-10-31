import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Site } from "../../types";
import { useNavIndex } from "../useNavIndex";

const clock = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function Taskbar({ site }: { site: Site }) {
  const page = site.nav[useNavIndex(site)]?.label ?? "Not found";
  const [time, setTime] = useState(clock);

  useEffect(() => {
    const timer = window.setInterval(() => setTime(clock()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="taskbar">
      <Link className="btn btn-ghost" to="/">
        Start
      </Link>
      <span className="task">
        {page} - {site.name}
      </span>
      <span className="tray">{time}</span>
    </div>
  );
}
