/**
 * FindBarFilters — filter panels + data fetching for FindBarSection.
 *
 * Manages all catalog queries (degrees, fields, locations, categories)
 * and renders the correct filter fields for the active tab.
 * Separated from FindBarSection to keep both files under 300 lines.
 *
 * Design contract:
 *  - NEVER block the whole card on loading. Fields render immediately.
 *  - Each SelectField receives isLoading for its own query and shows an
 *    inline spinner INSIDE the trigger while that query is pending.
 *  - If a query errors or returns empty, the field stays tappable with its
 *    placeholder (no crash, no infinite spinner).
 *  - The Find button is ALWAYS enabled.
 */

import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  MapPin,
  GraduationCap,
  Layers,
  Sparkles,
} from "lucide-react-native";

import { Input, InputField, InputSlot } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import {
  fetchDegreeLevels,
  fetchProgramFields,
  fetchProgramLocations,
  fetchInstitutionLocations,
  fetchOfferingFields,
  fetchOfferingCategories,
} from "@/api/catalog";

export type ActiveTab = "program" | "institution" | "offering";

export interface ProgramValues { level: string; field: string; location: string; }
export interface InstitutionValues { level: string; field: string; location: string; }
export interface OfferingValues { search: string; field: string; category: string; }

interface FindBarFiltersProps {
  activeTab: ActiveTab;
  programValues: ProgramValues;
  institutionValues: InstitutionValues;
  offeringValues: OfferingValues;
  onProgramChange: (v: Partial<ProgramValues>) => void;
  onInstitutionChange: (v: Partial<InstitutionValues>) => void;
  onOfferingChange: (v: Partial<OfferingValues>) => void;
}

export function FindBarFilters({
  activeTab,
  programValues,
  institutionValues,
  offeringValues,
  onProgramChange,
  onInstitutionChange,
  onOfferingChange,
}: FindBarFiltersProps) {
  const { t, lang } = useCustomTranslation();
  const colors = useColors();
  const locale = lang === "ar" ? "ar" : "en";
  const stale = 5 * 60 * 1000;

  // Each query is independent — a failed or pending query never blocks the others.
  const { data: degreeLevels = [], isLoading: l1 } = useQuery({
    queryKey: ["degreeLevels", locale],
    queryFn: () => fetchDegreeLevels(locale),
    staleTime: stale,
    retry: 1,
  });
  const { data: programFields = [], isLoading: l2 } = useQuery({
    queryKey: ["programFields", locale],
    queryFn: () => fetchProgramFields(locale),
    staleTime: stale,
    retry: 1,
  });
  const { data: programLocations = [], isLoading: l3 } = useQuery({
    queryKey: ["programLocations", locale],
    queryFn: () => fetchProgramLocations(locale),
    staleTime: stale,
    retry: 1,
  });
  const { data: institutionLocations = [], isLoading: l4 } = useQuery({
    queryKey: ["institutionLocations", locale],
    queryFn: () => fetchInstitutionLocations(locale),
    staleTime: stale,
    retry: 1,
  });
  const { data: offeringFields = [], isLoading: l5 } = useQuery({
    queryKey: ["offeringFields", locale],
    queryFn: () => fetchOfferingFields(locale),
    staleTime: stale,
    retry: 1,
  });
  const { data: offeringCategories = [], isLoading: l6 } = useQuery({
    queryKey: ["offeringCategories", locale],
    queryFn: () => fetchOfferingCategories(locale),
    staleTime: stale,
    retry: 1,
  });

  // Fields render IMMEDIATELY — isLoading is passed per-field so each field
  // shows its own inline indicator. The whole panel never blocks.
  return (
    <View style={{ gap: 10 }}>
      {activeTab === "program" && (
        <>
          <SelectField
            placeholder={t("degreeLevel")}
            options={degreeLevels}
            value={programValues.level}
            onChange={(v) => onProgramChange({ level: v })}
            leadingIcon={GraduationCap}
            isLoading={l1}
          />
          <SelectField
            placeholder={t("fieldsOfInterest")}
            options={programFields}
            value={programValues.field}
            onChange={(v) => onProgramChange({ field: v })}
            leadingIcon={Layers}
            isLoading={l2}
          />
          <SelectField
            placeholder={t("location")}
            options={programLocations}
            value={programValues.location}
            onChange={(v) => onProgramChange({ location: v })}
            leadingIcon={MapPin}
            isLoading={l3}
          />
        </>
      )}

      {activeTab === "institution" && (
        <>
          <SelectField
            placeholder={t("degreeLevel")}
            options={degreeLevels}
            value={institutionValues.level}
            onChange={(v) => onInstitutionChange({ level: v })}
            leadingIcon={GraduationCap}
            isLoading={l1}
          />
          <SelectField
            placeholder={t("fieldsOfInterest")}
            options={programFields}
            value={institutionValues.field}
            onChange={(v) => onInstitutionChange({ field: v })}
            leadingIcon={Layers}
            isLoading={l2}
          />
          <SelectField
            placeholder={t("location")}
            options={institutionLocations}
            value={institutionValues.location}
            onChange={(v) => onInstitutionChange({ location: v })}
            leadingIcon={MapPin}
            isLoading={l4}
          />
        </>
      )}

      {activeTab === "offering" && (
        <>
          <Input className="rounded-xl border-border" style={{ height: 52 }}>
            <InputSlot className="pl-3">
              <Search size={16} color={colors.foreground} />
            </InputSlot>
            <InputField
              placeholder={t("searchPlaceholder")}
              placeholderTextColor={colors.muted}
              value={offeringValues.search}
              onChangeText={(v) => onOfferingChange({ search: v })}
            />
          </Input>
          <SelectField
            placeholder={t("fieldsOfInterest")}
            options={offeringFields}
            value={offeringValues.field}
            onChange={(v) => onOfferingChange({ field: v })}
            leadingIcon={Layers}
            isLoading={l5}
          />
          <SelectField
            placeholder={t("whatAmILookingFor")}
            options={offeringCategories}
            value={offeringValues.category}
            onChange={(v) => onOfferingChange({ category: v })}
            leadingIcon={Sparkles}
            isLoading={l6}
          />
        </>
      )}
    </View>
  );
}
