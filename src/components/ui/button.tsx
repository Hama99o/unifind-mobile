import Animated from "react-native-reanimated";
import { Pressable, type PressableProps, type ViewStyle } from "react-native";
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
 * Button — Gluestack-aligned pressable with 0.97 scale feedback.
 *
 * Native layout model (CRITICAL — see mobile.prompt.md §native-rule):
 *   Animated.View — ONLY carries style={animStyle} (transform scale).
 *                   NO className: NativeWind/css-interop double-wraps the
 *                   animated node on native and silently drops className layout.
 *   style prop    — pass inline numeric styles for outer sizing/spacing
 *                   (height, margin, flex, etc.) — they go on Animated.View
 *                   via `style` (not className) so they survive on native.
 *   Pressable     — carries base + variant classes for visual styling only;
 *                   `className` on Pressable is fine (not Animated).
 *
 * Callers: always use `style={{ height: 44 }}` etc. not `className="h-11"`.
 * Wrap in a plain <View className="flex-1"> for flex-1 layout outside the button.
 */
export function Button({
  className,
  style,
  variant = "solid",
  action = "primary",
  label,
  disabled,
  onPressIn: callerPressIn,
  onPressOut: callerPressOut,
  ...props
}: PressableProps & {
  className?: string;
  style?: ViewStyle;
  variant?: Variant;
  action?: Action;
  label: string;
}) {
  const { animStyle, handlePressIn, handlePressOut } = usePressScale();

  return (
    // className MUST NOT be placed on Animated.View — use style for outer layout
    <Animated.View style={[animStyle, style]}>
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
