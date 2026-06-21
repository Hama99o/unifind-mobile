/**
 * OverviewSection — Bio (textarea + save), Skills (badges), Languages (list).
 *
 * §S6 token fixes:
 *   - Skill chips: bg-primary (token) + text-primary-foreground + X icon colors.primaryForeground
 *   - Add-skill/language circles: w-10 h-10 bg-lightgreen (was w-8 h-8 bg-secondary) + icon colors.primary
 *   - Language delete: hitSlop={16} (≥44px touch target)
 *
 * - Bio: PATCH /user-info { bio }
 * - Skills: GET/POST/DELETE /skill (auth Bearer via nodeApi)
 * - Languages: GET /language for options, PATCH /user-info { languageIds } for save/delete
 *
 * Destructive deletes use confirmAlert (never raw Alert.alert).
 */

import { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  Modal,
} from "react-native";
import { X, Plus, Globe } from "lucide-react-native";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { SelectField } from "@/components/ui/select-field";
import { VStack, HStack } from "@/components/ui/box";
import { EmptyState } from "@/components/shared/EmptyState";
import { confirmAlert } from "@/components/ui/alert-dialog";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import { showToast } from "@/stores/toastStore";
import { profileApi, type Skill, type Language } from "@/api/profileApi";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SectionSkeleton() {
  return (
    <VStack className="gap-3 p-4">
      <Skeleton className="h-5 w-32 rounded bg-muted" />
      <Skeleton className="h-24 rounded-xl bg-muted" />
      <Skeleton className="h-5 w-20 rounded bg-muted" />
      <HStack className="gap-2 flex-wrap">
        {[80, 100, 70].map((w, i) => (
          <Skeleton key={i} className="h-8 rounded-full bg-muted" style={{ width: w }} />
        ))}
      </HStack>
    </VStack>
  );
}

// ─── Skill modal ──────────────────────────────────────────────────────────────

interface SkillModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}

