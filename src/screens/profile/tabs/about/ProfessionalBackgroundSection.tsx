/**
 * ProfessionalBackgroundSection — list + add/edit/delete professional backgrounds.
 *
 * Node API: GET/POST/PUT/DELETE /professional-backgrounds
 *
 * Batch F: experience cards use shared BackgroundCard.
 * Form modals have grab handle (w-10 h-1 rounded-full bg-border self-center mt-3 mb-1).
 *
 * Fields: Job Title (req), Company (req), Employment Type (select, req),
 *         Currently Working (Gluestack Checkbox, disables End Date), Country (select, req),
 *         City (req), Start Date, End Date, Description (Gluestack Textarea).
 *
 * Fixes:
 *  - Date serialization uses LOCAL components (no UTC off-by-one)
 *  - Raw TextInput → Gluestack Textarea/TextareaInput
 *  - Hand-rolled checkbox → Gluestack Checkbox
 *  - "Present" string through t() in both locales
 *  - date.toLocaleDateString → useLocalization() formatDate
 *  - Destructive actions: confirmAlert
 */

import { useEffect, useState } from "react";
import {
  View, ScrollView, Modal, Pressable,
} from "react-native";
import { X, Briefcase } from "lucide-react-native";
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
import { showToast } from "@/stores/toastStore";
import { academicApi, type ProfessionalBackground } from "@/api/academicApi";
import { useAsyncResource } from "@/hooks/useAsyncResource";
import { useCountries } from "@/hooks/queries/useProfile";

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPLOYMENT_TYPES: SelectOption[] = [
  "full_time",
  "part_time",
  "contract",
  "freelance",
  "internship",
  "temporary",
  "self_employed",
  "offering",
].map((v) => ({
  value: v,
  label: v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
}));

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
  jobTitle: string;
  companyName: string;
  employmentType: string;
  country: string;
  city: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  description: string;
}

const DEFAULT_FORM: FormState = {
  jobTitle: "",
  companyName: "",
  employmentType: "",
  country: "",
  city: "",
  startDate: new Date(),
  endDate: new Date(),
  isCurrent: false,
  description: "",
};

// ─── Form modal ───────────────────────────────────────────────────────────────

