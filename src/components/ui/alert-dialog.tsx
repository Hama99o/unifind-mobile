/**
 * AlertDialog — Gluestack UI composition for confirmation dialogs.
 * Used via the `confirmAlert()` helper below — NEVER use raw Alert.alert.
 *
 * Usage (import the helper, not this component directly):
 *   import { confirmAlert } from '@/components/ui/alert-dialog';
 *   confirmAlert('Delete?', 'This cannot be undone.', [
 *     { text: 'Delete', style: 'destructive', onPress: () => doDelete() },
 *   ]);
 */

import { useEffect } from "react";
import { Modal, View, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AlertAction {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

export interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  actions?: AlertAction[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AlertDialog({
  isOpen,
  onClose,
  title,
  message,
  actions = [],
}: AlertDialogProps) {
  // Text follows the reading direction (ar was left-aligned, QA 2026-11-10).
  const { isRtl } = useCustomTranslation();
  const textAlign = isRtl ? "right" : "left";

  // Scale-up entrance: 0.95 → 1 over 180ms (S7 mount animation)
  const scale = useSharedValue(0.95);

  useEffect(() => {
    if (isOpen) {
      scale.value = 0.95;
      scale.value = withTiming(1, {
        duration: 180,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [isOpen]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50 items-center justify-center px-6"
        onPress={onClose}
      >
        <Pressable onPress={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 384 }}>
          <Animated.View
            className="w-full bg-background rounded-2xl p-6 shadow-lg"
            style={cardStyle}
          >
            <Heading size="md" className="text-foreground mb-2" style={{ textAlign }}>
              {title}
            </Heading>
            {message ? (
              <Text className="text-muted-foreground text-sm mb-5" style={{ textAlign }}>
                {message}
              </Text>
            ) : null}

            <View className={cn("gap-3", actions.length > 1 ? "flex-col" : "flex-row justify-end")}>
              {actions.map((action, i) => {
                const isDestructive = action.style === "destructive";
                const isCancel = action.style === "cancel";
                return (
                  <Button
                    key={i}
                    label={action.text}
                    variant={isCancel ? "outline" : "solid"}
                    action={isDestructive ? "destructive" : "primary"}
                    onPress={() => {
                      action.onPress?.();
                      onClose();
                    }}
                  />
                );
              })}
            </View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Imperative helper (singleton pattern) ─────────────────────────────────────

// This state lives outside React — updated by the AlertDialogHost.
let _showFn: ((props: Omit<AlertDialogProps, "isOpen" | "onClose">) => void) | null = null;

/** Register the imperative show function — called once by AlertDialogHost. */
export function _registerAlertDialogShow(
  fn: (props: Omit<AlertDialogProps, "isOpen" | "onClose">) => void
) {
  _showFn = fn;
}

/**
 * Show a confirmation alert from anywhere (screens, services, plain functions).
 * Requires <AlertDialogHost> mounted in the root layout.
 *
 * @example
 *   confirmAlert('Delete session?', 'This cannot be undone.', [
 *     { text: 'Cancel', style: 'cancel' },
 *     { text: 'Delete', style: 'destructive', onPress: () => deleteSession() },
 *   ]);
 */
export function confirmAlert(
  title: string,
  message: string,
  actions: AlertAction[]
) {
  if (!_showFn) {
    // Fallback if host not mounted (should not happen in production)
    console.warn("confirmAlert: AlertDialogHost not mounted");
    return;
  }
  _showFn({ title, message, actions });
}
