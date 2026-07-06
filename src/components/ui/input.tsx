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
  Children,
  cloneElement,
  isValidElement,
  useState,
  type ReactElement,
} from "react";
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
  const [focused, setFocused] = useState(false);

  // Inject focus tracking into the InputField child so the container border
  // highlights on focus (the mobile equivalent of web's input focus/hover ring).
  const enhanced = Children.map(children, (child) => {
    if (isValidElement(child) && child.type === InputField) {
      const el = child as ReactElement<InputFieldProps>;
      const overrides: Partial<InputFieldProps> = {
        onFocus: (e) => {
          setFocused(true);
          el.props.onFocus?.(e);
        },
        onBlur: (e) => {
          setFocused(false);
          el.props.onBlur?.(e);
        },
      };
      return cloneElement(el, overrides);
    }
    return child;
  });

  return (
    <View
      className={cn(
        "flex-row items-center rounded-xl overflow-hidden",
        variant === "outline" &&
          (focused ? "border border-primary bg-background" : "border border-border bg-muted/30"),
        variant === "filled" && "bg-muted",
        className
      )}
      {...props}
    >
      {enhanced}
    </View>
  );
}
