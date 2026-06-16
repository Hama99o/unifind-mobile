/**
 * Actionsheet — bottom-sheet overlay composition (Gluestack UI base component).
 * Wraps React Native Modal + pan-drag-styled sheet. Used for option pickers,
 * filter sheets, SelectField, SignInSheet, sort pickers.
 *
 * Exports:
 *   Actionsheet            — root (manages backdrop + animation state)
 *   ActionsheetBackdrop    — semi-transparent overlay (press-to-dismiss)
 *   ActionsheetContent     — the white/card sheet that slides up
 *   ActionsheetDragIndicator — visual handle bar at top of sheet
 *   ActionsheetItem        — pressable row inside the sheet
 *   ActionsheetItemText    — text inside ActionsheetItem
 *   ActionsheetSectionHeaderText — section label
 */

import { Modal, View, Pressable, type ViewProps, type PressableProps } from "react-native";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";

// ─── Root ──────────────────────────────────────────────────────────────────────

export interface ActionsheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Actionsheet({ isOpen, onClose, children }: ActionsheetProps) {
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {children}
    </Modal>
  );
}

// ─── Backdrop ─────────────────────────────────────────────────────────────────

export interface ActionsheetBackdropProps extends PressableProps {
  className?: string;
}

export function ActionsheetBackdrop({ className, onPress, ...props }: ActionsheetBackdropProps) {
  return (
    <Pressable
      className={cn("flex-1 bg-black/50", className)}
      onPress={onPress}
      {...props}
    />
  );
}

// ─── Content ──────────────────────────────────────────────────────────────────

export interface ActionsheetContentProps extends ViewProps {
  className?: string;
}

export function ActionsheetContent({ className, children, ...props }: ActionsheetContentProps) {
  return (
    <View
      className={cn(
        "absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl pb-6 max-h-[80%]",
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}

// ─── Drag indicator ───────────────────────────────────────────────────────────

export function ActionsheetDragIndicator() {
  return (
    <View className="items-center pt-3 pb-1">
      <View className="w-10 h-1 rounded-full bg-border" />
    </View>
  );
}

// ─── Item ─────────────────────────────────────────────────────────────────────

export interface ActionsheetItemProps extends PressableProps {
  className?: string;
  isSelected?: boolean;
}

export function ActionsheetItem({ className, isSelected, children, ...props }: ActionsheetItemProps) {
  return (
    <Pressable
      className={cn(
        "px-4 py-3.5 flex-row items-center justify-between border-b border-border/50 active:bg-muted",
        isSelected && "bg-muted/60",
        className
      )}
      accessibilityRole="button"
      {...props}
    >
      {children}
    </Pressable>
  );
}

// ─── Item text ────────────────────────────────────────────────────────────────

export interface ActionsheetItemTextProps {
  className?: string;
  children: React.ReactNode;
}

export function ActionsheetItemText({ className, children }: ActionsheetItemTextProps) {
  return (
    <Text className={cn("text-sm text-foreground", className)}>
      {children}
    </Text>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

export function ActionsheetSectionHeaderText({ className, children }: ActionsheetItemTextProps) {
  return (
    <Text className={cn("text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 pt-3 pb-1", className)}>
      {children}
    </Text>
  );
}
