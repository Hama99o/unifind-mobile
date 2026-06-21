/**
 * GrowthCenterScreen — Growth Center hub (replaces stub).
 * Web parity: /[locale]/growth-center
 *
 * Layout:
 *   - Gradient hero band (turquoise → prussian) with breadcrumb + title + tabs
 *   - Centered search box (Gluestack Input)
 *   - Offerings tab: "What Am I Looking For?" (categories) + "Fields" grids
 *   - Specialists tab: disabled (Coming Soon chips, web parity)
 *
 * Deep-link from home FindBar:
 *   ?search=<term>   → seeds hero search box
 *   ?category=<name> → resolves name→id from loaded categories → navigates to offerings filtered
 *   ?field=<name>    → resolves name→offering-ids from loaded fields → navigates to offerings filtered
 *
 * Note: FindBar emits NAMES (value=label in fetchOfferingCategories/fetchOfferingFields).
 * We resolve name→id/ids against the loaded category-usage/field-usage data.
 *
 * Navigation: app/(main)/find/offerings.tsx is the route for the list.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { ScreenContainer } from "@/components/shared/ScreenContainer";
import { HubHero, HubTabBar, HubSearchBox } from "@/components/shared/HubHero";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { offeringsFilterApi } from "@/api/offeringsFilterApi";
import type { CategoryUsageItem, FieldUsageItem } from "@/api/offeringsFilterApi";

import {
  CategoryGrid,
  FieldGrid,
  SpecialistsComingSoon,
  SectionHeading,
} from "@/screens/GrowthCenterHubCards";

// ─── Tab types ────────────────────────────────────────────────────────────────

type HubTab = "offerings" | "specialists";

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function GrowthCenterScreen() {
  const { t, lang, isRtl } = useCustomTranslation();

  // Deep-link params from home FindBar (search, category NAME, field NAME)
  const params = useLocalSearchParams<{
    search?: string;
    category?: string;
    field?: string;
  }>();

  const [activeTab, setActiveTab] = useState<HubTab>("offerings");
  const [search, setSearch] = useState(params.search ?? "");
  const [categories, setCategories] = useState<CategoryUsageItem[]>([]);
  const [fields, setFields] = useState<FieldUsageItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Track whether we've already acted on the incoming deep-link params.
  const deepLinkHandled = useRef(false);

  // ── Fetch grid data ────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "offerings") return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      offeringsFilterApi.fetchCategories(lang as "en" | "ar"),
      offeringsFilterApi.fetchFields(lang as "en" | "ar"),
    ])
      .then(([cats, flds]) => {
        if (!cancelled) {
          setCategories(cats);
          setFields(flds);
        }
      })
      .catch(() => {/* silently ignore */})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeTab, lang]);

  // ── Handle deep-link navigation once data is loaded ────────────────────────
  // FindBar sends NAMES (value=label), so we resolve name → id/ids here.
  useEffect(() => {
    if (deepLinkHandled.current) return;
    if (loading) return; // Wait for data to arrive
    if (!params.category && !params.field) return;

    deepLinkHandled.current = true;

    if (params.category) {
      // Resolve category name → category id
      const match = categories.find(
        (c) => c.category.name.toLowerCase() === params.category!.toLowerCase()
      );
      if (match) {
        router.push({
          pathname: "/(main)/find/offerings",
          params: { category: String(match.category.id) },
        } as never);
        return;
      }
    }

    if (params.field) {
      // Resolve field name → offering-ids JSON
      const match = fields.find(
        (f) => f.field.name.toLowerCase() === params.field!.toLowerCase()
      );
      if (match) {
        router.push({
          pathname: "/(main)/find/offerings",
          params: { field: JSON.stringify(match.offerings) },
        } as never);
        return;
      }
    }
  }, [loading, categories, fields, params.category, params.field]);

  // ── Navigate to offerings list ─────────────────────────────────────────────
  const openWithCategory = useCallback((categoryId: string, _name?: string) => {
    router.push({ pathname: "/(main)/find/offerings", params: { category: categoryId } } as never);
  }, []);

  const openWithField = useCallback((fieldOfferings: number[], _name?: string) => {
    router.push({
      pathname: "/(main)/find/offerings",
      params: { field: JSON.stringify(fieldOfferings) },
    } as never);
  }, []);

  const heroTitle = activeTab === "specialists" ? t("findSpecialist") : t("findOffering");

  // ── HubTabBar tabs definition ──────────────────────────────────────────────
  const tabs = [
    { key: "offerings", label: t("offering") },
    { key: "specialists", label: `${t("specialists")} (${t("common.comingSoon")})`, disabled: true },
  ];

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} bounces>
        {/* ── Hero gradient band ────────────────────────────────────────── */}
        <HubHero
          homeLabelKey="tabs.home"
          trailingBreadcrumbLabel={t("growthCenter.title")}
          title={heroTitle}
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
              placeholder={t("searchOfferings")}
            />
          }
        />

        {/* ── Content grids ─────────────────────────────────────────────── */}
        <View className="py-4">
          {activeTab === "offerings" ? (
            <>
              <SectionHeading title={t("whatAmILookingFor")} />
              <CategoryGrid
                items={categories}
                search={search}
                onPress={(id) => openWithCategory(id)}
                loading={loading}
              />

              <SectionHeading title={t("fields")} />
              <FieldGrid
                items={fields}
                search={search}
                onPress={(offerings) => openWithField(offerings)}
                loading={loading}
              />
            </>
          ) : (
            <SpecialistsComingSoon />
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </ScreenContainer>
  );
}
