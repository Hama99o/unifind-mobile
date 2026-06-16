import { ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/useColors";

export function Spinner({ size = "large" }: { size?: "small" | "large" }) {
  const colors = useColors();
  return <ActivityIndicator size={size} color={colors.primary} />;
}
