import { lazy, type ComponentType } from "react";
import type { Site } from "../types";
import Glitch from "../components/Glitch";
import Typewriter from "../components/Typewriter";
import { useRain, useReducedMotion, useTheme } from "./useTheme";
import PromptTitle from "./terminal/PromptTitle";
import BootSequence from "./terminal/BootSequence";
import D20Roll from "./grimoire/D20Roll";
import Dimensions from "./blueprint/Dimensions";
import TitleBlock from "./blueprint/TitleBlock";

// The components a theme puts in each slot. The CSS side of a theme is its block in static/brand.css.
export interface Kit {
  Brand: ComponentType<{ text: string }>;
  Title: ComponentType<{ text: string }>;
  Tagline: ComponentType<{ site: Site }>;
  HomeExtra?: ComponentType<{ site: Site }>;
  CardOverlay?: ComponentType;
  FooterExtra?: ComponentType<{ site: Site }>;
  Backdrop?: ComponentType<{ site: Site }>;
}

const MatrixRain = lazy(() => import("./terminal/MatrixRain"));
const Crosshair = lazy(() => import("./blueprint/Crosshair"));

function Rain({ site }: { site: Site }) {
  const rain = useRain();
  const reduced = useReducedMotion();
  return rain && !reduced ? <MatrixRain site={site} /> : null;
}

const Plain = ({ text }: { text: string }) => <>{text}</>;

const plain: Kit = {
  Brand: Plain,
  Title: Plain,
  Tagline: ({ site }) => <>{site.tagline}</>,
};

const cyberpunk: Kit = {
  Brand: Glitch,
  Title: Glitch,
  Tagline: ({ site }) => <Typewriter text={site.tagline} />,
};

const KITS: Record<string, Kit> = {
  cyberpunk,
  light: plain,
  dark: plain,
  terminal: { Brand: Plain, Title: PromptTitle, Tagline: BootSequence, Backdrop: Rain },
  grimoire: { ...plain, HomeExtra: D20Roll },
  blueprint: { ...plain, CardOverlay: Dimensions, FooterExtra: TitleBlock, Backdrop: Crosshair },
};

export const useKit = () => KITS[useTheme()] ?? cyberpunk;
