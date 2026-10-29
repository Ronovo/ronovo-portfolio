import type { ReactNode } from "react";
import Glitch from "./Glitch";
import Typewriter from "./Typewriter";

interface Props {
  title: string;
  subtitle: string;
  kicker?: string;
  home?: boolean;
  children?: ReactNode;
}

export default function Hero({ title, subtitle, kicker, home = false, children }: Props) {
  return (
    <header className={`hero${home ? " hero-home" : ""}`}>
      {kicker && <p className="kicker">{kicker}</p>}
      <h1>
        <Glitch text={title} />
      </h1>
      <p className="tag">{home ? <Typewriter text={subtitle} /> : subtitle}</p>
      {children}
    </header>
  );
}
