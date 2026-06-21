/**
 * BackgroundCard — shared card for academic and professional experience entries.
 *
 * Extracted from the inline rendering patterns in AcademicBackgroundTab and
 * ProfessionalBackgroundTab (Batch F will swap those call sites to use this).
 *
 * Props:
 *   icon        — Lucide icon component; rendered inside an IconCircle (bg-lightgreen)
 *   title       — primary line (institution / company name)
 *   subtitle    — secondary line (degree / role)
 *   dateStr     — formatted date range string (caller is responsible for formatting)
 *   description — optional body text (shown when present)
 *   onEdit      — callback for the edit action; renders pencil icon button
 *   onDelete    — callback for the delete action; renders trash icon button
 *
 * Visual contract:
 *   bg-card rounded-2xl border border-border p-4
 *   icon circle: bg-lightgreen (IconCircle)
 *   edit/delete: usePressScale + hitSlop={12} for ≥44px touch target
 *
 * RTL-safe: flex-row reverses to flex-row-reverse when isRtl.
 * Gluestack only; no hex; no text-typography-*.
 */

import React from "react";
import { View, Pressable } from "react-native";
import Animated from "react-native-reanimated";
import { Pencil, Trash2 } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { IconCircle } from "@/components/shared/IconCircle";
import { usePressScale } from "@/hooks/usePressScale";
import { useColors } from "@/hooks/useColors";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";

export interface BackgroundCardProps {
  /** Lucide icon component rendered in the bg-lightgreen circle */
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  subtitle?: string;
  /** Pre-formatted date range string, e.g. "Sep 2020 – Jun 2024" */
  dateStr?: string;
  description?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

// ─── Icon action button ───────────────────────────────────────────────────────

function ActionIconButton({
  onPress,
  icon: Icon,
  color,
  accessibilityLabel,
}: {
  onPress: () => void;
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
  accessibilityLabel: string;
}) {
  const { animStyle, handlePressIn, handlePressOut } = usePressScale();

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        hitSlop={12}
        className="p-1"
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <Icon size={18} color={color} />
      </Pressable>
    </Animated.View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BackgroundCard({
  icon: Icon,
  title,
  subtitle,
  dateStr,
  description,
  onEdit,
  onDelete,
}: BackgroundCardProps) {
  const colors = useColors();
  const { isRtl, t } = useCustomTranslation();

  return (
    <View className="bg-card rounded-2xl border border-border p-4">
      <View className={`flex-row items-start gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
        {/* Icon circle */}
        <IconCircle size={40}>
          <Icon size={20} color={colors.primary} />
        </IconCircle>

        {/* Content */}
        <View className="flex-1">
          <Text
            className={`text-sm font-semibold text-foreground ${isRtl ? "text-right" : ""}`}
            numberOfLines={2}
          >
            {title}
          </Text>

          {subtitle ? (
            <Text
              className={`text-sm text-muted-foreground mt-0.5 ${isRtl ? "text-right" : ""}`}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}

          {dateStr ? (
            <Text
              className={`text-xs text-muted-foreground mt-1 ${isRtl ? "text-right" : ""}`}
            >
              {dateStr}
            </Text>
          ) : null}

          {description ? (
            <Text
              className={`text-sm text-foreground mt-2 leading-relaxed ${isRtl ? "text-right" : ""}`}
            >
              {description}
            </Text>
          ) : null}
        </View>

        {/* Action buttons */}
        {(onEdit || onDelete) && (
          <View className={`flex-row gap-1 ${isRtl ? "flex-row-reverse" : ""}`}>
            {onEdit && (
              <ActionIconButton
                onPress={onEdit}
                icon={Pencil}
                color={colors.primary}
                accessibilityLabel={t("common.edit")}
              />
            )}
            {onDelete && (
              <ActionIconButton
                onPress={onDelete}
                icon={Trash2}
                color={colors.destructive}
                accessibilityLabel={t("common.delete")}
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
}
