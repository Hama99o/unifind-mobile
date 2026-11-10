/**
 * AcademicBackgroundSection — list + add/edit/delete academic backgrounds.
 *
 * Node API: GET /academic-backgrounds/user/:userId  (GET enriched with Strapi names)
 *           POST/PUT /academic-backgrounds — body: { university_id: Number, program_id: Number,
 *                                                    isStudent, startDate, endDate?, grade?, description? }
 *           DELETE /academic-backgrounds/:id
 *
 * Cascade: Institution → Campus → Faculty(academic-unit) → Program
 * (mirrors web: APIGetCampus → APIGetAcademicUnits → APIGetProgramsRev)
 *
 * Batch F: experience cards use shared BackgroundCard (bg-card rounded-2xl, bg-lightgreen icon circle).
 * Form modals have a grab handle (w-10 h-1 rounded-full bg-border self-center mt-3 mb-1).
 *
 * Fixes:
 *  - DTO uses university_id / program_id / isStudent (not institutionId/isCurrent), numeric
 *  - GET uses /user/:userId endpoint with name enrichment from Strapi
 *  - Faculty step added between Campus and Program
 *  - Date serialization uses LOCAL components (no UTC off-by-one)
 *  - Gluestack Textarea + Checkbox (no raw TextInput / hand-rolled checkbox)
 *  - All strings through t() in both locales
 *  - formatDate from useLocalization() (no hardcoded locale)
 *  - Destructive actions via confirmAlert
 */

import { useEffect, useState } from "react";
import {
  View, ScrollView, Modal, Pressable,
} from "react-native";
import { X, GraduationCap } from "lucide-react-native";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input, InputField } from "@/components/ui/input";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { Checkbox, CheckboxIndicator, CheckboxIcon, CheckboxLabel } from "@/components/ui/checkbox";
import { SelectField, type SelectOption } from "@/components/ui/select-field";
import { DateField } from "@/components/ui/date-field";
import { VStack, HStack } from "@/components/ui/box";
import { EmptyState } from "@/components/shared/EmptyState";
import { BackgroundCard } from "@/components/shared/BackgroundCard";
import { confirmAlert } from "@/components/ui/alert-dialog";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useLocalization } from "@/hooks/useLocalization";
import { useAuthStore } from "@/stores/authStore";
import { showToast } from "@/stores/toastStore";
import { useQuery } from "@tanstack/react-query";
import { useAsyncResource } from "@/hooks/useAsyncResource";
import {
  academicApi,
  catalogApi,
  type AcademicBackground,
  type AcademicBackgroundDto,
  type StrapiOption,
} from "@/api/academicApi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toLocalIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDate(str?: string): Date {
  if (!str) return new Date();
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  institutionId: string;
  campusId: string;
  facultyId: string;
  programId: string;
  startDate: Date;
  endDate: Date;
  grade: string;
  isStudent: boolean;
  description: string;
}

const DEFAULT_FORM: FormState = {
  institutionId: "",
  campusId: "",
  facultyId: "",
  programId: "",
  startDate: new Date(),
  endDate: new Date(),
  grade: "",
  isStudent: false,
  description: "",
};

// ─── Form modal ───────────────────────────────────────────────────────────────

interface FormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (form: FormState) => Promise<void>;
  initialForm?: FormState;
  mode: "add" | "edit";
  locale: "en" | "ar";
}

