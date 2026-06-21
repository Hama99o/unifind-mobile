/**
 * ToastHost — renders the global toast (from toastStore) as a floating pill
 * above the tab bar. Mounted once at the root. Auto-dismisses after ~2.4s.
 * Light-mode only; uses theme tokens (prussian pill, white text).
 */

import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

import { Text } from "@/components/ui/text";
import { useToastStore } from "@/stores/toastStore";

export function ToastHost() {
  const message = useToastStore((s) => s.message);
  const seq = useToastStore((s) => s.seq);
  const hide = useToastStore((s) => s.hide);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);

  useEffect(() => {
    if (!message) return;
    opacity.value = withTiming(1, { duration: 200 });
    translateY.value = withTiming(0, { duration: 200 });
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 220 });
      translateY.value = withTiming(24, { duration: 220 }, (finished) => {
        if (finished) runOnJS(hide)();
      });
    }, 2400);
    return () => clearTimeout(timer);
    // re-run on every show (seq) so repeated toasts re-animate
  }, [seq]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!message) return null;

  return (
    <SafeAreaView
      edges={["bottom"]}
      pointerEvents="none"
      style={{ position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center" }}
    >
      {/* className must NOT live on Animated.View — move to inner plain View */}
      <Animated.View style={[style, { marginBottom: 96, marginHorizontal: 24 }]}>
        <View className="px-4 py-3 rounded-2xl bg-primary shadow-lg">
          <Text className="text-primary-foreground text-sm font-semibold text-center">{message}</Text>
        </View>
      </Animated.View>
      <View />
    </SafeAreaView>
  );
}
