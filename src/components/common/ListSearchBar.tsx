/**
 * ListSearchBar — search input + filter button + sort button row.
 * Split from UniversalList.tsx to keep that file under the 300-line cap.
 */

import { View, Pressable } from "react-native";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react-native";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useColors } from "@/hooks/useColors";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";

interface Props {
  search: string;
  onSearchChange: (text: string) => void;
  searchPlaceholder?: string;
  searchable?: boolean;
  hasFilters: boolean;
  activeFilterCount: number;
  hasSortOptions: boolean;
  onOpenFilter: () => void;
  onOpenSort: () => void;
}

export function ListSearchBar({
  search,
  onSearchChange,
  searchPlaceholder,
  searchable,
  hasFilters,
  activeFilterCount,
  hasSortOptions,
  onOpenFilter,
  onOpenSort,
}: Props) {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();

  return (
    <View
      className={`flex-row items-center gap-2 px-4 pt-2 ${isRtl ? "flex-row-reverse" : ""}`}
    >
      {searchable !== false && (
        <Input variant="filled" className="flex-1 h-10">
          <InputSlot>
            <Search size={16} color={colors.mutedForeground} />
          </InputSlot>
          <InputField
            value={search}
            onChangeText={onSearchChange}
            placeholder={searchPlaceholder ?? t("searchPlaceholder")}
            returnKeyType="search"
          />
        </Input>
      )}

      {/* Filter button */}
      {hasFilters && (
        <Pressable
          onPress={onOpenFilter}
          className="relative h-10 w-10 rounded-xl bg-muted items-center justify-center"
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={t("btnFilterAndSort")}
        >
          <SlidersHorizontal size={18} color={colors.foreground} />
          {activeFilterCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-secondary rounded-full min-w-[16px] h-4 items-center justify-center px-1">
              <Text className="text-xs font-bold text-foreground">
                {activeFilterCount}
              </Text>
            </View>
          )}
        </Pressable>
      )}

      {/* Sort button */}
      {hasSortOptions && (
        <Pressable
          onPress={onOpenSort}
          className="h-10 w-10 rounded-xl bg-muted items-center justify-center"
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={t("titleSortBy")}
        >
          <ArrowUpDown size={18} color={colors.foreground} />
        </Pressable>
      )}
    </View>
  );
}
