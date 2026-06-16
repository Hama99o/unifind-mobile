/**
 * Input — NativeWind-styled text input composition.
 * Gluestack UI base component. Use this everywhere instead of raw RN TextInput.
 *
 * Exports:
 *   Input         — container View (border + bg + rounded)
 *   InputField    — the actual TextInput inside
 *   InputSlot     — left/right icon slot
 *
 * Usage:
 *   <Input>
 *     <InputSlot><Search size={16} color={colors.muted} /></InputSlot>
 *     <InputField placeholder="Search" value={v} onChangeText={set} />
 *   </Input>
 */

import {
  TextInput,
  View,
  type TextInputProps,
  type ViewProps,
} from "react-native";
import { cn } from "@/lib/utils";

// ─── InputSlot ─────────────────────────────────────────────────────────────────

export function InputSlot({ className, children, ...props }: ViewProps) {
  return (
    <View
      className={cn("items-center justify-center px-2", className)}
      {...props}
    >
      {children}
    </View>
  );
}

// ─── InputField ────────────────────────────────────────────────────────────────

export interface InputFieldProps extends TextInputProps {
  className?: string;
}

export function InputField({ className, ...props }: InputFieldProps) {
  return (
    <TextInput
      className={cn(
        "flex-1 py-2.5 text-sm text-foreground placeholder:text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

// ─── Input (container) ─────────────────────────────────────────────────────────

export interface InputProps extends ViewProps {
  className?: string;
  /** Visual variant */
  variant?: "outline" | "filled";
}

export function Input({ className, variant = "outline", children, ...props }: InputProps) {
  return (
    <View
      className={cn(
        "flex-row items-center rounded-xl overflow-hidden",
        variant === "outline" && "border border-border bg-muted/30",
        variant === "filled" && "bg-muted",
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}
