/**
 * RankingCard — mobile equivalent of UFCard5.
 *
 * Trophy icon on a bg-primary circle (colors.primaryForeground for the icon),
 * category title, position number, optional external URL.
 * Reused by Institution detail (ranking[]).
 *
 * RTL-safe.
 */

import { Pressable, View, Linking } from "react-native";
import { Trophy, ExternalLink } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { useColors } from "@/hooks/useColors";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";

export interface RankingCardProps {
  /** Category/organization name */
  title: string;
  /** Ranking position (e.g. 5) */
  position: number | string;
  url?: string;
}

export function RankingCard({ title, position, url }: RankingCardProps) {
  const colors = useColors();
  const { isRtl } = useCustomTranslation();

  const handlePress = () => {
    if (!url) return;
    const href = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(href).catch(() => {});
  };

  const Content = (
    <View
      className={`flex-row items-start gap-3 bg-card p-4 rounded-xl shadow-sm border border-border ${
        isRtl ? "flex-row-reverse" : ""
      }`}
    >
      {/* Trophy on primary circle — S6 token discipline */}
      <View
        className="w-10 h-10 rounded-full bg-primary items-center justify-center shrink-0"
      >
        <Trophy size={18} color={colors.primaryForeground} />
      </View>

      <View className="flex-1">
        <View className={`flex-row items-center gap-1 ${isRtl ? "flex-row-reverse" : ""}`}>
          <Text
            className={`text-sm font-bold text-foreground flex-1 ${isRtl ? "text-right" : ""}`}
            numberOfLines={2}
          >
            {title}
          </Text>
          {url ? <ExternalLink size={12} color={colors.accent} /> : null}
        </View>
        <Heading size="md" className={`text-foreground ${isRtl ? "text-right" : ""}`}>
          #{position}
        </Heading>
      </View>
    </View>
  );

  if (url) {
    return (
      <Pressable onPress={handlePress} accessibilityRole="link">
        {Content}
      </Pressable>
    );
  }

  return Content;
}
