/**
 * CompareBar — sticky bottom bar showing the compare cart.
 * Shown when cart is non-empty; contains count + "Compare Now" CTA + clear.
 * COMPARE_FAVORITES.md is the authoritative spec.
 *
 * Mounted in the list screen's stickyBottom prop so it sits above the tab bar.
 *
 * clearAll: clears both local store AND server (toggleCompare for each compared id),
 * so items don't reappear after initUserData re-fetches.
 */

import { View, Pressable } from "react-native";
import Animated, { SlideInDown } from "react-native-reanimated";
import { GitCompare, X } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useColors } from "@/hooks/useColors";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { showToast } from "@/stores/toastStore";
import type { CompareItemType } from "@/api/comparesApi";
import { comparesApi } from "@/api/comparesApi";
import { useCompareStore } from "@/stores/compareStore";
import { router } from "expo-router";

interface Props {
  itemType: CompareItemType;
}

export function CompareBar({ itemType }: Props) {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();
  const count = useCompareStore((s) => s.getCount(itemType));
  const comparedIdsSet = useCompareStore((s) => s.compared[itemType]);
  const setCompared = useCompareStore((s) => s.setCompared);

  if (count === 0) return null;

  const handleCompareNow = () => {
    const tab = itemType === "Institution" ? "institutions" : "programs";
    router.push(`/(main)/compare?tab=${tab}` as never);
  };

  const handleClearAll = async () => {
    // Optimistically clear the local store immediately for snappy UX
    const idsToRemove = comparedIdsSet ? Array.from(comparedIdsSet) : [];
    setCompared(itemType, []);

    // Fire-and-forget server removals (toggle each — removes if present)
    // Errors are silently ignored; if they fail, initUserData will re-sync on
    // next mount, which is acceptable for a clear-all.
    for (const id of idsToRemove) {
      comparesApi.toggleCompare(id, itemType).catch(() => {
        // ignore individual failures
      });
    }
  };

  return (
    <Animated.View
      entering={SlideInDown.duration(260).springify()}
      className={`flex-row items-center bg-primary px-4 py-3 gap-3 shadow-lg ${isRtl ? "flex-row-reverse" : ""}`}
      style={{ minHeight: 56 }}
    >
      {/* Icon + count */}
      <View
        className={`flex-row items-center gap-2 flex-1 ${isRtl ? "flex-row-reverse" : ""}`}
      >
        <GitCompare size={20} color={colors.primaryForeground} />
        <Text className="text-sm font-semibold text-primary-foreground">
          {count}/5 {t("selected")}
        </Text>
      </View>

      {/* Compare CTA */}
      <Pressable
        onPress={handleCompareNow}
        className="bg-secondary rounded-xl px-4 py-2"
        accessibilityRole="button"
      >
        <Text className="text-sm font-bold text-foreground">{t("compareNow")}</Text>
      </Pressable>

      {/* Clear */}
      <Pressable onPress={handleClearAll} hitSlop={8} accessibilityRole="button">
        <X size={20} color={colors.primaryForeground} />
      </Pressable>
    </Animated.View>
  );
}
