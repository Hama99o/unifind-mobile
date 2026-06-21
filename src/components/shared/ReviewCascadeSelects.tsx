/**
 * ReviewCascadeSelects — Campus → Faculty → Program cascade dropdowns
 * plus Start Year / End Year pickers used inside ReviewForm.
 *
 * Extracted to keep ReviewForm under ~300 lines.
 */

import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { SelectField } from "@/components/ui/select-field";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";

interface Option {
  label: string;
  value: string;
}

export interface ReviewCascadeSelectsProps {
  campusOpts: Option[];
  facultyOpts: Option[];
  programOpts: Option[];
  startYearOpts: Option[];
  endYearOpts: Option[];
  selectedCampus: string;
  selectedFaculty: string;
  selectedProgram: string;
  startYear: string;
  endYear: string;
  loadingFaculties: boolean;
  loadingPrograms: boolean;
  submitted: boolean;
  onCampusChange: (v: string) => void;
  onFacultyChange: (v: string) => void;
  onProgramChange: (v: string) => void;
  onStartYearChange: (v: string) => void;
  onEndYearChange: (v: string) => void;
}

export function ReviewCascadeSelects({
  campusOpts,
  facultyOpts,
  programOpts,
  startYearOpts,
  endYearOpts,
  selectedCampus,
  selectedFaculty,
  selectedProgram,
  startYear,
  endYear,
  loadingFaculties,
  loadingPrograms,
  submitted,
  onCampusChange,
  onFacultyChange,
  onProgramChange,
  onStartYearChange,
  onEndYearChange,
}: ReviewCascadeSelectsProps) {
  const { t, isRtl } = useCustomTranslation();

  return (
    <>
      {/* Campus */}
      <View className="gap-1">
        <Text className="text-sm font-medium text-foreground">{t("campus_attend")} *</Text>
        <SelectField
          placeholder={t("campus_attend")}
          options={campusOpts}
          value={selectedCampus}
          onChange={onCampusChange}
        />
        {submitted && !selectedCampus && (
          <Text className="text-xs text-destructive">{t("fieldRequired")}</Text>
        )}
      </View>

      {/* Faculty */}
      <View className="gap-1">
        <Text className="text-sm font-medium text-foreground">{t("faculty")} *</Text>
        <SelectField
          placeholder={selectedCampus ? t("faculty") : t("selectCampusFirst")}
          options={facultyOpts}
          value={selectedFaculty}
          onChange={onFacultyChange}
          isLoading={loadingFaculties}
        />
        {submitted && !selectedFaculty && (
          <Text className="text-xs text-destructive">{t("fieldRequired")}</Text>
        )}
      </View>

      {/* Program */}
      <View className="gap-1">
        <Text className="text-sm font-medium text-foreground">{t("program_studied")} *</Text>
        <SelectField
          placeholder={selectedFaculty ? t("program_studied") : t("selectFacultyFirst")}
          options={programOpts}
          value={selectedProgram}
          onChange={onProgramChange}
          isLoading={loadingPrograms}
        />
        {submitted && !selectedProgram && (
          <Text className="text-xs text-destructive">{t("fieldRequired")}</Text>
        )}
      </View>

      {/* Start / End year */}
      <View className={`flex-row gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
        <View className="flex-1 gap-1">
          <Text className="text-sm font-medium text-foreground">{t("start_date")} *</Text>
          <SelectField
            placeholder={t("year")}
            options={startYearOpts}
            value={startYear}
            onChange={onStartYearChange}
          />
          {submitted && !startYear && (
            <Text className="text-xs text-destructive">{t("fieldRequired")}</Text>
          )}
        </View>
        <View className="flex-1 gap-1">
          <Text className="text-sm font-medium text-foreground">{t("end_date")} *</Text>
          <SelectField
            placeholder={startYear ? t("year") : t("start_date")}
            options={endYearOpts}
            value={endYear}
            onChange={onEndYearChange}
          />
          {submitted && !endYear && (
            <Text className="text-xs text-destructive">{t("fieldRequired")}</Text>
          )}
        </View>
      </View>
    </>
  );
}
