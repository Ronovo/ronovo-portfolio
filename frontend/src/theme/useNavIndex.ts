import { useLocation } from "react-router-dom";
import type { Site } from "../types";

// The index in site.nav of the page at the current path, or -1.
export function useNavIndex(site: Site) {
  const { pathname } = useLocation();
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return site.nav.findIndex((item) => item.href === path);
}
