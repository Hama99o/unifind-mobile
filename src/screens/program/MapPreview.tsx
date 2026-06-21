/**
 * MapPreview — cross-platform map substitute.
 *
 * Does NOT use react-native-maps (needs native build, breaks Expo Go/web).
 * Instead: shows the campus city + coordinates label + a tappable
 * "View on Google Maps" button that opens Linking.openURL with a
 * Google Maps search URL.
 *
 * Works on Expo Go (iOS/Android) AND the web preview (port 3010).
 * RTL-safe. No hardcoded hex.
 */

import { View, Pressable, Linking } from "react-native";
import { MapPin, ExternalLink } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";

interface MapPreviewProps {
  lat: number;
  lng: number;
  city?: string;
  label?: string;
}

export function MapPreview({ lat, lng, city, label }: MapPreviewProps) {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();

  const hasCoords = lat !== 0 || lng !== 0;

  const handleOpenMap = () => {
    const query = hasCoords ? `${lat},${lng}` : encodeURIComponent(city ?? label ?? "");
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View
      className={`bg-lightgreen rounded-xl border border-border p-4 gap-3 ${isRtl ? "items-end" : ""}`}
    >
      {/* Location info */}
      <View className={`flex-row items-start gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
        <MapPin size={18} color={colors.primary} />
        <View className="flex-1">
          {city ? (
            <Text className={`text-sm font-semibold text-foreground ${isRtl ? "text-right" : ""}`}>
              {city}
            </Text>
          ) : null}
          {hasCoords ? (
            <Text className={`text-xs text-muted-foreground mt-0.5 ${isRtl ? "text-right" : ""}`}>
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </Text>
          ) : null}
          {label ? (
            <Text className={`text-xs text-muted-foreground mt-0.5 ${isRtl ? "text-right" : ""}`}>
              {label}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Open Maps CTA */}
      <Pressable
        onPress={handleOpenMap}
        className={`flex-row items-center gap-2 self-start bg-primary px-4 py-2 rounded-lg ${isRtl ? "flex-row-reverse self-end" : ""}`}
        accessibilityRole="link"
      >
        <ExternalLink size={14} color={colors.primaryForeground} />
        <Text className="text-sm font-semibold text-primary-foreground">
          {t("viewOnMap")}
        </Text>
      </Pressable>
    </View>
  );
}
