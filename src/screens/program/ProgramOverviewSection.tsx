/**
 * ProgramOverviewSection — Section 3 of ProgramDetailScreen.
 *
 * Only shown when: program.about != "" AND program.languages.length > 0.
 *
 * Contents:
 *   - Section heading
 *   - Rich-text `about` via renderStrapiRichText
 *   - InfoCard grid: one per language + one per programInfo
 *   - Campus selector (tappable chips for each campus city)
 *   - MapPreview for the selected campus
 *
 * RTL-safe. Gluestack only.
 */

import { useState } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { Globe, Languages } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Divider } from "@/components/ui/divider";
import { InfoCard } from "@/components/shared/InfoCard";
import { MapPreview } from "@/screens/program/MapPreview";
import { renderStrapiRichText } from "@/utils/richText";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import type { ProgramListItem } from "@/api/programsApiTypes";

interface Props {
  program: ProgramListItem;
}

export function ProgramOverviewSection({ program }: Props) {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();

  const [selectedCampusIdx, setSelectedCampusIdx] = useState(0);

  // Guard: only show when about is non-empty and languages exist
  const hasAbout =
    Array.isArray(program.about)
      ? (program.about as unknown[]).length > 0
      : typeof program.about === "string" && program.about.trim() !== "";

  if (!hasAbout && (!program.languages || program.languages.length === 0)) {
    return null;
  }

  const campuses = program.campus ?? [];
  const selectedCampus = campuses[selectedCampusIdx];
  const selectedLat =
    selectedCampus?.location?.coordinates?.latitude ?? 0;
  const selectedLng =
    selectedCampus?.location?.coordinates?.longitude ?? 0;
  const selectedCity = selectedCampus?.location?.city?.name;

  return (
    <View className="px-4 gap-4">
      <Heading
        size="md"
        className={`text-foreground mb-1 ${isRtl ? "text-right" : ""}`}
      >
        {t("program_overview")}
      </Heading>
      <Divider className="mb-3" />

      {/* Rich text about */}
      {hasAbout ? (
        <View>{renderStrapiRichText(program.about)}</View>
      ) : null}

      {/* Language + programInfo cards — 2-col grid */}
      {((program.languages?.length ?? 0) > 0 ||
        (program.programInfo?.length ?? 0) > 0) && (
        <View className="flex-row flex-wrap gap-3">
          {program.languages?.map((lang, idx) => (
            <View key={`lang-${idx}`} className="w-[47%]">
              <InfoCard
                icon={<Globe size={16} color={colors.primary} />}
                title={t("language")}
                description={lang.language ?? "-"}
              />
            </View>
          ))}
          {program.programInfo?.map((inf, idx) => (
            <View key={`info-${idx}`} className="w-[47%]">
              <InfoCard
                icon={<Languages size={16} color={colors.primary} />}
                title={inf.type?.type ?? "-"}
                description={inf.info ?? "-"}
                url={inf.url}
              />
            </View>
          ))}
        </View>
      )}

      {/* Campus selector chips */}
      {campuses.length > 0 && (
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className={`flex-row gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
              {campuses.map((camp, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => setSelectedCampusIdx(idx)}
                  className={`px-4 py-2 rounded-full border ${
                    selectedCampusIdx === idx
                      ? "bg-primary border-primary"
                      : "bg-card border-border"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedCampusIdx === idx
                        ? "text-primary-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {camp.location?.city?.name ?? camp.name ?? "-"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Map preview for selected campus */}
          <View className="mt-3">
            <MapPreview
              lat={selectedLat}
              lng={selectedLng}
              city={selectedCity}
            />
          </View>
        </View>
      )}
    </View>
  );
}
