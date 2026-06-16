import { Text as RNText, type TextProps } from "react-native";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";
const sizes: Record<Size, string> = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
  xl: "text-3xl",
};

export function Heading({
  className,
  size = "lg",
  ...props
}: TextProps & { className?: string; size?: Size }) {
  return (
    <RNText
      className={cn("font-semibold text-foreground", sizes[size], className)}
      {...props}
    />
  );
}
