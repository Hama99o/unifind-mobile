/**
 * FilterDrawerSections — AccordionSection + CheckboxRow (split for line limit).
 * Internal use only; imported by FilterDrawerBody.tsx.
 *
 * Design matches web UFFilterAccordion:
 *   AccordionSection: white/card bg when closed → primary (prussian) bg when open;
 *                     text and chevron invert accordingly.
 *   CheckboxRow:      primary-filled checkbox + label (flex-1) + prussian count badge.
 *
 * LocationGroup, RangePicker, RangeSliderFilter → FilterDrawerInputs.tsx
 */

import React from "react";
import { View, Pressable } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { CheckboxIcon } from "@/components/ui/checkbox";
import { useColors } from "@/hooks/useColors";

// ─── AccordionSection ─────────────────────────────────────────────────────────
//
// Mirrors web UFFilterAccordion trigger:
//   Closed: bg-card, text-foreground, primary chevron-down
//   Open:   bg-primary, text-primary-foreground, primary-foreground chevron-up
//
// A 2px white/background separator runs between sections.

interface AccordionSectionProps {
  label: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isRtl: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  /** Number of active selections in this section — shows a badge when > 0 so
   *  the user can see which collapsed groups are filtered. */
  activeCount?: number;
}

export function AccordionSection({
  label,
  expanded,
  onToggle,
  children,
  isRtl,
  isFirst,
  isLast,
  activeCount = 0,
}: AccordionSectionProps) {
  const colors = useColors();

  const triggerRadius = [
    isFirst ? "rounded-t-xl" : "",
    isLast && !expanded ? "rounded-b-xl" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const bodyRadius = isLast ? "rounded-b-xl" : "";

  return (
    // 2px background-coloured gap between card sections
    <View className="border-b-2 border-background">
      <Pressable
        onPress={onToggle}
        className={`flex-row items-center justify-between px-3 py-3 ${
          expanded ? "bg-primary" : "bg-card"
        } ${triggerRadius} ${isRtl ? "flex-row-reverse" : ""}`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <Text
          className={`font-semibold text-base flex-1 ${
            expanded ? "text-primary-foreground" : "text-foreground"
          } ${isRtl ? "text-right" : "text-left"}`}
        >
          {label}
        </Text>
        {/* Active-selection badge: turquoise stands out on both the white
            (collapsed) and prussian (expanded) header backgrounds. */}
        {activeCount > 0 && (
          <View
            className={`bg-turquoise rounded-full min-w-[22px] h-[22px] items-center justify-center px-1.5 ${isRtl ? "ml-2" : "mr-2"}`}
          >
            <Text className="text-prussian text-xs font-bold">{activeCount}</Text>
          </View>
        )}
        {expanded ? (
          <ChevronUp size={22} color={colors.primaryForeground} />
        ) : (
          <ChevronDown size={22} color={colors.primary} />
        )}
      </Pressable>

      {expanded && (
        <View
          className={`bg-card px-4 py-3 border-t border-border ${bodyRadius}`}
        >
          {children}
        </View>
      )}
    </View>
  );
}

// ─── CheckboxRow ──────────────────────────────────────────────────────────────
//
// Single filter option row. Matches web checkbox list item:
//   - Primary-filled checkbox (w-4 h-4)
//   - Label text (flex-1, text-foreground)
//   - Optional count badge (prussian bg, white text)
//   - 1px border divider between rows (not after the last)

interface CheckboxRowProps {
  label: string;
  isChecked: boolean;
  onToggle: () => void;
  count?: number;
  isRtl: boolean;
  isLast?: boolean;
  /** Indeterminate = some-but-not-all children checked (gov parent checkbox) */
  isIndeterminate?: boolean;
}

export function CheckboxRow({
  label,
  isChecked,
  onToggle,
  count,
  isRtl,
  isLast,
  isIndeterminate,
}: CheckboxRowProps) {
  return (
    <View>
      <Pressable
        onPress={onToggle}
        className={`flex-row items-center justify-between py-2.5 ${
          isRtl ? "flex-row-reverse" : ""
        }`}
        hitSlop={4}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isIndeterminate ? "mixed" : isChecked }}
      >
        <View
          className={`flex-row items-center gap-2 flex-1 ${
            isRtl ? "flex-row-reverse" : ""
          }`}
        >
          <View
            className={`w-4 h-4 rounded border-2 items-center justify-center ${
              isChecked || isIndeterminate
                ? "bg-primary border-primary"
                : "border-border bg-transparent"
            }`}
          >
            {isIndeterminate && !isChecked ? (
              <View className="w-2 h-0.5 bg-primary-foreground rounded-full" />
            ) : isChecked ? (
              <CheckboxIcon />
            ) : null}
          </View>
          <Text className="text-sm text-foreground flex-1">{label}</Text>
        </View>

        {count !== undefined && (
          <View className="bg-primary rounded-full px-2 py-0.5 ml-2">
            <Text className="text-primary-foreground text-xs">{count}+</Text>
          </View>
        )}
      </Pressable>

      {!isLast && <View className="h-px bg-border" />}
    </View>
  );
}
