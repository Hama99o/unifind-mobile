/**
 * Checkbox — Gluestack UI v2 composition for boolean selection.
 *
 * Usage:
 *   <CheckboxGroup value={checked} onChange={setChecked}>
 *     <Checkbox value="opt1">
 *       <CheckboxIndicator>
 *         <CheckboxIcon />
 *       </CheckboxIndicator>
 *       <CheckboxLabel>Option 1</CheckboxLabel>
 *     </Checkbox>
 *   </CheckboxGroup>
 *
 *   Or standalone with isChecked + onChange:
 *   <Checkbox isChecked={val} onChange={setVal}>
 *     <CheckboxIndicator><CheckboxIcon /></CheckboxIndicator>
 *     <CheckboxLabel>Label</CheckboxLabel>
 *   </Checkbox>
 */

import React from "react";
import { Pressable, View, type ViewProps } from "react-native";
import { Check } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useColors } from "@/hooks/useColors";
import { cn } from "@/lib/utils";

// ─── CheckboxIcon ──────────────────────────────────────────────────────────────

export function CheckboxIcon() {
  const colors = useColors();
  return <Check size={12} color={colors.primaryForeground} strokeWidth={3} />;
}

// ─── CheckboxIndicator ─────────────────────────────────────────────────────────

interface CheckboxIndicatorProps extends ViewProps {
  isChecked?: boolean;
}

export function CheckboxIndicator({ isChecked, className, children, ...props }: CheckboxIndicatorProps) {
  return (
    <View
      className={cn(
        "w-5 h-5 rounded border-2 items-center justify-center",
        isChecked ? "bg-primary border-primary" : "border-border bg-transparent",
        className
      )}
      {...props}
    >
      {isChecked ? children : null}
    </View>
  );
}

// ─── CheckboxLabel ─────────────────────────────────────────────────────────────

export function CheckboxLabel({ children, className }: { children: string; className?: string }) {
  return (
    <Text className={cn("text-sm text-foreground flex-1", className)}>
      {children}
    </Text>
  );
}

// ─── Checkbox ──────────────────────────────────────────────────────────────────

interface CheckboxProps {
  isChecked?: boolean;
  onChange?: (checked: boolean) => void;
  isDisabled?: boolean;
  isRtl?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function Checkbox({
  isChecked = false,
  onChange,
  isDisabled = false,
  isRtl = false,
  children,
  className,
}: CheckboxProps) {
  const clonedChildren = mapCheckboxChildren(children, isChecked);
  return (
    <Pressable
      onPress={() => !isDisabled && onChange?.(!isChecked)}
      className={cn(
        "flex-row items-center gap-3",
        isRtl && "flex-row-reverse",
        isDisabled && "opacity-40",
        className
      )}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isChecked, disabled: isDisabled }}
      hitSlop={8}
    >
      {clonedChildren}
    </Pressable>
  );
}

/** Clones CheckboxIndicator children, injecting isChecked so they render correctly. */
function mapCheckboxChildren(children: React.ReactNode, isChecked: boolean): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    // Inject isChecked into CheckboxIndicator
    if (child.type === CheckboxIndicator) {
      return React.cloneElement(child as React.ReactElement<{ isChecked?: boolean }>, { isChecked });
    }
    return child;
  });
}
