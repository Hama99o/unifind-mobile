import Animated from "react-native-reanimated";
import { Pressable, type PressableProps } from "react-native";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";
import { usePressScale } from "@/hooks/usePressScale";

type Variant = "solid" | "outline" | "ghost";
type Action = "primary" | "secondary" | "destructive";

const base = "h-12 px-5 rounded-xl flex-row items-center justify-center";
const byVariant: Record<Variant, Record<Action, string>> = {
  solid: {
    primary: "bg-primary",
    secondary: "bg-secondary",
    destructive: "bg-destructive",
  },
  outline: {
    primary: "border border-primary",
    secondary: "border border-secondary",
    destructive: "border border-destructive",
  },
  ghost: { primary: "", secondary: "", destructive: "" },
};
const textByVariant: Record<Variant, Record<Action, string>> = {
  solid: {
    primary: "text-primary-foreground",
    secondary: "text-secondary-foreground",
    destructive: "text-destructive-foreground",
  },
  outline: {
    primary: "text-primary",
    secondary: "text-secondary-foreground",
    destructive: "text-destructive",
  },
  ghost: {
    primary: "text-primary",
    secondary: "text-secondary-foreground",
    destructive: "text-destructive",
  },
};

/**
 * Button — Gluestack-aligned pressable with 0.97 scale feedback (S1).
 *
 * Layout model:
 *   Animated.View  — receives `className` so callers can control layout
 *                    positioning (w-full, mx-4, mt-2, flex-1, etc.)
 *   Pressable      — receives base + variant classes + `className` so
 *                    callers can also override sizing (h-9, h-11, etc.)
 *
 * Both layers get className so layout AND sizing overrides work correctly.
 * The Animated.View has no fixed size of its own; it wraps the Pressable
 * without constraining it.
 */
export function Button({
  className,
  variant = "solid",
  action = "primary",
  label,
  disabled,
  onPressIn: callerPressIn,
  onPressOut: callerPressOut,
  ...props
}: PressableProps & {
  className?: string;
  variant?: Variant;
  action?: Action;
  label: string;
}) {
  const { animStyle, handlePressIn, handlePressOut } = usePressScale();

  return (
    <Animated.View style={animStyle} className={cn(className)}>
      <Pressable
        className={cn(base, byVariant[variant][action], disabled && "opacity-50", className)}
        disabled={disabled}
        onPressIn={(e) => {
          handlePressIn();
          callerPressIn?.(e);
        }}
        onPressOut={(e) => {
          handlePressOut();
          callerPressOut?.(e);
        }}
        {...props}
      >
        <Text className={cn("font-semibold", textByVariant[variant][action])}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
