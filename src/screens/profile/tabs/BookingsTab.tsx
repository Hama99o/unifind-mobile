/**
 * BookingsTab — Profile > Bookings tab.
 *
 * Table: GET {Node}/booking/by-user
 * Columns: Booking ID, Date, Amount (formatCurrency), Status (StatusPill), Actions.
 *
 * §2: formatCurrency(amount, 'USD') from useLocalization — no more `$${displayAmount}`.
 * §2: Button size='sm' (no h-9 className override).
 * §2: disabled Review → variant='outline' action='secondary'.
 *
 * Actions:
 *   "View Details" (always) → navigate to booking detail screen.
 *   "Review" (enabled only when status = Completed) → navigate with anchor.
 */

import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { AsyncBoundary } from "@/components/shared/AsyncBoundary";
import { StatusPill } from "@/components/shared/StatusPill";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useLocalization } from "@/hooks/useLocalization";
import { useAsyncResource } from "@/hooks/useAsyncResource";
import { bookingsApi, type BookingListItem } from "@/api/bookingsApi";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function RowSkeleton() {
  return (
    <View className="bg-card rounded-2xl border border-border p-4 mb-3 gap-2">
      <Skeleton className="h-4 w-32 rounded bg-muted" />
      <Skeleton className="h-3 w-24 rounded bg-muted" />
      <Skeleton className="h-6 w-20 rounded-full bg-muted" />
      <View className="flex-row gap-2">
        <Skeleton className="flex-1 h-9 rounded-xl bg-muted" />
        <Skeleton className="flex-1 h-9 rounded-xl bg-muted" />
      </View>
    </View>
  );
}

// ─── Booking row card ─────────────────────────────────────────────────────────

function BookingRow({
  booking,
  onViewDetails,
  onReview,
}: {
  booking: BookingListItem;
  onViewDetails: () => void;
  onReview: () => void;
}) {
  const { t } = useCustomTranslation();
  const { formatDate, formatCurrency } = useLocalization();

  const displayDate = booking.date ? formatDate(booking.date) : "-";
  const isCompleted = booking.status === "Completed";

  return (
    <View className="bg-card rounded-2xl border border-border p-4 mb-3 gap-3">
      {/* Reference + date */}
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="text-xs text-muted-foreground">{t("bookings.id")}</Text>
          <Text className="text-sm font-bold text-foreground">{booking.bookingReference}</Text>
        </View>
        <View className="items-end">
          <Text className="text-xs text-muted-foreground">{t("bookings.date")}</Text>
          <Text className="text-sm text-foreground">{displayDate}</Text>
        </View>
      </View>

      {/* Amount + status */}
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-xs text-muted-foreground">{t("bookings.amount")}</Text>
          {/* §2: formatCurrency from useLocalization (display-correctness) */}
          <Text className="text-sm font-semibold text-foreground">
            {formatCurrency(booking.amount, "USD")}
          </Text>
        </View>
        <StatusPill status={booking.status} />
      </View>

      {/* Actions — §2: disabled Review → variant='outline' action='secondary' */}
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button
            label={t("bookings.viewDetails")}
            action="primary"
            onPress={onViewDetails}
          />
        </View>
        <View className="flex-1">
          <Button
            label={t("bookings.review")}
            action={isCompleted ? "primary" : "secondary"}
            variant={isCompleted ? "solid" : "outline"}
            onPress={isCompleted ? onReview : undefined}
            disabled={!isCompleted}
          />
        </View>
      </View>
    </View>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export function BookingsTab() {
  const { t } = useCustomTranslation();
  const router = useRouter();

  const { data, loading, error, reload } = useAsyncResource<BookingListItem[]>(
    ["bookings"],
    async () => {
      try {
        return await bookingsApi.getByUser();
      } catch {
        throw new Error(t("profileLoadError"));
      }
    }
  );

  const bookings = data ?? [];

  const navigateToDetail = (bookingReference: string, anchor?: string) => {
    const path = anchor
      ? `/(main)/booking/${bookingReference}?anchor=${anchor}`
      : `/(main)/booking/${bookingReference}`;
    router.push(path as Parameters<typeof router.push>[0]);
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={bookings.length === 0}
        skeleton={
          <>
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </>
        }
        empty={
          <EmptyState
            title={t("bookings.empty")}
            description={t("bookings.emptyDesc")}
          />
        }
      >
        <>
          {bookings.map((booking) => (
            <BookingRow
              key={booking.bookingReference}
              booking={booking}
              onViewDetails={() => navigateToDetail(booking.bookingReference)}
              onReview={() => navigateToDetail(booking.bookingReference, "offeringReviewsID")}
            />
          ))}
        </>
      </AsyncBoundary>
    </ScrollView>
  );
}
