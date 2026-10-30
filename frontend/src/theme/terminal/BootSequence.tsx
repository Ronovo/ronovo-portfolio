import { useEffect, useState } from "react";
import type { Site } from "../../types";
import { useReducedMotion } from "../useTheme";
import Typewriter from "../../components/Typewriter";

const SEEN = "boot-seen";

const seen = () => {
  try {
    return sessionStorage.getItem(SEEN) === "1";
  } catch {
    return false;
  }
};

export default function BootSequence({ site }: { site: Site }) {
  const reduced = useReducedMotion();
  const name = site.name.toLowerCase();
  const lines = [
    `> booting ${name}.sys ... ok`,
    `> mounting ${site.categories.length} categories ... ok`,
    `> indexing ${site.projects.length} projects ... ok`,
    `${name}@portfolio:~$ cat tagline.txt`,
  ];
  // One step per boot line, then one for the tagline.
  const last = lines.length + 1;
  const [step, setStep] = useState(() => (reduced || seen() ? last : 0));
  const done = step === last;

  useEffect(() => {
    if (done) {
      try {
        sessionStorage.setItem(SEEN, "1");
      } catch {}
      return;
    }
    const skip = () => setStep(last);
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [done, last]);

  return (
    <>
      <span className="boot-log" aria-hidden="true">
        {lines.slice(0, step).map((line) => (
          <span key={line} className="boot-line">
            {line}
          </span>
        ))}
        {step < lines.length && (
          <span className="boot-line">
            <Typewriter key={step} text={lines[step]} speed={14} onDone={() => setStep(step + 1)} />
          </span>
        )}
      </span>
      {step === lines.length && <Typewriter text={site.tagline} onDone={() => setStep(last)} />}
      {done && (
        <>
          {site.tagline}
          <span className="cursor" aria-hidden="true" />
        </>
      )}
    </>
  );
}
