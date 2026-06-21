/**
 * ListSortSheet — Actionsheet sort picker for UniversalList.
 * Split from UniversalList.tsx to keep that file under the 300-line cap.
 */

import { View } from "react-native";
import { Check } from "lucide-react-native";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetItem,
  ActionsheetItemText,
} from "@/components/ui/actionsheet";
import { Heading } from "@/components/ui/heading";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import type { SortOption } from "@/components/common/UniversalListTypes";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sortOptions: SortOption[];
  currentSort: string;
  onSelect: (key: string) => void;
}

export function ListSortSheet({
  isOpen,
  onClose,
  sortOptions,
  currentSort,
  onSelect,
}: Props) {
  const { t } = useCustomTranslation();
  const colors = useColors();

  return (
    <Actionsheet isOpen={isOpen} onClose={onClose}>
      <ActionsheetBackdrop onPress={onClose} />
      <ActionsheetContent>
        <ActionsheetDragIndicator />
        <Heading size="sm" className="px-4 py-3 text-foreground">
          {t("titleSortBy")}
        </Heading>
        {sortOptions.map((opt) => {
          const isSelected = opt.key === currentSort;
          return (
            <ActionsheetItem
              key={opt.key}
              isSelected={isSelected}
              onPress={() => onSelect(opt.key)}
            >
              <View className="flex-row items-center justify-between flex-1">
                <ActionsheetItemText
                  className={isSelected ? "font-semibold text-primary" : ""}
                >
                  {opt.label}
                </ActionsheetItemText>
                {isSelected && (
                  <Check size={16} color={colors.primary} />
                )}
              </View>
            </ActionsheetItem>
          );
        })}
      </ActionsheetContent>
    </Actionsheet>
  );
}