function SkillModal({ visible, onClose, onSave }: SkillModalProps) {
  const { t } = useCustomTranslation();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  const handleSave = async () => {
    setTouched(true);
    if (name.trim().length < 2) return;
    setSaving(true);
    await onSave(name.trim());
    setSaving(false);
    setName("");
    setTouched(false);
    onClose();
  };

  const handleClose = () => {
    setName("");
    setTouched(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable
        className="flex-1 bg-black/50 justify-end"
        onPress={handleClose}
      >
        <Pressable
          className="bg-background rounded-t-3xl p-6"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Grab handle */}
          <View className="w-10 h-1 rounded-full bg-border self-center mt-0 mb-4" />

          <HStack className="justify-between mb-4">
            <Heading size="sm">{t("profileSkillsAdd")}</Heading>
            <Pressable onPress={handleClose} hitSlop={12}>
              <X size={20} />
            </Pressable>
          </HStack>
          <VStack className="gap-1 mb-4">
            <Text className="text-sm font-semibold text-foreground">
              {t("skill")} <Text className="text-destructive">*</Text>
            </Text>
            <Input>
              <InputField
                value={name}
                onChangeText={setName}
                placeholder={t("profileSkillPlaceholder")}
                autoFocus
              />
            </Input>
            {touched && name.trim().length < 2 && (
              <Text className="text-xs text-destructive">{t("profileSkillMinLength")}</Text>
            )}
          </VStack>
          <Button
            label={saving ? t("common.loading") : t("profileInfoSave")}
            onPress={handleSave}
            disabled={saving}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Language modal ───────────────────────────────────────────────────────────

interface LanguageModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (langId: string) => Promise<void>;
  allLanguages: Language[];
  addedIds: string[];
}

function LanguageModal({ visible, onClose, onSave, allLanguages, addedIds }: LanguageModalProps) {
  const { t } = useCustomTranslation();
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);

  const options = allLanguages
    .filter((l) => !addedIds.includes(l._id))
    .map((l) => ({ label: l.languageName, value: l._id }));

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    await onSave(selected);
    setSaving(false);
    setSelected("");
    onClose();
  };

  const handleClose = () => {
    setSelected("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable
        className="flex-1 bg-black/50 justify-end"
        onPress={handleClose}
      >
        <Pressable
          className="bg-background rounded-t-3xl p-6"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Grab handle */}
          <View className="w-10 h-1 rounded-full bg-border self-center mt-0 mb-4" />

          <HStack className="justify-between mb-4">
            <Heading size="sm">{t("addLanguage")}</Heading>
            <Pressable onPress={handleClose} hitSlop={12}>
              <X size={20} />
            </Pressable>
          </HStack>
          <VStack className="gap-1 mb-4">
            <SelectField
              placeholder={t("language")}
              options={options}
              value={selected}
              onChange={setSelected}
              label={t("language")}
            />
          </VStack>
          <Button
            label={saving ? t("common.loading") : t("profileInfoSave")}
            onPress={handleSave}
            disabled={saving || !selected}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OverviewSection() {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();

  const [loading, setLoading] = useState(true);
  const [bio, setBio] = useState("");
  const [savingBio, setSavingBio] = useState(false);

  const [skills, setSkills] = useState<Skill[]>([]);
  const [showSkillModal, setShowSkillModal] = useState(false);

  const [userLangs, setUserLangs] = useState<Array<{ _id: string; languageName: string }>>([]);
  const [allLanguages, setAllLanguages] = useState<Language[]>([]);
  const [showLangModal, setShowLangModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [extended, skillList, langList] = await Promise.all([
          profileApi.getUserExtended(),
          profileApi.getSkills(),
          profileApi.getLanguages(),
        ]);
        setBio(extended.bio ?? "");
        setUserLangs(extended.languages ?? []);
        setSkills(skillList);
        setAllLanguages(langList);
      } catch {
        // ignore — user sees empty
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSaveBio = async () => {
    setSavingBio(true);
    try {
      await profileApi.updateUserExtended({ bio });
      showToast(t("profileBioSuccess"));
    } catch {
      showToast(t("profileBioError"));
    } finally {
      setSavingBio(false);
    }
  };

  const handleAddSkill = async (name: string) => {
    const skill = await profileApi.addSkill(name);
    setSkills((prev) => [...prev, skill]);
  };

  const handleDeleteSkill = (id: string, name: string) => {
    confirmAlert(t("profileSkillsTitle"), `${t("profileDeleteConfirm")} "${name}"?`, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await profileApi.deleteSkill(id);
            setSkills((prev) => prev.filter((s) => s._id !== id));
          } catch {
            showToast(t("profileSkillDeleteError"));
          }
        },
      },
    ]);
  };

  const handleAddLanguage = async (langId: string) => {
    const lang = allLanguages.find((l) => l._id === langId);
    if (!lang) return;
    const newLangs = [...userLangs, lang];
    await profileApi.updateUserExtended({ languageIds: newLangs.map((l) => l._id) });
    setUserLangs(newLangs);
  };

  const handleDeleteLanguage = (id: string, name: string) => {
    confirmAlert(t("deleteLanguage"), t("deleteLanguageConfirmation"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            const remaining = userLangs.filter((l) => l._id !== id);
            await profileApi.updateUserExtended({ languageIds: remaining.map((l) => l._id) });
            setUserLangs(remaining);
          } catch {
            showToast(t("profileLangDeleteError"));
          }
        },
      },
    ]);
  };

  if (loading) return <SectionSkeleton />;

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Bio */}
      <View className="bg-card rounded-2xl p-4 gap-3">
        <Heading size="sm" className="text-foreground">{t("profileBio")}</Heading>
        <Textarea>
          <TextareaInput
            value={bio}
            onChangeText={setBio}
            placeholder={t("profileBioPlaceholder")}
            textAlign={isRtl ? "right" : "left"}
            style={{ minHeight: 80 }}
          />
        </Textarea>
        <Button
          label={savingBio ? t("common.loading") : t("profileInfoSave")}
          onPress={handleSaveBio}
          disabled={savingBio}
          action="primary"
        />
      </View>

      {/* Skills */}
      <View className="bg-card rounded-2xl p-4 gap-3">
        <HStack className={`justify-between ${isRtl ? "flex-row-reverse" : ""}`}>
          <Heading size="sm" className="text-foreground">{t("profileSkillsTitle")}</Heading>
          {/* §S6: w-10 h-10 bg-lightgreen + icon colors.primary */}
          <Pressable
            onPress={() => setShowSkillModal(true)}
            className="bg-lightgreen items-center justify-center"
            style={{ width: 40, height: 40, borderRadius: 20 }}
          >
            <Plus size={18} color={colors.primary} />
          </Pressable>
        </HStack>

        {skills.length === 0 ? (
          <EmptyState title={t("profileSkillsEmpty")} />
        ) : (
          <View className={`flex-row flex-wrap gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
            {skills.map((s) => (
              <HStack
                key={s._id}
                className="bg-primary rounded-full px-3 py-1.5 gap-2 items-center"
              >
                <Text className="text-primary-foreground text-sm">{s.skillName}</Text>
                <Pressable onPress={() => handleDeleteSkill(s._id, s.skillName)} hitSlop={8}>
                  <X size={14} color={colors.primaryForeground} />
                </Pressable>
              </HStack>
            ))}
          </View>
        )}
      </View>

      {/* Languages */}
      <View className="bg-card rounded-2xl p-4 gap-3">
        <HStack className={`justify-between ${isRtl ? "flex-row-reverse" : ""}`}>
          <Heading size="sm" className="text-foreground">{t("profileLanguagesTitle")}</Heading>
          {/* §S6: w-10 h-10 bg-lightgreen + icon colors.primary */}
          <Pressable
            onPress={() => setShowLangModal(true)}
            className="bg-lightgreen items-center justify-center"
            style={{ width: 40, height: 40, borderRadius: 20 }}
          >
            <Plus size={18} color={colors.primary} />
          </Pressable>
        </HStack>

        {userLangs.length === 0 ? (
          <EmptyState title={t("profileLanguagesEmpty")} />
        ) : (
          <VStack className="gap-2">
            {userLangs.map((lang) => (
              <HStack
                key={lang._id}
                className={`justify-between border border-border rounded-xl p-3 ${isRtl ? "flex-row-reverse" : ""}`}
              >
                <HStack className={`gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                  {/* §S6: bg-lightgreen circle */}
                  <View
                    className="items-center justify-center bg-lightgreen"
                    style={{ width: 40, height: 40, borderRadius: 20 }}
                  >
                    <Globe size={18} color={colors.primary} />
                  </View>
                  <Text className="text-foreground font-medium">{lang.languageName}</Text>
                </HStack>
                {/* §S2: hitSlop 16 for ≥44px */}
                <Pressable
                  onPress={() => handleDeleteLanguage(lang._id, lang.languageName)}
                  hitSlop={16}
                >
                  <X size={18} color={colors.destructive} />
                </Pressable>
              </HStack>
            ))}
          </VStack>
        )}
      </View>

      {/* Modals */}
      <SkillModal
        visible={showSkillModal}
        onClose={() => setShowSkillModal(false)}
        onSave={handleAddSkill}
      />
      <LanguageModal
        visible={showLangModal}
        onClose={() => setShowLangModal(false)}
        onSave={handleAddLanguage}
        allLanguages={allLanguages}
        addedIds={userLangs.map((l) => l._id)}
      />
    </ScrollView>
  );
}
