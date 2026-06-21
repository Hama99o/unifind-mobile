/**
 * BookingSessionCard — shows offering title, image, price, specialist,
 * time (Beirut TZ), mode, duration, meeting link.
 * Mirrors UFBookingSessionCard.
 *
 * Date/time safety: the Node API returns values in two shapes depending on
 * the endpoint used:
 *   - getById (checkout):  startTime/endTime = "02:30 PM" (pre-formatted Beirut string),
 *                          date = "YYYY-MM-DD" (raw date string)
 *   - getDetails (detail): booking.start/end = ISO or "HH:mm" raw, date = "YYYY-MM-DD"
 *
 * We detect which shape we have and avoid double-formatting:
 *   - time: if value already matches AM/PM pattern, render as-is; otherwise format via Intl.
 *   - date: if value matches YYYY-MM-DD, parse as local noon (avoids UTC off-by-one);
 *           if already a display string (non-parseable / non-ISO), render as-is.
 */

import { View, Image, Pressable, Linking } from "react-native";
import { User, Clock, Users, Hourglass, Link } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useLocalization } from "@/hooks/useLocalization";
import { useColors } from "@/hooks/useColors";
import { getModeLabel } from "@/config/offeringModes";

/** Regex: already-formatted 12-hour clock string, e.g. "02:30 PM" or "2:00 AM" */
const AM_PM_RE = /^\d{1,2}:\d{2}\s*(AM|PM)$/i;
/** Regex: raw 24-hour HH:mm, e.g. "14:30" */
const HH_MM_RE = /^\d{1,2}:\d{2}$/;
/** Regex: YYYY-MM-DD date, e.g. "2025-06-15" */
const YYYYMMDD_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface SessionData {
  title: string;
  imageUrl?: string;
  meetingLink?: string;
  originalPrice: string;
  discountedPrice: string;
  currency: string;
  specialist: string;
  date: string;
  startTime: string;
  endTime: string;
  sessionType: string;
  duration: string;
}

export function BookingSessionCard({ session }: { session: SessionData }) {
  const { t } = useCustomTranslation();
  // M4 fix: was hardcoded English MODE_LABELS; now uses canonical i18n getModeLabel
  const { formatDate, formatTime, formatCurrency } = useLocalization();

  /** Map currency symbol to ISO code for formatCurrency */
  const currencyCode = (symbol: string): "USD" | "LBP" => {
    if (symbol === "ل.ل" || symbol === "LBP") return "LBP";
    return "USD";
  };
  const colors = useColors();

  const showDiscount =
    session.discountedPrice && session.discountedPrice !== "0" && session.discountedPrice !== session.originalPrice;

  /**
   * Safely format a time value:
   * - Already "HH:MM AM/PM" → pass through unchanged.
   * - Raw "HH:mm" (24h) → build a throwaway Date for today at that time and format 12h.
   * - ISO string or epoch → format via Intl (formatTime).
   * - Anything else that fails to parse → return as-is.
   */
  const safeFormatTime = (value: string): string => {
    if (!value) return "";
    if (AM_PM_RE.test(value.trim())) return value.trim();
    if (HH_MM_RE.test(value.trim())) {
      const [h, m] = value.trim().split(":").map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      try { return formatTime(d); } catch { return value; }
    }
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return value;
      return formatTime(d);
    } catch {
      return value;
    }
  };

  /**
   * Safely format a date value:
   * - "YYYY-MM-DD" → parse as local noon to avoid UTC midnight off-by-one, then format.
   * - ISO datetime string → parse and format.
   * - Anything unparseable → render as-is (assume already display-formatted).
   */
  const safeFormatDate = (value: string): string => {
    if (!value) return "";
    if (YYYYMMDD_RE.test(value.trim())) {
      const [y, mo, d] = value.trim().split("-").map(Number);
      const date = new Date(y, mo - 1, d, 12, 0, 0);
      try { return formatDate(date); } catch { return value; }
    }
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return value;
      return formatDate(d);
    } catch {
      return value;
    }
  };

  const displayDate = safeFormatDate(session.date);
  const displayStart = safeFormatTime(session.startTime);
  const displayEnd = safeFormatTime(session.endTime);
  const timeString = `${displayDate} | ${displayStart} – ${displayEnd}`;

  const modeLabel = getModeLabel(session.sessionType, t);
  const hasMeetingLink = session.meetingLink && session.meetingLink !== "#";

  const metaItems = [
    { icon: User, label: t("bookingDetail.specialist"), value: session.specialist },
    { icon: Clock, label: `${t("bookingDetail.time")} (${t("bookingDetail.beirutTime")})`, value: timeString },
    { icon: Users, label: t("bookingDetail.mode"), value: modeLabel },
    { icon: Hourglass, label: t("bookingDetail.duration"), value: session.duration },
  ];

  return (
    <View className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Image */}
      {session.imageUrl ? (
        <Image
          source={{ uri: session.imageUrl }}
          style={{ width: "100%", height: 120 }}
          resizeMode="cover"
        />
      ) : null}

      <View className="p-4 gap-3">
        {/* Title + price */}
        <View className="flex-row items-start justify-between gap-2">
          <Heading size="sm" className="text-foreground flex-1" numberOfLines={3}>
            {session.title}
          </Heading>
          <View className="items-end">
            {showDiscount && (
              <Text
                style={{
                  fontSize: 12,
                  textDecorationLine: "line-through",
                  color: colors.mutedForeground,
                }}
              >
                {formatCurrency(Number(session.originalPrice), currencyCode(session.currency))}
              </Text>
            )}
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: colors.foreground,
              }}
            >
              {formatCurrency(
                Number(showDiscount ? session.discountedPrice : session.originalPrice),
                currencyCode(session.currency)
              )}
            </Text>
          </View>
        </View>

        {/* Meeting link */}
        {hasMeetingLink && (
          <Pressable
            onPress={() => Linking.openURL(session.meetingLink!)}
            className="flex-row items-center gap-1"
          >
            <Link size={14} color={colors.primary} />
            <Text
              style={{ color: colors.primary, fontSize: 13, textDecorationLine: "underline" }}
              numberOfLines={1}
            >
              {session.meetingLink}
            </Text>
          </Pressable>
        )}

        {/* Meta items */}
        <View className="gap-3">
          {metaItems.map((item) =>
            item.value ? (
              <View key={item.label} className="flex-row items-center gap-2">
                <item.icon size={15} color={colors.mutedForeground} />
                <View>
                  <Text className="text-xs text-muted-foreground">{item.label}</Text>
                  <Text className="text-sm text-foreground font-medium">{item.value}</Text>
                </View>
              </View>
            ) : null
          )}
        </View>
      </View>
    </View>
  );
}
