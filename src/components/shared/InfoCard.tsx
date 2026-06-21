/**
 * InfoCard — mobile equivalent of UFCard4.
 *
 * icon (lucide) + title + description, optional URL → Linking.openURL.
 * Reused by Institution detail (institutionInfo) and Program detail (programInfo).
 *
 * RTL-safe: icon/text row mirrors.
 */

import { Pressable, View, Linking } from "react-native";
import { ExternalLink } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { useColors } from "@/hooks/useColors";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { IconCircle } from "@/components/shared/IconCircle";

export interface InfoCardProps {
  /** Icon component (e.g. from lucide-react-native) */
  icon?: React.ReactNode;
  title: string;
  description: string;
  url?: string;
  className?: string;
}

export function InfoCard({ icon, title, description, url }: InfoCardProps) {
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
      {icon && (
        <IconCircle size={40} className="shrink-0">
          {icon}
        </IconCircle>
      )}

      <View className="flex-1">
        <View className={`flex-row items-center gap-1 ${isRtl ? "flex-row-reverse" : ""}`}>
          <Heading
            size="sm"
            className={`text-foreground flex-1 ${isRtl ? "text-right" : ""}`}
            numberOfLines={2}
          >
            {title}
          </Heading>
          {url ? (
            <ExternalLink size={13} color={colors.mutedForeground} />
          ) : null}
        </View>
        <Text
          className={`text-sm text-muted-foreground mt-0.5 ${isRtl ? "text-right" : ""}`}
          numberOfLines={3}
        >
          {description}
        </Text>
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
