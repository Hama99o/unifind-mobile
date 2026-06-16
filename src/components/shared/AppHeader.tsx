import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Heading } from "@/components/ui/heading";
import { useColors } from "@/hooks/useColors";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";

/** Standard screen header. `showBack` adds an RTL-aware back button. */
export function AppHeader({ title, showBack }: { title: string; showBack?: boolean }) {
  const router = useRouter();
  const colors = useColors();
  const { isRtl } = useCustomTranslation();
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  return (
    <View className="flex-row items-center gap-2 px-4 py-3 border-b border-border bg-background">
      {showBack && (
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
          <BackIcon size={26} color={colors.foreground} />
        </Pressable>
      )}
      <Heading size="lg" numberOfLines={1} className="flex-1">
        {title}
      </Heading>
    </View>
  );
}
