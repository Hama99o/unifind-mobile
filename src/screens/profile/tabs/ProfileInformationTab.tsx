/**
 * ProfileInformationTab — form bound to GET/PATCH /userinfo.
 *
 * Fields split into 3 grouped cards:
 *   Identity: First Name, Last Name, Date of Birth, Role (read-only), Gender
 *   Contact: Phone + DialCode
 *   Location: Country, City
 *
 * Loading: Skeleton while /userinfo + /country load in parallel.
 * Error: EmptyState with retry button.
 * Save button shows Skeleton while saving.
 * Validation: required fields, toast on error, success toast.
 * paddingBottom: 80 for keyboard clearance.
 */

import { useEffect, useRef, useState } from "react";
import {
  View,
} from "react-native";
import { KeyboardSafeScrollView } from "@/components/shared/KeyboardSafeScrollView";
import { Lock } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Input, InputField } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { DateField } from "@/components/ui/date-field";
import { Skeleton } from "@/components/ui/skeleton";
import { VStack, HStack } from "@/components/ui/box";
import { EmptyState } from "@/components/shared/EmptyState";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import { showToast } from "@/stores/toastStore";
import { profileApi, type Country } from "@/api/profileApi";
import { useCountries, useInvalidateUserInfo, useUserInfo } from "@/hooks/queries/useProfile";

// ─── Date helpers ─────────────────────────────────────────────────────────────

