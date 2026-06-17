import { lightColors, type AppColors } from "@/config/theme";

/** Brand colors for inline-style code (maps/charts/icons). Prefer NativeWind
 * className theme tokens for everything else.
 *
 * LIGHT-MODE ONLY: the unifind web app has no dark mode (no `darkMode` in its
 * Tailwind config, no theme toggle), so the mobile app mirrors it and is locked
 * to light (`userInterfaceStyle: "light"` in app.json). We always return the
 * light palette; `darkColors` / the `.dark` CSS block are intentionally unused. */
export function useColors(): AppColors {
  return lightColors;
}
