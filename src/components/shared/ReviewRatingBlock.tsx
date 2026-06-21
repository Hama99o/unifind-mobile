/**
 * ReviewRatingBlock — reusable labeled rating row used inside ReviewForm.
 *
 * Renders a label, InteractiveRatingStars, and optional error message.
 * Extracted from ReviewForm to keep that file under ~300 lines.
 */

import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { InteractiveRatingStars } from "@/components/shared/InteractiveRatingStars";

interface ReviewRatingBlockProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  isInvalid: boolean;
  errorMessage: string;
  required?: boolean;
}

export function ReviewRatingBlock({
  label,
  value,
  onChange,
  isInvalid,
  errorMessage,
  required = true,
}: ReviewRatingBlockProps) {
  return (
    <View className="gap-1">
      <Text className="text-sm font-medium text-foreground">
        {label}{required ? " *" : ""}
      </Text>
      <InteractiveRatingStars
        value={value}
        onChange={onChange}
        isInvalid={isInvalid}
      />
      {isInvalid && (
        <Text className="text-xs text-destructive">{errorMessage}</Text>
      )}
    </View>
  );
}