function parseDate(str: string): Date {
  if (!str) return new Date(2000, 0, 1);
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date(2000, 0, 1) : d;
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function FieldSkeleton() {
  return <Skeleton className="h-12 rounded-xl bg-muted" />;
}

function LabelSkeleton() {
  return <Skeleton className="h-4 w-24 rounded bg-muted" />;
}

function GroupSkeleton() {
  return (
    <View className="bg-card rounded-2xl p-4 gap-4">
      <Skeleton className="h-4 w-20 rounded bg-muted" />
      {[1, 2, 3].map((i) => (
        <VStack key={i} className="gap-1">
          <LabelSkeleton />
          <FieldSkeleton />
        </VStack>
      ))}
    </View>
  );
}

function LoadingSkeleton() {
  return (
    <VStack className="gap-4 p-4" style={{ paddingBottom: 80 }}>
      <GroupSkeleton />
      <GroupSkeleton />
      <GroupSkeleton />
      <Skeleton className="h-12 rounded-xl bg-muted" />
    </VStack>
  );
}

// ─── Field label component ─────────────────────────────────────────────────────

export function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  // Follows the reading direction like the inputs (ar was left-aligned).
  const { isRtl } = useCustomTranslation();
  return (
    <HStack
      className="gap-1 mb-1"
      style={{ flexDirection: isRtl ? "row-reverse" : "row" }}
      testID="field-label"
    >
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
      {required && <Text className="text-sm text-destructive">*</Text>}
    </HStack>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────

export function SectionHeading({ label }: { label: string }) {
  const { isRtl } = useCustomTranslation();
  return (
    <Text
      className="text-xs font-semibold text-muted-foreground mb-1"
      style={{ textTransform: "uppercase", letterSpacing: 0.8, textAlign: isRtl ? "right" : "left" }}
      testID="section-heading"
    >
      {label}
    </Text>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProfileInformationTab() {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();

  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [dialCode, setDialCode] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [role, setRole] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [gender, setGender] = useState("");

  // Server state (React Query): shared, cached user info + countries.
  const infoQuery = useUserInfo();
  const countriesQuery = useCountries();
  const invalidateUserInfo = useInvalidateUserInfo();
  const countries: Country[] = countriesQuery.data ?? [];
  const loading = infoQuery.isPending || countriesQuery.isPending;
  const error = infoQuery.isError || countriesQuery.isError ? t("profileLoadError") : null;

  const genderOptions = [
    { label: t("profileGenderMale"), value: "Male" },
    { label: t("profileGenderFemale"), value: "Female" },
  ];

  const init = () => {
    void infoQuery.refetch();
    void countriesQuery.refetch();
  };

  // Seed the editable form once from the loaded profile (never overwrite edits).
  const seeded = useRef(false);
  useEffect(() => {
    const info = infoQuery.data;
    if (!info || seeded.current) return;
    seeded.current = true;
    setFirstName(info.firstName ?? "");
    setLastName(info.lastName ?? "");
    setPhone(info.phoneNumber ?? "");
    setDialCode(info.dialCode ?? "");
    if (info.dateOfBirth) {
      setDob(parseDate(info.dateOfBirth));
    }
    setRole(info.role ?? "");
    setCountry(info.country ?? "");
    setCity(info.city ?? "");
    setGender(info.gender ?? "");
  }, [infoQuery.data]);

  const countryOptions = countries.map((c) => ({
    label: c.countryName,
    value: c.countryName,
  }));

  const dialCodeOptions = countries
    .filter((c) => c.countryDialCode)
    .map((c) => ({
      label: `${c.countryDialCode} (${c.countryCode ?? ""})`,
      value: c.countryDialCode.replace("+", ""),
    }));

  const handleSave = async () => {
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !phone.trim() ||
      !dob ||
      !role.trim() ||
      !country ||
      !gender
    ) {
      showToast(t("profileInfoErrorRequired"));
      return;
    }

    setSaving(true);
    try {
      await profileApi.updateUserInfo({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phone.trim(),
        dialCode,
        dateOfBirth: toIsoDate(dob!),
        role,
        country,
        city: city.trim(),
        gender,
      });
      showToast(t("profileInfoSuccess"));
      void invalidateUserInfo();
    } catch {
      showToast(t("profileInfoError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <View className="flex-1 p-4">
        <EmptyState
          title={t("profileLoadError")}
          description={t("common.retry")}
        />
        <Button label={t("common.retry")} onPress={init} action="primary" />
      </View>
    );
  }

  return (
    <KeyboardSafeScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Identity ─────────────────────────────────────────────────────── */}
      <View className="bg-card rounded-2xl p-4 gap-4">
        <SectionHeading label={t("profileSectionIdentity")} />

        {/* First Name */}
        <VStack className="gap-1">
          <FieldLabel label={t("profileFirstName")} required />
          <Input>
            <InputField
              value={firstName}
              onChangeText={setFirstName}
              placeholder={t("profileFirstNamePlaceholder")}
              textAlign={isRtl ? "right" : "left"}
            />
          </Input>
        </VStack>

        {/* Last Name */}
        <VStack className="gap-1">
          <FieldLabel label={t("profileLastName")} required />
          <Input>
            <InputField
              value={lastName}
              onChangeText={setLastName}
              placeholder={t("profileLastNamePlaceholder")}
              textAlign={isRtl ? "right" : "left"}
            />
          </Input>
        </VStack>

        {/* Date of Birth */}
        <DateField
          label={t("profileDob")}
          value={dob}
          onChange={(d) => setDob(d)}
          placeholder={t("profileDobPlaceholder")}
          maximumDate={new Date()}
          required
        />

        {/* Role — read-only with lock icon */}
        <VStack className="gap-1">
          <FieldLabel label={t("profileRole")} required />
          <View
            style={{
              backgroundColor: colors.muted,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 12,
              flexDirection: isRtl ? "row-reverse" : "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text className="text-foreground text-sm flex-1" numberOfLines={1}>
              {role || t("profileRolePlaceholder")}
            </Text>
            <Lock size={16} color={colors.mutedForeground} />
          </View>
        </VStack>

        {/* Gender */}
        <VStack className="gap-1">
          <FieldLabel label={t("profileGender")} required />
          <SelectField
            placeholder={t("profileGender")}
            options={genderOptions}
            value={gender}
            onChange={setGender}
          />
        </VStack>
      </View>

      {/* ── Contact ──────────────────────────────────────────────────────── */}
      <View className="bg-card rounded-2xl p-4 gap-4">
        <SectionHeading label={t("profileSectionContact")} />

        {/* Phone + Dial code */}
        <VStack className="gap-1">
          <FieldLabel label={t("profilePhone")} required />
          <HStack className={`gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
            <View style={{ width: 130 }}>
              <SelectField
                placeholder={t("phoneCodePlaceholder")}
                options={dialCodeOptions}
                value={dialCode}
                onChange={setDialCode}
                searchable
              />
            </View>
            <View className="flex-1">
              <Input>
                <InputField
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="71 234 567"
                  textAlign={isRtl ? "right" : "left"}
                />
              </Input>
            </View>
          </HStack>
        </VStack>
      </View>

      {/* ── Location ─────────────────────────────────────────────────────── */}
      <View className="bg-card rounded-2xl p-4 gap-4">
        <SectionHeading label={t("profileSectionLocation")} />

        {/* Country */}
        <VStack className="gap-1">
          <FieldLabel label={t("profileCountry")} required />
          <SelectField
            placeholder={t("profileCountry")}
            options={countryOptions}
            value={country}
            onChange={setCountry}
            searchable
          />
        </VStack>

        {/* City */}
        <VStack className="gap-1">
          <FieldLabel label={t("profileCity")} />
          <Input>
            <InputField
              value={city}
              onChangeText={setCity}
              placeholder={t("profileCityPlaceholder")}
              textAlign={isRtl ? "right" : "left"}
            />
          </Input>
        </VStack>
      </View>

      {/* Save button — shows Skeleton while saving */}
      {saving ? (
        <Skeleton className="h-12 rounded-xl bg-muted" />
      ) : (
        <Button
          label={t("profileInfoUpdate")}
          action="primary"
          onPress={handleSave}
        />
      )}
    </KeyboardSafeScrollView>
  );
}
