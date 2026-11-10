/**
 * DateField — NATIVE (iOS/Android) implementation.
 *
 * Shows a Pressable button displaying the formatted date. On press:
 *   - iOS:     opens DateTimePicker in "spinner" mode inline.
 *   - Android: opens the system date picker dialog (display="default").
 *
 * Does NOT import this file on web. Metro's platform resolution ensures
 * date-field.native.tsx is only bundled for native targets.
 */

import { useState } from "react";
import { Platform } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { HStack, VStack } from "@/components/ui/box";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useLocalization } from "@/hooks/useLocalization";

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
  const { t, isRtl } = useCustomTranslation();
  const { formatDate } = useLocalization();
  const [show, setShow] = useState(false);

  const onPickerChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShow(false);
    if (selected) onChange(selected);
  };

  const displayStr = value
    ? formatDate(value, { year: "numeric", month: "short", day: "numeric" })
    : "";

  return (
    <VStack className="gap-1">
      {label ? (
        <HStack
          className="gap-1"
          style={{ flexDirection: isRtl ? "row-reverse" : "row" }}
          testID="date-field-label"
        >
          <Text className="text-sm font-semibold text-foreground">{label}</Text>
          {required && (
            <Text className="text-sm text-destructive">*</Text>
          )}
        </HStack>
      ) : null}

      <Button
        label={displayStr || placeholder || t("profileSelectDate")}
        variant="outline"
        action="primary"
        onPress={() => !disabled && setShow(true)}
        disabled={disabled}
        className={disabled ? "opacity-40" : ""}
      />

      {show && (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={onPickerChange}
        />
      )}
    </VStack>
  );
}
