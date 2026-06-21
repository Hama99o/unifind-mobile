/**
 * ProgramExplorerHubScreen — Program Explorer discovery hub.
 * Web parity: /[locale]/program-explorer
 *
 * Layout mirrors GrowthCenterScreen (hub pattern):
 *   - Gradient hero (turquoise → prussian) + breadcrumb + title + tab switcher
 *   - Centered search box
 *   - Fields | Degrees tab content: 2-col tile grid
 *
 * Field tile → push /(main)/find?find=programs&field=<name>
 * Degree tile → push /(main)/find?find=programs&level=<title>
 * "Browse all" → push /(main)/find (programs default)
 *
 * Route params:
 *   ?tab=fields|degrees  — initial tab (default: fields)
 *   ?field=<name>        — pre-navigate to find with field filter
 *   ?level=<title>       — pre-navigate to find with level filter
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { Button } from "@/components/ui/button";
import { ScreenContainer } from "@/components/shared/ScreenContainer";
import { HubHero, HubTabBar, HubSearchBox } from "@/components/shared/HubHero";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { programExplorerApi } from "@/api/programExplorerApi";
import type { FieldWithIconItem, DegreeItem } from "@/api/programExplorerApi";

import { FieldsGrid, DegreesGrid } from "@/screens/explorer/ProgramExplorerHubCards";
import { SectionHeading } from "@/screens/GrowthCenterHubCards";

// ─── Types ────────────────────────────────────────────────────────────────────

type HubTab = "fields" | "degrees";

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProgramExplorerHubScreen() {
  const { t, lang, isRtl } = useCustomTranslation();
  const locale = (lang === "ar" ? "ar" : "en") as "en" | "ar";

  const params = useLocalSearchParams<{
    tab?: string;
    field?: string;
    level?: string;
  }>();

  const initialTab: HubTab =
    params.tab?.toLowerCase() === "degrees" ? "degrees" : "fields";

  const [activeTab, setActiveTab] = useState<HubTab>(initialTab);
  const [search, setSearch] = useState("");
  const [fields, setFields] = useState<FieldWithIconItem[]>([]);
  const [degrees, setDegrees] = useState<DegreeItem[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [loadingDegrees, setLoadingDegrees] = useState(false);

  // Track if deep-link params were handled once data is loaded
  const deepLinkHandled = useRef(false);

  // ── Fetch fields ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoadingFields(true);
    programExplorerApi
      .fetchFieldOptionsWithIcons(locale)
      .then((data) => { if (!cancelled) setFields(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingFields(false); });
    return () => { cancelled = true; };
  }, [locale]);

  // ── Fetch degrees (only when tab is active or pre-fetched for deep-link) ──
  useEffect(() => {
    let cancelled = false;
    if (activeTab !== "degrees" && !params.level) return;
    setLoadingDegrees(true);
    programExplorerApi
      .fetchDegreeOptions(locale)
      .then((data) => { if (!cancelled) setDegrees(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingDegrees(false); });
    return () => { cancelled = true; };
  }, [activeTab, locale, params.level]);

  // ── Handle deep-link ?field / ?level params ────────────────────────────────
  // Navigate immediately to find with the right filters applied
  useEffect(() => {
    if (deepLinkHandled.current) return;
    if (params.field && !loadingFields) {
      deepLinkHandled.current = true;
      router.push(`/(main)/find?find=programs&field=${encodeURIComponent(params.field)}` as never);
      return;
    }
    if (params.level && !loadingDegrees && degrees.length > 0) {
      deepLinkHandled.current = true;
      router.push(`/(main)/find?find=programs&level=${encodeURIComponent(params.level)}` as never);
    }
  }, [loadingFields, loadingDegrees, degrees, params.field, params.level]);

  // ── Navigation helpers ────────────────────────────────────────────────────
  const handleFieldPress = useCallback((fieldName: string) => {
    router.push(`/(main)/find?find=programs&field=${encodeURIComponent(fieldName)}` as never);
  }, []);

  const handleDegreePress = useCallback((degreeTitle: string) => {
    router.push(`/(main)/find?find=programs&level=${encodeURIComponent(degreeTitle)}` as never);
  }, []);

  const handleBrowseAll = useCallback(() => {
    router.push("/(main)/find?find=programs" as never);
  }, []);

  // ── HubTabBar tabs definition ─────────────────────────────────────────────
  const tabs = [
    { key: "fields", label: t("fields") },
    { key: "degrees", label: t("degrees") },
  ];

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} bounces>
        {/* ── Hero gradient band ──────────────────────────────────────── */}
        <HubHero
          homeLabelKey="tabs.home"
          trailingBreadcrumbLabel={t("programExplorer.title")}
          title={t("findPrograms")}
          t={t}
          isRtl={isRtl}
          tabBarSlot={
            <HubTabBar
              tabs={tabs}
              active={activeTab}
              onChange={(key) => setActiveTab(key as HubTab)}
              isRtl={isRtl}
            />
          }
          searchSlot={
            <HubSearchBox
              value={search}
              onChange={setSearch}
              placeholder={t("insertKeyword")}
            />
          }
        />

        {/* ── Content grid ──────────────────────────────────────────── */}
        <View className="py-4">
          {activeTab === "fields" ? (
            <>
              <SectionHeading title={t("fields")} />
              <FieldsGrid
                items={fields}
                search={search}
                onPress={handleFieldPress}
                loading={loadingFields}
                isRtl={isRtl}
              />
            </>
          ) : (
            <>
              <SectionHeading title={t("degrees")} />
              <DegreesGrid
                items={degrees}
                search={search}
                onPress={handleDegreePress}
                loading={loadingDegrees}
                isRtl={isRtl}
              />
            </>
          )}

          {/* Browse all → Find lists (ensures Institutions/Offerings remain reachable) */}
          <View className="px-4 pt-6">
            <Button
              label={t("browseAll")}
              action="primary"
              variant="outline"
              onPress={handleBrowseAll}
            />
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </ScreenContainer>
  );
}
