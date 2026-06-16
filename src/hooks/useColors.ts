import { useColorScheme } from "react-native";
import { darkColors, lightColors, type AppColors } from "@/config/theme";

/** Brand colors for inline-style code (maps/charts/icons). Prefer NativeWind
 * className theme tokens for everything else. */
export function useColors(): AppColors {
  const scheme = useColorScheme();
  return scheme === "dark" ? darkColors : lightColors;
}
