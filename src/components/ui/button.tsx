import { Pressable, type PressableProps } from "react-native";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";

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

export function Button({
  className,
  variant = "solid",
  action = "primary",
  label,
  disabled,
  ...props
}: PressableProps & {
  className?: string;
  variant?: Variant;
  action?: Action;
  label: string;
}) {
  return (
    <Pressable
      className={cn(base, byVariant[variant][action], disabled && "opacity-50", className)}
      disabled={disabled}
      {...props}
    >
      <Text className={cn("font-semibold", textByVariant[variant][action])}>
        {label}
      </Text>
    </Pressable>
  );
}
