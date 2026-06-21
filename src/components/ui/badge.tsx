/** Badge — small label chip using Gluestack tokens. */
import { View, ViewProps } from "react-native";
import { Text } from "@/components/ui/text";

interface BadgeProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
}

export function Badge({ className, children, ...props }: BadgeProps) {
  return (
    <View className={`px-2 py-0.5 rounded-full bg-secondary ${className ?? ""}`} {...props}>
      {children}
    </View>
  );
}

interface BadgeTextProps { className?: string; children?: React.ReactNode }
export function BadgeText({ className, children }: BadgeTextProps) {
  return <Text className={`text-xs font-medium text-foreground ${className ?? ""}`}>{children}</Text>;
}
