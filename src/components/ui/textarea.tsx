/**
 * Textarea — Gluestack UI v2 composition for multiline text input.
 * Built on RN TextInput with the same theming as Input.
 *
 * Usage:
 *   <Textarea>
 *     <TextareaInput
 *       value={val}
 *       onChangeText={set}
 *       placeholder="Type here..."
 *     />
 *   </Textarea>
 */

import { TextInput, View, type TextInputProps, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

export interface TextareaInputProps extends TextInputProps {
  className?: string;
}

export function TextareaInput({ className, ...props }: TextareaInputProps) {
  return (
    <TextInput
      multiline
      textAlignVertical="top"
      className={cn(
        "flex-1 py-2.5 px-1 text-sm text-foreground placeholder:text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

export interface TextareaProps extends ViewProps {
  className?: string;
}

export function Textarea({ className, children, ...props }: TextareaProps) {
  return (
    <View
      className={cn(
        "rounded-xl border border-border bg-muted/30 px-3 py-2",
        className
      )}
      style={{ minHeight: 100 }}
      {...props}
    >
      {children}
    </View>
  );
}