function AcademicFormModal({ visible, onClose, onSave, initialForm, mode, locale }: FormModalProps) {
  const { t, isRtl } = useCustomTranslation();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm ?? DEFAULT_FORM);

  // Cascading catalog selects (React Query: cached per locale + parent id,
  // fetched only while the sheet is open and the parent is chosen).
  const instQuery = useQuery({
    queryKey: ["catalog", "institutionsForSelect", locale],
    queryFn: () => catalogApi.getInstitutions(locale),
    enabled: visible,
    staleTime: 60 * 60_000,
  });
  const instList = instQuery.data ?? [];
  const institutions: SelectOption[] = instList.map((i) => ({ label: i.name, value: String(i.id) }));
  const slugMap = new Map<string, string>();
  instList.forEach((i) => { if (i.slug) slugMap.set(String(i.id), i.slug); });
  const institutionSlug = form.institutionId ? slugMap.get(form.institutionId) : undefined;

  const campusQuery = useQuery({
    queryKey: ["catalog", "campusesBySlug", institutionSlug ?? "", locale],
    queryFn: () => catalogApi.getCampusesBySlug(institutionSlug!, locale),
    enabled: visible && !!institutionSlug,
  });
  const facultyQuery = useQuery({
    queryKey: ["catalog", "facultiesByCampus", form.campusId, locale],
    queryFn: () => catalogApi.getFaculties(Number(form.campusId), locale),
    enabled: visible && !!institutionSlug && !!form.campusId,
  });
  const programQuery = useQuery({
    queryKey: ["catalog", "programsByFaculty", form.facultyId, locale],
    queryFn: () => catalogApi.getProgramsByFaculty(Number(form.facultyId), locale),
    enabled: visible && !!form.campusId && !!form.facultyId,
  });
  const campuses: SelectOption[] = institutionSlug
    ? (campusQuery.data ?? []).map((c) => ({ label: c.name, value: String(c.id) }))
    : [];
  const faculties: SelectOption[] =
    institutionSlug && form.campusId ? (facultyQuery.data ?? []).map((f) => ({ label: f.name, value: String(f.id) })) : [];
  const programs: SelectOption[] =
    form.campusId && form.facultyId ? (programQuery.data ?? []).map((p) => ({ label: p.name, value: String(p.id) })) : [];
  const loadingInst = instQuery.isFetching;
  const loadingCampus = campusQuery.isFetching;
  const loadingFaculty = facultyQuery.isFetching;
  const loadingPrograms = programQuery.isFetching;

  useEffect(() => {
    if (!visible) return;
    setForm(initialForm ?? DEFAULT_FORM);
  }, [visible]);

  const set = (key: keyof FormState) => (val: FormState[typeof key]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    if (!form.institutionId || !form.campusId || !form.facultyId || !form.programId || !form.startDate) {
      showToast(t("profileInfoErrorRequired"));
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch {
      showToast(t("profileSaveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-background rounded-t-3xl" style={{ maxHeight: "92%" }}>
          {/* Grab handle */}
          <View className="w-10 h-1 rounded-full bg-border self-center mt-3 mb-1" />

          <ScrollView keyboardShouldPersistTaps="handled">
            <View className="p-6 gap-4">
              <HStack className="justify-between">
                <Heading size="sm">
                  {mode === "edit" ? t("profileEducationUpdate") : t("profileEducationAdd")}
                </Heading>
                <Pressable onPress={onClose} hitSlop={12}><X size={20} /></Pressable>
              </HStack>

              <SelectField
                label={t("profileEducationInstitution")}
                placeholder={t("profileEducationInstitution")}
                options={institutions}
                value={form.institutionId}
                onChange={(v) => {
                  setForm((p) => ({
                    ...p,
                    institutionId: v,
                    campusId: "",
                    facultyId: "",
                    programId: "",
                  }));
                }}
                isLoading={loadingInst}
              />

              <SelectField
                label={t("profileEducationCampus")}
                placeholder={t("profileEducationCampus")}
                options={campuses}
                value={form.campusId}
                onChange={(v) => {
                  setForm((p) => ({ ...p, campusId: v, facultyId: "", programId: "" }));
                }}
                isLoading={loadingCampus}
              />

              <SelectField
                label={t("profileEducationFaculty")}
                placeholder={t("profileEducationFaculty")}
                options={faculties}
                value={form.facultyId}
                onChange={(v) => {
                  setForm((p) => ({ ...p, facultyId: v, programId: "" }));
                }}
                isLoading={loadingFaculty}
              />

              <SelectField
                label={t("profileEducationProgram")}
                placeholder={t("profileEducationProgram")}
                options={programs}
                value={form.programId}
                onChange={set("programId")}
                isLoading={loadingPrograms}
              />

              <DateField
                label={t("profileEducationStartDate")}
                value={form.startDate}
                onChange={set("startDate")}
                required
              />

              <DateField
                label={t("profileEducationEndDate")}
                value={form.endDate}
                onChange={set("endDate")}
                disabled={form.isStudent}
              />

              <Checkbox
                isChecked={form.isStudent}
                onChange={(checked) => set("isStudent")(checked)}
                isRtl={isRtl}
              >
                <CheckboxIndicator>
                  <CheckboxIcon />
                </CheckboxIndicator>
                <CheckboxLabel>{t("profileEducationCurrently")}</CheckboxLabel>
              </Checkbox>

              <VStack className="gap-1">
                <Text className="text-sm font-semibold text-foreground">
                  {t("profileEducationGrade")} {t("profileEducationGradeRange")}
                </Text>
                <Input>
                  <InputField
                    value={form.grade}
                    onChangeText={set("grade")}
                    keyboardType="numeric"
                    placeholder={t("profileEducationGradePlaceholder")}
                  />
                </Input>
              </VStack>

              <VStack className="gap-1">
                <Text className="text-sm font-semibold text-foreground">{t("profileEducationDescription")}</Text>
                <Textarea>
                  <TextareaInput
                    value={form.description}
                    onChangeText={set("description")}
                    textAlign={isRtl ? "right" : "left"}
                    placeholder={t("profileExperienceDescriptionPlaceholder")}
                  />
                </Textarea>
              </VStack>

              <Button
                label={saving ? t("common.loading") : t("profileInfoSave")}
                onPress={handleSave}
                disabled={saving}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AcademicBackgroundSection() {
  const { t, isRtl, lang } = useCustomTranslation();
  const { formatDate } = useLocalization();
  const user = useAuthStore((s) => s.user);
  const userId = user?.sub ?? "";
  const locale = (lang === "ar" ? "ar" : "en") as "en" | "ar";

  // Cached per user + locale (React Query via useAsyncResource); edits update the cache.
  const { data, loading: listLoading, reload, setData } = useAsyncResource<AcademicBackground[]>(
    ["academicBackgrounds", locale],
    () => (userId ? academicApi.getAcademicBackgrounds(userId, locale).catch(() => [] as AcademicBackground[]) : Promise.resolve([]))
  );
  const loading = !!userId && listLoading;
  const items = data ?? [];
  const setItems = (updater: (prev: AcademicBackground[]) => AcademicBackground[]) =>
    setData((prev) => updater(prev ?? []));
  const load = async () => reload();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<AcademicBackground | null>(null);

  const handleDelete = (id: string) => {
    confirmAlert(t("profileEducationDelete"), t("profileEducationDeleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await academicApi.deleteAcademicBackground(id);
            setItems((prev) => prev.filter((i) => i._id !== id));
          } catch {
            showToast(t("profileDeleteError"));
          }
        },
      },
    ]);
  };

  const handleSave = async (form: FormState) => {
    const dto: AcademicBackgroundDto = {
      university_id: Number(form.institutionId),
      program_id: Number(form.programId),
      startDate: toLocalIsoDate(form.startDate),
      endDate: form.isStudent ? undefined : toLocalIsoDate(form.endDate),
      grade: form.grade ? Number(form.grade) : undefined,
      isStudent: form.isStudent,
      description: form.description || undefined,
    };

    if (editItem) {
      const updated = await academicApi.updateAcademicBackground(editItem._id, dto);
      const enriched: AcademicBackground = {
        ...updated,
        institutionName: items.find((i) => i.university_id === updated.university_id)?.institutionName,
        programName: items.find((i) => i.program_id === updated.program_id)?.programName,
        isStudent: updated.isStudent,
      };
      setItems((prev) => prev.map((i) => (i._id === editItem._id ? enriched : i)));
    } else {
      await academicApi.addAcademicBackground(dto);
      await load();
    }
  };

  const openAdd = () => { setEditItem(null); setShowModal(true); };
  const openEdit = (item: AcademicBackground) => { setEditItem(item); setShowModal(true); };

  if (loading) {
    return (
      <VStack className="gap-4 p-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-32 rounded-2xl bg-muted" />
        ))}
      </VStack>
    );
  }

  const editForm: FormState | undefined = editItem
    ? {
        institutionId: editItem.university_id ?? "",
        campusId: "",
        facultyId: "",
        programId: editItem.program_id ?? "",
        startDate: parseDate(editItem.startDate),
        endDate: parseDate(editItem.endDate),
        grade: editItem.grade != null ? String(editItem.grade) : "",
        isStudent: editItem.isStudent,
        description: editItem.description ?? "",
      }
    : undefined;

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
    >
      {items.length === 0 ? (
        <EmptyState
          title={t("profileEducationEmpty")}
          description={t("profileEducationEmptyDesc")}
        />
      ) : (
        items.map((item) => {
          const startStr = item.startDate
            ? formatDate(item.startDate, { year: "numeric", month: "short" })
            : "";
          const endStr = item.isStudent
            ? t("profileEducationPresent")
            : (item.endDate ? formatDate(item.endDate, { year: "numeric", month: "short" }) : "");
          const dateStr = [startStr, endStr].filter(Boolean).join(" – ");

          return (
            <BackgroundCard
              key={item._id}
              icon={GraduationCap}
              title={item.programName ?? `#${item.program_id}`}
              subtitle={item.institutionName ?? `#${item.university_id}`}
              dateStr={dateStr || undefined}
              description={item.description}
              onEdit={() => openEdit(item)}
              onDelete={() => handleDelete(item._id)}
            />
          );
        })
      )}

      <Button
        label={t("profileEducationAdd")}
        action="primary"
        onPress={openAdd}
      />

      <AcademicFormModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        initialForm={editForm}
        mode={editItem ? "edit" : "add"}
        locale={locale}
      />
    </ScrollView>
  );
}
