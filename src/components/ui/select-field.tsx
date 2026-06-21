/**
 * SelectField — reusable single-select built on Actionsheet (bottom-sheet).
 * DRY: used by FindBarSection (home FindBar) and the filter system.
 *
 * Features:
 *  - Label / placeholder
 *  - Options list with selected state indicator
 *  - Clear action (i18n key "clearSelection")
 *  - RTL-aware flex direction
 *  - Light + dark theme tokens (no hardcoded hex)
 *
 * Usage:
 *   <SelectField
 *     placeholder={t('degreeLevel')}
 *     options={degreeLevels}
 *     value={selectedValue}
 *     onChange={setSelectedValue}
 *   />
 */

import { View, FlatList, Pressable } from "react-native";
import { ChevronDown, Check, X, type LucideIcon } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Spinner } from "@/components/ui/spinner";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetItem,
  ActionsheetItemText,
} from "@/components/ui/actionsheet";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectFieldProps {
  placeholder: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  /** Optional label shown above the trigger (if provided) */
  label?: string;
  /** Optional leading icon inside the trigger */
  leadingIcon?: LucideIcon;
  className?: string;
  /**
   * When true a small spinner replaces the chevron while the options are
   * loading. The field stays tappable (opens an empty sheet) so the card
   * is never blocked.
   */
  isLoading?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

import { useState } from "react";

export function SelectField({
  placeholder,
  options,
  value,
  onChange,
  label,
  leadingIcon: LeadingIcon,
  className,
  isLoading = false,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();
  const selected = options.find((o) => o.value === value);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setOpen(false);
  };

  return (
    <>
      <View className={className}>
        {/* Optional label */}
        {label ? (
          <Text className="text-xs font-semibold text-muted-foreground mb-1">{label}</Text>
        ) : null}

        {/* Trigger — fixed 52px height, icon + text + chevron centered */}
        <Pressable
          onPress={() => setOpen(true)}
          className={`flex-row items-center justify-between border border-border rounded-xl bg-muted/30 ${isRtl ? "flex-row-reverse" : ""}`}
          style={{ height: 52, paddingHorizontal: 14 }}
          accessibilityRole="combobox"
          accessibilityLabel={placeholder}
          accessibilityState={{ expanded: open }}
        >
          <View className={`flex-row items-center gap-2 flex-1 ${isRtl ? "flex-row-reverse" : ""}`}>
            {LeadingIcon ? (
              <LeadingIcon size={16} color={colors.foreground} />
            ) : null}
            <Text
              className={`flex-1 text-sm ${selected ? "text-foreground" : "text-muted-foreground"}`}
              numberOfLines={1}
            >
              {selected ? selected.label : placeholder}
            </Text>
          </View>
          {isLoading ? (
            <Spinner size="small" />
          ) : (
            <ChevronDown size={16} color={colors.mutedForeground} />
          )}
        </Pressable>
      </View>

      {/* Actionsheet bottom-sheet */}
      <Actionsheet isOpen={open} onClose={() => setOpen(false)}>
        {/* Backdrop fills the screen behind the sheet */}
        <View className="flex-1 justify-end">
          <ActionsheetBackdrop onPress={() => setOpen(false)} />
          <ActionsheetContent>
            <ActionsheetDragIndicator />

            {/* Sheet header */}
            <View
              className={`flex-row items-center justify-between px-4 py-3 border-b border-border ${isRtl ? "flex-row-reverse" : ""}`}
            >
              <Text className="font-semibold text-foreground">{placeholder}</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={12} accessibilityRole="button">
                <X size={20} color={colors.foreground} />
              </Pressable>
            </View>

            {/* Clear option — shown when something is selected */}
            {value ? (
              <ActionsheetItem onPress={handleClear}>
                {/* primary token = turquoise in dark (legible), prussian in light */}
                <ActionsheetItemText className="text-primary font-semibold">
                  {t("clearSelection")}
                </ActionsheetItemText>
              </ActionsheetItem>
            ) : null}

            {/* Options list */}
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <ActionsheetItem
                    onPress={() => handleSelect(item.value)}
                    isSelected={isSelected}
                  >
                    <ActionsheetItemText
                      className={isSelected ? "text-primary font-semibold" : "text-foreground"}
                    >
                      {item.label}
                    </ActionsheetItemText>
                    {isSelected ? (
                      <Check size={16} color={colors.primary} />
                    ) : null}
                  </ActionsheetItem>
                );
              }}
            />
          </ActionsheetContent>
        </View>
      </Actionsheet>
    </>
  );
}
