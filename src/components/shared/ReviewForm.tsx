/**
 * ReviewForm — auth-gated review submission form.
 *
 * Cascading dropdowns: Campus → Faculty → Program (delegated to ReviewCascadeSelects)
 * Year pickers: Start Year + End Year (end ≥ start)
 * Ratings: General (required ≥1), Education Quality, Campus Facilities, Student Life
 * Experience textarea (optional)
 *
 * Auth-gated: not logged in → login prompt card.
 * On success: reset + toast + callback.
 *
 * Comment encoded exactly:
 *   "Campus Attended: {campusId}\nFaculty: {facultyId}\n
 *    Study Period: {start}-{end}\nExperience: {text}"
 *
 * Sub-components:
 *   ReviewRatingBlock — labeled rating row (ReviewRatingBlock.tsx)
 *   ReviewCascadeSelects — cascade dropdowns (ReviewCascadeSelects.tsx)
 */

import { useState, useEffect } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { ReviewRatingBlock } from "@/components/shared/ReviewRatingBlock";
import { ReviewCascadeSelects } from "@/components/shared/ReviewCascadeSelects";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useSignInSheet } from "@/auth/useSignInSheet";
import { showToast } from "@/stores/toastStore";
import { reviewsApi, CreateReviewDto } from "@/api/reviewsApi";
import { institutionDetailApi, CampusOption, FacultyOption, ProgramReviewOption } from "@/api/institutionDetailApi";

// ─── Year range helper ────────────────────────────────────────────────────────

function getYearOptions(start: number, end: number): Array<{ label: string; value: string }> {
  const years: Array<{ label: string; value: string }> = [];
  for (let y = end; y >= start; y--) {
    years.push({ label: String(y), value: String(y) });
  }
  return years;
}

const CURRENT_YEAR = new Date().getFullYear();

// ─── Props ────────────────────────────────────────────────────────────────────

interface ReviewFormProps {
  institutionSlug: string;
  institutionDocumentId: string;
  locale: "en" | "ar";
  isLoggedIn: boolean;
  onReviewSubmitted?: () => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ReviewForm({
  institutionSlug,
  institutionDocumentId,
  locale,
  isLoggedIn,
  onReviewSubmitted,
}: ReviewFormProps) {
  const { t, isRtl } = useCustomTranslation();
  const { open: openSignIn } = useSignInSheet();

  // Cascade options
  const [campuses, setCampuses] = useState<CampusOption[]>([]);
  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [programs, setPrograms] = useState<ProgramReviewOption[]>([]);
  const [loadingFaculties, setLoadingFaculties] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  // Cascade values
  const [selectedCampus, setSelectedCampus] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [experience, setExperience] = useState("");

  // Ratings
  const [generalRating, setGeneralRating] = useState(0);
  const [educationQuality, setEducationQuality] = useState(0);
  const [campusFacilities, setCampusFacilities] = useState(0);
  const [studentLife, setStudentLife] = useState(0);

  const [ratingError, setRatingError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    institutionDetailApi.getCampusesForInstitution(institutionSlug, locale).then(setCampuses);
  }, [institutionSlug, locale, isLoggedIn]);

  useEffect(() => {
    setFaculties([]);
    setSelectedFaculty("");
    setPrograms([]);
    setSelectedProgram("");
    if (!selectedCampus) return;
    const campusId = Number(selectedCampus);
    if (!isNaN(campusId) && campusId > 0) {
      setLoadingFaculties(true);
      institutionDetailApi
        .getAcademicUnitsForCampus(campusId, locale)
        .then(setFaculties)
        .finally(() => setLoadingFaculties(false));
    }
  }, [selectedCampus, locale]);

  useEffect(() => {
    setPrograms([]);
    setSelectedProgram("");
    if (!selectedFaculty) return;
    const facultyId = Number(selectedFaculty);
    if (!isNaN(facultyId) && facultyId > 0) {
      setLoadingPrograms(true);
      institutionDetailApi
        .getProgramsForReviewDropdown(facultyId, locale)
        .then(setPrograms)
        .finally(() => setLoadingPrograms(false));
    }
  }, [selectedFaculty, locale]);

  const resetForm = () => {
    setSelectedCampus(""); setSelectedFaculty(""); setSelectedProgram("");
    setStartYear(""); setEndYear(""); setExperience("");
    setGeneralRating(0); setEducationQuality(0); setCampusFacilities(0); setStudentLife(0);
    setRatingError(false); setSubmitted(false);
  };

  const handleRatingChange = (setter: (v: number) => void) => (v: number) => {
    setter(v); setRatingError(false);
  };

  const handleStartYearChange = (val: string) => {
    setStartYear(val);
    if (endYear && parseInt(val) > parseInt(endYear)) setEndYear("");
  };