function ExperienceFormModal({
  visible, onClose, onSave, initialForm, mode,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (form: FormState) => Promise<void>;
  initialForm?: FormState;
  mode: "add" | "edit";
}) {
  const { t, isRtl } = useCustomTranslation();

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm ?? DEFAULT_FORM);
  const countriesQuery = useCountries();
  const countries: SelectOption[] = (countriesQuery.data ?? []).map((c) => ({ label: c.countryName, value: c.countryName }));

  useEffect(() => {
    if (!visible) return;
    setForm(initialForm ?? DEFAULT_FORM);
  }, [visible]);

  const set =
    <K extends keyof FormState>(key: K) =>
    (val: FormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    if (!form.jobTitle.trim() || !form.companyName.trim() || !form.country || !form.city.trim() || !form.startDate) {
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
                  {mode === "edit" ? t("profileExperienceUpdate") : t("profileExperienceAdd")}
                </Heading>
                <Pressable onPress={onClose} hitSlop={12}><X size={20} /></Pressable>
              </HStack>

              {/* Job Title */}
              <VStack className="gap-1">
                <HStack className="gap-1">
                  <Text className="text-sm font-semibold text-foreground">{t("profileExperienceJobTitle")}</Text>
                  <Text className="text-sm text-destructive">*</Text>
                </HStack>
                <Input>
                  <InputField
                    value={form.jobTitle}
                    onChangeText={set("jobTitle")}
                    placeholder={t("profileExperienceJobTitle")}
                    textAlign={isRtl ? "right" : "left"}
                  />
                </Input>
              </VStack>

              {/* Company */}
              <VStack className="gap-1">
                <HStack className="gap-1">
                  <Text className="text-sm font-semibold text-foreground">{t("profileExperienceCompany")}</Text>
                  <Text className="text-sm text-destructive">*</Text>
                </HStack>
                <Input>
                  <InputField
                    value={form.companyName}
                    onChangeText={set("companyName")}
                    placeholder={t("profileExperienceCompany")}
                    textAlign={isRtl ? "right" : "left"}
                  />
                </Input>
              </VStack>

              {/* Employment Type */}
              <SelectField
                label={t("profileExperienceEmploymentType")}
                placeholder={t("profileExperienceEmploymentType")}
                options={EMPLOYMENT_TYPES}
                value={form.employmentType}
                onChange={set("employmentType")}
              />

              {/* Currently working */}
              <Checkbox
                isChecked={form.isCurrent}
                onChange={(checked) => set("isCurrent")(checked)}
                isRtl={isRtl}
              >
                <CheckboxIndicator>
                  <CheckboxIcon />
                </CheckboxIndicator>
                <CheckboxLabel>{t("profileExperienceCurrently")}</CheckboxLabel>
              </Checkbox>

              {/* Country */}
              <SelectField
                label={t("profileCountry")}
                placeholder={t("profileCountry")}
                options={countries}
                value={form.country}
                onChange={(v) => setForm((p) => ({ ...p, country: v, city: "" }))}
              />

              {/* City */}
              <VStack className="gap-1">
                <HStack className="gap-1">
                  <Text className="text-sm font-semibold text-foreground">{t("profileCity")}</Text>
                  <Text className="text-sm text-destructive">*</Text>
                </HStack>
                <Input>
                  <InputField
                    value={form.city}
                    onChangeText={set("city")}
                    placeholder={t("profileCityPlaceholder")}
                    textAlign={isRtl ? "right" : "left"}
                  />
                </Input>
              </VStack>

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
                disabled={form.isCurrent}
              />

              {/* Description */}
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

export function ProfessionalBackgroundSection() {
  const { t } = useCustomTranslation();
  const { formatDate } = useLocalization();

  // Cached per user (React Query via useAsyncResource); edits update the cache.
  const {
    data,
    loading,
    setData,
  } = useAsyncResource<ProfessionalBackground[]>(["professionalBackgrounds"], () =>
    academicApi.getProfessionalBackgrounds().catch(() => [] as ProfessionalBackground[])
  );
  const items = data ?? [];
  const setItems = (updater: (prev: ProfessionalBackground[]) => ProfessionalBackground[]) =>
    setData((prev) => updater(prev ?? []));
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<ProfessionalBackground | null>(null);

  const handleDelete = (id: string) => {
    confirmAlert(t("profileExperienceDelete"), t("profileExperienceDeleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await academicApi.deleteProfessionalBackground(id);
            setItems((prev) => prev.filter((i) => i._id !== id));
          } catch {
            showToast(t("profileDeleteError"));
          }
        },
      },
    ]);
  };

  const handleSave = async (form: FormState) => {
    const dto = {
      jobTitle: form.jobTitle.trim(),
      companyName: form.companyName.trim(),
      employmentType: form.employmentType,
      location: { country: form.country, city: form.city.trim() },
      startDate: toLocalIsoDate(form.startDate),
      endDate: form.isCurrent ? undefined : toLocalIsoDate(form.endDate),
      isCurrent: form.isCurrent,
      description: form.description.trim() || undefined,
    };

    if (editItem) {
      const updated = await academicApi.updateProfessionalBackground(editItem._id, dto);
      setItems((prev) => prev.map((i) => (i._id === editItem._id ? updated : i)));
    } else {
      const created = await academicApi.addProfessionalBackground(dto);
      setItems((prev) => [...prev, created]);
    }
  };

  const openEdit = (item: ProfessionalBackground) => { setEditItem(item); setShowModal(true); };
  const openAdd = () => { setEditItem(null); setShowModal(true); };

  if (loading) {
    return (
      <VStack className="gap-4 p-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl bg-muted" />
        ))}
      </VStack>
    );
  }

  const editForm: FormState | undefined = editItem
    ? {
        jobTitle: editItem.jobTitle,
        companyName: editItem.companyName,
        employmentType: editItem.employmentType,
        country: editItem.location?.country ?? "",
        city: editItem.location?.city ?? "",
        startDate: parseDate(editItem.startDate),
        endDate: parseDate(editItem.endDate),
        isCurrent: editItem.isCurrent,
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
          title={t("profileExperienceEmpty")}
          description={t("profileExperienceEmptyDesc")}
        />
      ) : (
        items.map((item) => {
          const startStr = item.startDate
            ? formatDate(item.startDate, { year: "numeric", month: "short" })
            : "";
          const endStr = item.isCurrent
            ? t("profileEducationPresent")
            : (item.endDate ? formatDate(item.endDate, { year: "numeric", month: "short" }) : "");
          const dateStr = [startStr, endStr].filter(Boolean).join(" – ");
          const locationStr = item.location?.city
            ? `${item.location.city}${item.location.country ? ", " + item.location.country : ""}`
            : undefined;
          const descriptionWithLocation = [locationStr, item.description].filter(Boolean).join("\n");

          return (
            <BackgroundCard
              key={item._id}
              icon={Briefcase}
              title={item.jobTitle}
              subtitle={item.companyName}
              dateStr={dateStr || undefined}
              description={descriptionWithLocation || undefined}
              onEdit={() => openEdit(item)}
              onDelete={() => handleDelete(item._id)}
            />
          );
        })
      )}

      <Button label={t("profileExperienceAdd")} action="primary" onPress={openAdd} />

      <ExperienceFormModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        initialForm={editForm}
        mode={editItem ? "edit" : "add"}
      />
    </ScrollView>
  );
}
