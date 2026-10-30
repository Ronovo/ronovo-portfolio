import type { CSSProperties } from "react";
import type { Project } from "../types";
import { useKit } from "../theme/kits";

export default function ProjectCard({ project, index }: { project: Project; index: number }) {
  const hasLinks = project.source || project.about || project.links.length > 0;
  const kit = useKit();
  return (
    <article className="card" style={{ "--i": index } as CSSProperties}>
      {project.thumb && (
        <div className="thumb">
          <img src={project.thumb} alt="" />
        </div>
      )}
      <h3>{project.title}</h3>
      <p className="desc">{project.desc}</p>
      <ul className="tags">
        {project.tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
      {hasLinks ? (
        <div className="links">
          {project.source && (
            <a href={project.source}>
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
      {kit.CardOverlay && <kit.CardOverlay />}
    </article>
  );
}