  const handleSubmit = async () => {
    if (!isLoggedIn) { openSignIn(); return; }
    if (generalRating < 1 || educationQuality < 1 || campusFacilities < 1 || studentLife < 1) {
      setRatingError(true); return;
    }
    setSubmitted(true);
    if (!selectedCampus || !selectedFaculty || !selectedProgram || !startYear || !endYear) return;

    const comment = `Campus Attended: ${selectedCampus}\nFaculty: ${selectedFaculty}\nStudy Period: ${startYear}-${endYear}\nExperience: ${experience}`;
    const dto: CreateReviewDto = {
      targetID: selectedProgram, targetType: "Program", generalRating,
      parentID: institutionDocumentId,
      ratings: { educationQuality, campusFacilities, studentLife },
      comment,
    };

    setSubmitting(true);
    try {
      const res = await reviewsApi.createReview(dto);
      const msg = res.message ?? "";
      if (msg.toLowerCase().includes("success") || msg.toLowerCase().includes("created")) {
        showToast(t("success")); resetForm(); onReviewSubmitted?.();
      } else {
        showToast(msg || t("error"));
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || t("error");
      showToast(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <View className="bg-card rounded-2xl shadow-sm border border-border p-6 items-center gap-4">
        <Heading size="md" className={`text-foreground ${isRtl ? "text-right" : ""}`}>
          {t("leave_review")}
        </Heading>
        <Text className={`text-sm text-muted-foreground leading-relaxed ${isRtl ? "text-right" : ""}`}>
          {t("login_to_review")}
        </Text>
        <Button label={t("sign_in_to_review")} action="primary" variant="solid" onPress={openSignIn} className="w-full" />
      </View>
    );
  }

  const startYearOpts = getYearOptions(1950, CURRENT_YEAR);
  const endYearOpts = startYear ? getYearOptions(parseInt(startYear), CURRENT_YEAR + 1) : [];
  const campusOpts = campuses.map((c) => ({ label: c.name, value: String(c.id) }));
  const facultyOpts = faculties.map((f) => ({ label: f.name, value: String(f.id) }));
  const programOpts = programs.map((p) => ({ label: p.label, value: p.documentId }));

  return (
    <View className="bg-card rounded-2xl shadow-sm border border-border p-4 gap-5">
      <Heading size="md" className={`text-foreground ${isRtl ? "text-right" : ""}`}>
        {t("leave_review")}
      </Heading>

      <ReviewRatingBlock
        label={t("general_rating")}
        value={generalRating}
        onChange={handleRatingChange(setGeneralRating)}
        isInvalid={ratingError && generalRating < 1}
        errorMessage={t("ratingRequired")}
      />

      <ReviewCascadeSelects
        campusOpts={campusOpts}
        facultyOpts={facultyOpts}
        programOpts={programOpts}
        startYearOpts={startYearOpts}
        endYearOpts={endYearOpts}
        selectedCampus={selectedCampus}
        selectedFaculty={selectedFaculty}
        selectedProgram={selectedProgram}
        startYear={startYear}
        endYear={endYear}
        loadingFaculties={loadingFaculties}
        loadingPrograms={loadingPrograms}
        submitted={submitted}
        onCampusChange={setSelectedCampus}
        onFacultyChange={setSelectedFaculty}
        onProgramChange={setSelectedProgram}
        onStartYearChange={handleStartYearChange}
        onEndYearChange={setEndYear}
      />

      <View className="gap-4">
        <ReviewRatingBlock
          label={t("education_quality")}
          value={educationQuality}
          onChange={handleRatingChange(setEducationQuality)}
          isInvalid={ratingError && educationQuality < 1}
          errorMessage={t("ratingRequired")}
        />
        <ReviewRatingBlock
          label={t("campus_facilities")}
          value={campusFacilities}
          onChange={handleRatingChange(setCampusFacilities)}
          isInvalid={ratingError && campusFacilities < 1}
          errorMessage={t("ratingRequired")}
        />
        <ReviewRatingBlock
          label={t("student_life")}
          value={studentLife}
          onChange={handleRatingChange(setStudentLife)}
          isInvalid={ratingError && studentLife < 1}
          errorMessage={t("ratingRequired")}
        />
      </View>

      <View className="gap-1">
        <Text className="text-sm font-medium text-foreground">{t("share_experience")}</Text>
        <Textarea>
          <TextareaInput
            value={experience}
            onChangeText={setExperience}
            placeholder={t("share_experience")}
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Textarea>
      </View>

      <Button
        label={t("submit_review")}
        action="primary"
        variant="solid"
        onPress={handleSubmit}
        disabled={submitting}
        className="w-full"
      />
    </View>
  );
}
