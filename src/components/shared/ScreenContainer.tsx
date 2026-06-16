import { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cn } from "@/lib/utils";

/** Outermost wrapper for every screen. */
export function ScreenContainer({
  children,
  padded,
  scroll,
  className,
}: {
  children: ReactNode;
  padded?: boolean;
  scroll?: boolean;
  className?: string;
}) {
  const inner = (
    <View className={cn("flex-1", padded && "px-4 py-3", className)}>{children}</View>
  );
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {scroll ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}
