import type { Site } from "../types";
import { useRain, useTheme } from "./useTheme";

export default function ThemePicker({ site }: { site: Site }) {
  const theme = useTheme();
  const rain = useRain();
  return (
    <div className="theme-picker">
      <select aria-label="Theme" value={theme} onChange={(e) => window.ronovoTheme.set(e.target.value, e.target)}>
        {site.themes.map((group) => (
          <optgroup key={group.name} label={group.name}>
            {group.themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {theme === "terminal" && (
        <label>
          <input type="checkbox" checked={rain} onChange={(e) => window.ronovoTheme.setRain(e.target.checked)} />
          Rain
        </label>
      )}
    </div>
  );
}
