/**
 * ComparisonTable — horizontally scrollable attribute grid.
 * Fixed label column on the left; one column per compared item.
 *
 * §2: wrap in bg-card rounded-2xl overflow-hidden border border-border
 * §2: alternating rows bg-muted (no opacity fraction)
 * §S2: Trash2/ExternalLink hitSlop → 16
 * §S3: animate-pulse → shared Skeleton
 */

import { ScrollView, View, Pressable } from "react-native";
import { Trash2, ExternalLink } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { useColors } from "@/hooks/useColors";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";

export interface CompareAttribute {
  key: string;
  label: string;
}

interface Props {
  attributes: CompareAttribute[];
  items: Record<string, string>[];
  onRemove: (item: Record<string, string>) => void;
  onViewMore: (item: Record<string, string>) => void;
}

export function ComparisonTable({ attributes, items, onRemove, onViewMore }: Props) {
  const colors = useColors();
  const { t } = useCustomTranslation();
  const COL_W = 160;
  const LABEL_W = 120;
  // Fixed heights keep the sticky label column aligned with the scrolling values.
  const HEADER_H = 76;
  const ROW_H = 60;
  const rowBg = (ri: number) => (ri % 2 === 0 ? colors.muted : "transparent");

  return (
    <View className="bg-card rounded-2xl overflow-hidden border border-border flex-row">
      {/* DESIGN-04: label column stays put while the item columns scroll sideways
          (Mobbin ref: Brilliant https://mobbin.com/screens/9ff9cfa3-8209-4275-a972-11a892f7d0a5) */}
      <View testID="compare-label-column" style={{ width: LABEL_W }} className="border-r border-border">
        <View style={{ height: HEADER_H }} className="border-b border-border" />
        {attributes.map((attr, ri) => (
          <View key={attr.key} style={{ height: ROW_H, backgroundColor: rowBg(ri) }} className="justify-center px-2">
            <Text className="text-xs font-semibold text-muted-foreground" numberOfLines={3}>
              {attr.label}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          {/* Header row */}
          <View style={{ height: HEADER_H }} className="flex-row border-b border-border pt-3 px-1">
            {items.map((item, ci) => (
              <View key={ci} style={{ width: COL_W }} className="items-center gap-1 px-2">
                <Text className="text-xs font-bold text-foreground text-center" numberOfLines={2}>
                  {item.__name ?? "-"}
                </Text>
                <View className="flex-row gap-1">
                  {/* §S2: hitSlop 16 */}
                  <Pressable
                    onPress={() => onRemove(item)}
                    hitSlop={16}
                    className="p-1"
                    accessibilityRole="button"
                    accessibilityLabel={t("remove")}
                  >
                    <Trash2 size={14} color={colors.destructive} />
                  </Pressable>
                  <Pressable
                    onPress={() => onViewMore(item)}
                    hitSlop={16}
                    className="p-1"
                    accessibilityRole="button"
                    accessibilityLabel={t("viewMore")}
                  >
                    <ExternalLink size={14} color={colors.primary} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          {/* Attribute rows — alternating bg-muted, same heights as the label column */}
          {attributes.map((attr, ri) => (
            <View key={attr.key} className="flex-row px-1" style={{ height: ROW_H, backgroundColor: rowBg(ri) }}>
              {items.map((item, ci) => (
                <View key={ci} style={{ width: COL_W }} className="px-2 justify-center">
                  <Text className="text-xs text-foreground" numberOfLines={3}>
                    {item[attr.key] ?? "-"}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export function TableSkeleton() {
  return (
    <View className="bg-card rounded-2xl overflow-hidden border border-border p-3 gap-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-10 bg-muted rounded" />
      ))}
    </View>
  );
}
