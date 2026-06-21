/**
 * DateField — WEB implementation.
 *
 * Renders an HTML <input type="date"> via React Native Web's DOM passthrough.
 * React Native Web allows rendering real DOM elements using React.createElement.
 *
 * Value: YYYY-MM-DD local serialization (no UTC shift).
 * onChange: parses the YYYY-MM-DD string into a local Date.
 * Display: styled to match the Gluestack Input (h-12, rounded-xl, border-border).
 *
 * @react-native-community/datetimepicker is NEVER imported here.
 */

import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { HStack, VStack } from "@/components/ui/box";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";

export interface DateFieldProps {
  value: Date | null;
  onChange: (d: Date) => void;
  label?: string;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  required?: boolean;
  disabled?: boolean;
  mode?: "date";
}

/** Convert a Date to YYYY-MM-DD using LOCAL calendar components (avoids UTC shift). */
function toLocalIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse a YYYY-MM-DD string into a local Date (no UTC shift). */
function fromLocalIso(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function DateField({
  value,
  onChange,
  label,
  placeholder,
  minimumDate,
  maximumDate,
  required = false,
  disabled = false,
}: DateFieldProps) {
  const { t } = useCustomTranslation();
  const colors = useColors();

  const inputValue = value ? toLocalIso(value) : "";
  const minAttr = minimumDate ? toLocalIso(minimumDate) : undefined;
  const maxAttr = maximumDate ? toLocalIso(maximumDate) : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = fromLocalIso(e.target.value);
    if (parsed) onChange(parsed);
  };

  return (
    <VStack className="gap-1">
      {label ? (
        <HStack className="gap-1">
          <Text className="text-sm font-semibold text-foreground">{label}</Text>
          {required && (
            <Text className="text-sm text-destructive">*</Text>
          )}
        </HStack>
      ) : null}

      <View
        style={{
          height: 48,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.background,
          overflow: "hidden",
          justifyContent: "center",
          opacity: disabled ? 0.4 : 1,
        }}
      >
        {/* React Native Web passes unknown props to the underlying DOM element.
            We use React.createElement with 'input' to render a real HTML input. */}
        {React.createElement("input", {
          type: "date",
          value: inputValue,
          min: minAttr,
          max: maxAttr,
          disabled,
          placeholder: placeholder ?? t("profileSelectDate"),
          onChange: handleChange,
          style: {
            width: "100%",
            height: "100%",
            paddingLeft: 12,
            paddingRight: 12,
            border: "none",
            outline: "none",
            background: "transparent",
            color: inputValue ? colors.foreground : colors.mutedForeground,
            fontSize: 14,
            fontFamily: "inherit",
            cursor: disabled ? "not-allowed" : "pointer",
            boxSizing: "border-box",
          },
        })}
      </View>
    </VStack>
  );
}
