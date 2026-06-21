/**
 * ListSearchBar — search input + filter button + sort button row.
 * Split from UniversalList.tsx to keep that file under the 300-line cap.
 *
 * Design matches web mobile top bar:
 *   • Full-width search input (flex-1, shadow-md) — 50px height
 *   • Filter button: white bg, prussian border, shadow, 50×50, rounded-md
 *   • Sort button:   white bg, prussian border, shadow, 50×50, rounded-md
 *   • Active filter badge: prussian bg on top-right of filter button
 */

import { View, Pressable, StyleSheet } from "react-native";
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

const BUTTON_SIZE = 50;

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
      style={[
        styles.row,
        { flexDirection: isRtl ? "row-reverse" : "row" },
      ]}
    >
      {searchable !== false && (
        <Input
          variant="outline"
          style={[styles.input, { shadowColor: "#000" }]}
        >
          <InputSlot style={isRtl ? styles.iconSlotRtl : styles.iconSlotLtr}>
            <Search size={16} color={colors.mutedForeground} />
          </InputSlot>
          <InputField
            value={search}
            onChangeText={onSearchChange}
            placeholder={searchPlaceholder ?? t("searchPlaceholder")}
            returnKeyType="search"
            testID="list-search-input"
            style={styles.inputField}
          />
        </Input>
      )}

      {/* Filter button — matches web: white bg, prussian border, shadow */}
      {hasFilters && (
        <View style={styles.buttonWrap}>
          <Pressable
            onPress={onOpenFilter}
            style={[
              styles.iconButton,
              {
                backgroundColor: colors.background,
                borderColor: colors.primary,
              },
            ]}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={t("btnFilterAndSort")}
            testID="filter-drawer-trigger"
          >
            <SlidersHorizontal
              size={20}
              color={activeFilterCount > 0 ? colors.secondary : colors.primary}
            />
            {activeFilterCount > 0 && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[styles.badgeText, { color: colors.primaryForeground }]}
                >
                  {activeFilterCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      )}

      {/* Sort button */}
      {hasSortOptions && (
        <Pressable
          onPress={onOpenSort}
          style={[
            styles.iconButton,
            {
              backgroundColor: colors.background,
              borderColor: colors.primary,
            },
          ]}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={t("titleSortBy")}
        >
          <ArrowUpDown size={20} color={colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  input: {
    flex: 1,
    height: BUTTON_SIZE,
    // Shadow to match web shadow-md
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  iconSlotLtr: { paddingLeft: 12 },
  iconSlotRtl: { paddingRight: 12 },
  inputField: { fontSize: 14 },
  buttonWrap: { position: "relative" },
  iconButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    // Shadow to match web shadow-sm
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
});
