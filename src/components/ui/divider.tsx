/** Divider — simple horizontal rule using Gluestack token colors. */
import { View, ViewProps } from "react-native";

export function Divider({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={`h-px bg-border ${className ?? ""}`} {...props} />;
}
