import type { ReactNode } from "react";
import { useKit } from "../theme/kits";

interface Props {
  title: string;
  subtitle: ReactNode;
  kicker?: string;
  home?: boolean;
  children?: ReactNode;
}

export default function Hero({ title, subtitle, kicker, home = false, children }: Props) {
  const kit = useKit();
  return (
    <header className={`hero${home ? " hero-home" : ""}`}>
      {kicker && <p className="kicker">{kicker}</p>}
      <h1>
        <kit.Title text={title} />
      </h1>
      <p className="tag">{subtitle}</p>
      {children}
    </header>
  );
}
