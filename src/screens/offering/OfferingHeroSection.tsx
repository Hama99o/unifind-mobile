/**
 * OfferingHeroSection — Hero section for Offering detail.
 *
 * Cover image (30% opacity) + breadcrumb + specialist avatar stack (up to 3 + "+N")
 * + HeroDetailCard (title, rating, favorite, share, "Book a Seat" → scrolls to specialists)
 *
 * NO compare for offerings.
 * RTL-safe. No hardcoded hex. Gluestack only.
 */

import { View, Image, ScrollView } from "react-native";
import { ChevronRight, ChevronLeft, Home } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { HeroDetailCard } from "@/components/shared/HeroDetailCard";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import type { StrapiOfferingDetail } from "@/api/offeringDetailApi";
import type { NodeOfferingSpecialist } from "@/api/nodeOfferingApi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OfferingHeroSectionProps {
  offering: StrapiOfferingDetail;
  specialists: NodeOfferingSpecialist[];
  rating: number;
  nbReviews: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onBookSeatPress: () => void;
}

// ─── Specialist avatar stack (up to 3 + overflow) ─────────────────────────────

const MAX_VISIBLE = 3;

function SpecialistAvatarStack({
  specialists,
  label,
}: {
  specialists: NodeOfferingSpecialist[];
  label: string;
}) {
  const colors = useColors();
  if (specialists.length === 0) return null;
  const visible = specialists.slice(0, MAX_VISIBLE);
  const overflow = specialists.length - MAX_VISIBLE;

  return (
    <View className="mt-3">
      {/* §S8 specialist label — text-xs floor, muted */}
      <Text className="text-xs text-muted-foreground mb-1">{label}</Text>

      <View className="flex-row items-center">
        {visible.map((sp, i) => (
          <View
            // _id can be undefined on these Node specialist objects → key collisions.
            // Composite with index guarantees uniqueness.
            key={`${sp._id ?? sp.name ?? "sp"}-${i}`}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              overflow: "hidden",
              borderWidth: 2,
              borderColor: colors.background,
              marginLeft: i === 0 ? 0 : -8,
              backgroundColor: colors.muted,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {sp.avatar ? (
              <Image source={{ uri: sp.avatar }} style={{ width: 36, height: 36 }} />
            ) : (
              <Text className="text-xs text-muted-foreground font-bold">
                {sp.name?.[0]?.toUpperCase() ?? "?"}
              </Text>
            )}
          </View>
        ))}
        {overflow > 0 && (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              borderWidth: 2,
              borderColor: colors.background,
              backgroundColor: colors.muted,
              alignItems: "center",
              justifyContent: "center",
              marginLeft: -8,
            }}
          >
            <Text className="text-xs text-muted-foreground font-bold">+{overflow}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

function OfferingBreadcrumb({
  offeringTitle,
  isRtl,
}: {
  offeringTitle: string;
  isRtl: boolean;
}) {
  const colors = useColors();
  const { t } = useCustomTranslation();
  const Sep = isRtl ? ChevronLeft : ChevronRight;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 6, alignItems: "center" }}
    >
      <View className={`flex-row items-center gap-1 ${isRtl ? "flex-row-reverse" : ""}`}>
        <Home size={11} color={colors.primary} />
        <Sep size={11} color={colors.mutedForeground} />
        <Text className="text-xs text-muted-foreground">{t("growthCenter.title")}</Text>
        <Sep size={11} color={colors.mutedForeground} />
        <Text className="text-xs text-muted-foreground">{t("offering")}</Text>
        <Sep size={11} color={colors.mutedForeground} />
        <Text className="text-xs text-foreground font-semibold" numberOfLines={1} style={{ maxWidth: 160 }}>
          {offeringTitle}
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export function OfferingHeroSection({
  offering,
  specialists,
  rating,
  nbReviews,
  isFavorite,
  onToggleFavorite,
  onBookSeatPress,
}: OfferingHeroSectionProps) {
  const { t, isRtl } = useCustomTranslation();

  return (
    <View>
      {/* Cover image band with 30% opacity */}
      <View className="h-44 w-full relative overflow-hidden">
        {offering.image?.url ? (
          <Image
            source={{ uri: offering.image.url }}
            style={{ width: "100%", height: "100%", opacity: 0.3 }}
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full bg-secondary opacity-30" />
        )}
      </View>

      {/* Breadcrumb */}
      <OfferingBreadcrumb offeringTitle={offering.title ?? ""} isRtl={isRtl} />

      {/* Specialist avatar stack */}
      <View className="px-4">
        <SpecialistAvatarStack specialists={specialists} label={t("specialists")} />
      </View>

      {/* Hero card */}
      <View className="px-4 mt-1">
        <HeroDetailCard
          title={offering.title ?? "-"}
          rating={rating}
          nbReviews={nbReviews}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          shareTitle={`${offering.title ?? ""} — UniFind`}
          primaryButton={{
            label: t("bookSeat"),
            variant: "solid",
            onPress: onBookSeatPress,
          }}
        />
      </View>
    </View>
  );
}
