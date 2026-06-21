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
  const COL_W = 160;
  const LABEL_W = 120;

  return (
    <View className="bg-card rounded-2xl overflow-hidden border border-border">
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          {/* Header row */}
          <View className="flex-row border-b border-border pb-2 mb-1 pt-3 px-2">
            <View style={{ width: LABEL_W }} />
            {items.map((item, ci) => (
              <View key={ci} style={{ width: COL_W }} className="items-center gap-1 px-2">
                <Text className="text-xs font-bold text-foreground text-center" numberOfLines={2}>
                  {item.__name ?? "-"}
                </Text>
                <View className="flex-row gap-1">
                  {/* §S2: hitSlop 16 */}
                  <Pressable onPress={() => onRemove(item)} hitSlop={16} className="p-1">
                    <Trash2 size={14} color={colors.destructive} />
                  </Pressable>
                  <Pressable onPress={() => onViewMore(item)} hitSlop={16} className="p-1">
                    <ExternalLink size={14} color={colors.primary} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          {/* Attribute rows — alternating bg-muted (no opacity fraction) */}
          {attributes.map((attr, ri) => (
            <View
              key={attr.key}
              className="flex-row py-2"
              style={{ backgroundColor: ri % 2 === 0 ? colors.muted : "transparent" }}
            >
              <View style={{ width: LABEL_W }} className="justify-center px-2">
                <Text className="text-xs font-semibold text-muted-foreground">{attr.label}</Text>
              </View>
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
