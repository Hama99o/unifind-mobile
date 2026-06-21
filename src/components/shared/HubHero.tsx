/**
 * HubHero — shared shell for hub screens (GrowthCenter + ProgramExplorer).
 *
 * Exports:
 *   HubSearchBox  — centered search input with platform-conditional shadow
 *   HubTabBar     — generic tab switcher with disabled support
 *   HubHero       — full gradient hero band (breadcrumb + title + tabs + search)
 *
 * Tokens: brand.turquoise / brand.prussian / SHADOW_COLOR (no hardcoded hex).
 * RTL: flex-row-reverse on isRtl; textAlign propagated through props.
 * Cross-platform: Platform.OS guard on shadowColor (iOS/web only).
 */

import React from "react";
import { View, Pressable, Platform } from "react-native";
import { Search } from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { GradientView } from "@/components/shared/GradientView";
import { brand, SHADOW_COLOR } from "@/config/theme";
import { useColors } from "@/hooks/useColors";

// ─── HubSearchBox ─────────────────────────────────────────────────────────────

export interface HubSearchBoxProps {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}

export function HubSearchBox({ value, onChange, placeholder }: HubSearchBoxProps) {
  const colors = useColors();
  return (
    <View
      style={{
        width: "100%",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 3,
        ...(Platform.OS !== "android" ? { shadowColor: SHADOW_COLOR } : {}),
      }}
    >
      <Input className="bg-background rounded-2xl border-0" style={{ height: 50 }}>
        <InputSlot style={{ paddingLeft: 14 }}>
          <Search size={18} color={colors.mutedForeground} />
        </InputSlot>
        <InputField
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          returnKeyType="search"
          className="text-foreground text-sm"
        />
      </Input>
    </View>
  );
}

// ─── HubTabBar ────────────────────────────────────────────────────────────────

export interface HubTabItem {
  key: string;
  label: string;
  disabled?: boolean;
}

export interface HubTabBarProps {
  tabs: HubTabItem[];
  active: string;
  onChange: (key: string) => void;
  isRtl: boolean;
}

export function HubTabBar({ tabs, active, onChange, isRtl }: HubTabBarProps) {
  return (
    <View className={`flex-row gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => !tab.disabled && onChange(tab.key)}
            className={`px-4 py-2 rounded-full border ${
              isActive ? "bg-white border-white" : "border-white/50 opacity-60"
            }`}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive, disabled: !!tab.disabled }}
          >
            <Text
              className={`text-sm font-semibold ${
                isActive ? "text-foreground" : "text-white"
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── HubHero ──────────────────────────────────────────────────────────────────

export interface HubHeroProps {
  /** i18n key for the home breadcrumb label (always "tabs.home") */
  homeLabelKey: string;
  /** Translated label shown as the trailing breadcrumb segment */
  trailingBreadcrumbLabel: string;
  /** Hero title text */
  title: string;
  /** Translated t() function */
  t: (key: string) => string;
  isRtl: boolean;
  /** Tab bar rendered inside the hero */
  tabBarSlot: React.ReactNode;
  /** Search box rendered centered at the bottom of the hero */
  searchSlot: React.ReactNode;
}

export function HubHero({
  homeLabelKey,
  trailingBreadcrumbLabel,
  title,
  t,
  isRtl,
  tabBarSlot,
  searchSlot,
}: HubHeroProps) {
  const colors = useColors();

  return (
    <GradientView
      colors={[brand.turquoise, brand.prussian]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ paddingTop: 40, paddingBottom: 32, paddingHorizontal: 16 }}
    >
      {/* No breadcrumb: these are bottom-tab root screens (you're already on the
          page), so a "Home › X" trail is redundant. Title leads directly. */}

      {/* Title */}
      <Heading
        size="xl"
        className="font-bold mb-4"
        style={{
          color: colors.onOverlay,
          textAlign: isRtl ? "right" : "left",
        }}
      >
        {title}
      </Heading>

      {/* Tabs slot */}
      {tabBarSlot}

      {/* Search slot */}
      <View className="mt-5" style={{ alignItems: "center" }}>
        {searchSlot}
      </View>
    </GradientView>
  );
}
