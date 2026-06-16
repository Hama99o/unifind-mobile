import { Text as RNText, type TextProps } from "react-native";
import { cn } from "@/lib/utils";

/**
 * Base Text. The ONLY place raw RN Text is allowed — all copy in the app
 * imports Text from here. Replace/extend with the official Gluestack `text`
 * component via `npx gluestack-ui add text` (see GLUESTACK_MIGRATION_CHECKLIST).
 */
export function Text({ className, ...props }: TextProps & { className?: string }) {
  return <RNText className={cn("text-base text-foreground", className)} {...props} />;
}
