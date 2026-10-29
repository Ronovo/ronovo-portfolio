import type { Project } from "../types";
import ProjectCard from "./ProjectCard";

export default function CardGrid({ projects }: { projects: Project[] }) {
  return (
    <div className="grid">
      {projects.map((p, i) => (
        <ProjectCard key={p.title} project={p} index={i} />
      ))}
    </div>
  );
}
