/**
 * LanguageSwitch — English / العربية segmented switch (saves the choice, see
 * src/i18n/language.ts). Web has a language switch on every page header; on
 * mobile it lives on Home (app bar pill) and in Profile (PARITY-02).
 */

import { Pressable, View } from "react-native";
import { Globe } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useColors } from "@/hooks/useColors";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { setAppLanguage } from "@/i18n/language";

const OPTIONS = [
  { lng: "en", labelKey: "languageNameEn" },
  { lng: "ar", labelKey: "languageNameAr" },
] as const;

export function LanguageSwitch() {
  const { t, lang, isRtl } = useCustomTranslation();
  const colors = useColors();

  return (
    <View
      testID="language-switch"
      className={`flex-row items-center justify-between px-4 py-3 ${isRtl ? "flex-row-reverse" : ""}`}
    >
      <View className={`flex-row items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
        <Globe size={16} color={colors.primary} />
        <Text className="text-sm font-semibold text-foreground">{t("language")}</Text>
      </View>
      <View className="flex-row rounded-full border border-border bg-muted p-1" accessibilityRole="radiogroup">
        {OPTIONS.map((o) => {
          const active = lang === o.lng;
          return (
            <Pressable
              key={o.lng}
              testID={`language-${o.lng}`}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => {
                if (!active) void setAppLanguage(o.lng);
              }}
              className={`px-4 py-1.5 rounded-full ${active ? "bg-primary" : ""}`}
            >
              {/* Each language name is shown in its own script (same value in en + ar). */}
              <Text className={`text-sm font-semibold ${active ? "text-primary-foreground" : "text-foreground"}`}>
                {t(o.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
