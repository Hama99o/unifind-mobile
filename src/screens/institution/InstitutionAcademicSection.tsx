/**
 * InstitutionAcademicSection — Section 3 of InstitutionDetailScreen.
 *
 * Degree tab bar (Bachelors | Masters | PhD | Others, only non-empty).
 * Search box filtering faculties client-side.
 * Collapsible FacultyAccordion components, each lazy-loading programs.
 *
 * Sub-components:
 *   AcademicProgramCard — single program card (AcademicProgramCard.tsx)
 *   FacultyAccordion    — collapsible faculty row  (FacultyAccordion.tsx)
 *
 * RTL-safe. Gluestack only.
 */

import { useState } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { Search } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Divider } from "@/components/ui/divider";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import type { AcademicData } from "@/api/institutionDetailApi";
import { FacultyAccordion } from "@/screens/institution/FacultyAccordion";

// ─── Types ────────────────────────────────────────────────────────────────────

type DegreeTab = "Bachelors" | "Masters" | "PhD" | "Others";

interface InstitutionAcademicSectionProps {
  academicData: AcademicData;
  institutionSlug: string;
  locale: "en" | "ar";
  isLoggedIn: boolean;
}

// ─── Main section ─────────────────────────────────────────────────────────────

export function InstitutionAcademicSection({
  academicData,
  institutionSlug,
  locale,
  isLoggedIn,
}: InstitutionAcademicSectionProps) {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();

  const TABS: DegreeTab[] = ["Bachelors", "Masters", "PhD", "Others"];
  const availableTabs = TABS.filter((tab) => (academicData[tab]?.length ?? 0) > 0);

  const [activeTab, setActiveTab] = useState<DegreeTab>(availableTabs[0] ?? "Bachelors");
  const [search, setSearch] = useState("");

  const TAB_LABELS: Record<DegreeTab, string> = {
    Bachelors: t("Bachelors"),
    Masters: t("Masters"),
    PhD: t("PhD"),
    Others: t("Others"),
  };

  const searchLower = search.toLowerCase().trim();
  const faculties = academicData[activeTab] ?? [];
  const filtered = searchLower
    ? faculties.filter(
        (f) =>
          f.facultyName.toLowerCase().includes(searchLower) ||
          (f.description ?? "").toLowerCase().includes(searchLower) ||
          f.degrees.some((d) =>
            (d.title ?? "").toLowerCase().includes(searchLower)
          )
      )
    : faculties;

  if (availableTabs.length === 0) return null;

  return (
    <View className="px-4 gap-4">
      <Heading size="md" className={`text-foreground mb-1 ${isRtl ? "text-right" : ""}`}>
        {t("academic_prog_degrees")}
      </Heading>
      <Divider className="mb-3" />

      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className={`flex-row gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
          {availableTabs.map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full border ${
                activeTab === tab
                  ? "bg-primary border-primary"
                  : "bg-card border-border"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  activeTab === tab ? "text-primary-foreground" : "text-foreground"
                }`}
              >
                {TAB_LABELS[tab]}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Search box */}
      <Input variant="filled" className="flex-1 h-10">
        <InputSlot>
          <Search size={16} color={colors.mutedForeground} />
        </InputSlot>
        <InputField
          value={search}
          onChangeText={setSearch}
          placeholder={t("searchPlaceholder")}
        />
      </Input>

      {/* Faculty accordions — keyed by tab+name so they remount on tab change */}
      <View>
        {filtered.length === 0 ? (
          <Text className="text-sm text-muted-foreground text-center py-4">
            {t("common.empty")}
          </Text>
        ) : (
          filtered.map((faculty, i) => (
            <FacultyAccordion
              key={`${activeTab}-${faculty.facultyName}-${i}`}
              faculty={faculty}
              activeTab={activeTab}
              institutionSlug={institutionSlug}
              locale={locale}
              isLoggedIn={isLoggedIn}
              isFirst={i === 0}
            />
          ))
        )}
      </View>
    </View>
  );
}
