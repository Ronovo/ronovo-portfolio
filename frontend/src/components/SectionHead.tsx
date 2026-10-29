import { Link } from "react-router-dom";

export default function SectionHead({ title, link, linkText }: { title: string; link?: string; linkText?: string }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      {link && <Link to={link}>{linkText} &rarr;</Link>}
    </div>
  );
}
