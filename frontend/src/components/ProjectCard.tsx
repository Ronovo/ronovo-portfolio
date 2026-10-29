import type { CSSProperties } from "react";
import type { Project } from "../types";

const initials = (title: string) =>
  title
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function ProjectCard({ project, index }: { project: Project; index: number }) {
  const hasLinks = project.source || project.about || project.links.length > 0;
  return (
    <article className="card" style={{ "--i": index } as CSSProperties}>
      {project.category === "Games" && (
        <div className="thumb">{project.thumb ? <img src={project.thumb} alt="" /> : initials(project.title)}</div>
      )}
      <h3>{project.title}</h3>
      <p>{project.desc}</p>
      <ul className="tags">
        {project.tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
      {hasLinks ? (
        <div className="links">
          {project.source && (
            <a href={project.source} rel="noopener">
              Source
            </a>
          )}
          {project.about && <a href={project.about}>About</a>}
          {project.links.map((link) => (
            <a key={link.label} href={link.href} {...(link.external ? { target: "_blank", rel: "noopener" } : {})}>
              {link.label}
            </a>
          ))}
        </div>
      ) : (
        <p className="soon">Coming soon</p>
      )}
    </article>
  );
}
