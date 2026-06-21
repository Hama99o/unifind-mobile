/**
 * PromoBlock — promo code apply / active-banner / remove behaviour.
 *
 * promoCodeApi is transport over the globally-mocked nodeApi:
 *   apply  → POST /promocode → returns the AppliedPromo payload as `data`
 *   remove → DELETE /promocode → returns { success, data: { finalPrice } }
 *
 * The remove flow goes through confirmAlert(), which is a no-op unless an
 * AlertDialogHost has registered its show fn. We register our own show fn via
 * _registerAlertDialogShow that immediately invokes the destructive action's
 * onPress — so we can drive the confirm path deterministically without mounting
 * the host Modal.
 *
 * t() returns the key string; the mocked useLocalization formats USD as
 * `$${v.toFixed(2)}`.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { nodeApi } from "@/api/nodeApi";
import { _registerAlertDialogShow, type AlertAction } from "@/components/ui/alert-dialog";
import { PromoBlock } from "@/screens/checkout/PromoBlock";
import type { CheckoutBooking } from "@/api/bookingsApi";

const BOOKING: CheckoutBooking = {
  _id: "mongo-booking-1",
  bookingReference: "UF-2025-00001",
  offeringId: { _id: "mongo-offering-1", offeringContentId: "off-9", title: "Session" },
  specialistId: { name: "Dr. Layla" },
  eventTypeId: { basePrice: 100, discountedPrice: 80, durationMinutes: 45, mode: "online" },
  currency: { symbol: "$", code: "USD" },
  finalPrice: 80,
  appliedPromoCode: null,
  startTime: "02:30 PM",
  endTime: "03:15 PM",
  date: "2025-07-01",
  pricing: { originalPrice: 100, discountAmount: 0, finalPrice: 80 },
};

describe("PromoBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the promo input form when no promo is active", () => {
    render(
      <PromoBlock
        booking={BOOKING}
        bookingRef="UF-2025-00001"
        localPromo={null}
        onPromoApplied={jest.fn()}
        onPromoRemoved={jest.fn()}
      />
    );
    expect(screen.getByText("promo_code")).toBeTruthy();
    expect(screen.getByText("apply_code")).toBeTruthy();
  });

  it("applies a valid promo code → calls promoCodeApi.apply and onPromoApplied", async () => {
    const onPromoApplied = jest.fn();
    (nodeApi.post as jest.Mock).mockResolvedValueOnce({
      data: {
        success: true,
        discountAmount: 20,
        finalAmount: 60,
        currency: { symbol: "$" },
        promoCode: "SAVE20",
        message: "Applied",
      },
    });

    render(
      <PromoBlock
        booking={BOOKING}
        bookingRef="UF-2025-00001"
        localPromo={null}
        onPromoApplied={onPromoApplied}
        onPromoRemoved={jest.fn()}
      />
    );

    fireEvent.changeText(screen.getByPlaceholderText("apply_here"), "save20");
    fireEvent.press(screen.getByText("apply_code"));

    await waitFor(() =>
      expect(nodeApi.post as jest.Mock).toHaveBeenCalledWith(
        "/promocode",
        // promoCode is trimmed; offeringId is the mongo _id; bookingId is booking._id
        { promoCode: "save20", offeringId: "mongo-offering-1", bookingId: "mongo-booking-1" }
      )
    );
    await waitFor(() =>
      expect(onPromoApplied).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, promoCode: "SAVE20" })
      )
    );
  });

  it("shows an inline error when the promo code is invalid", async () => {
    (nodeApi.post as jest.Mock).mockResolvedValueOnce({
      data: { success: false, message: "Expired code" },
    });

    render(
      <PromoBlock
        booking={BOOKING}
        bookingRef="UF-2025-00001"
        localPromo={null}
        onPromoApplied={jest.fn()}
        onPromoRemoved={jest.fn()}
      />
    );

    fireEvent.changeText(screen.getByPlaceholderText("apply_here"), "BAD");
    fireEvent.press(screen.getByText("apply_code"));

    await waitFor(() => expect(screen.getByText("Expired code")).toBeTruthy());
  });

  it("renders the active-promo banner from a localPromo and shows the formatted discount", () => {
    render(
      <PromoBlock
        booking={BOOKING}
        bookingRef="UF-2025-00001"
        localPromo={{
          success: true,
          discountAmount: 25,
          finalAmount: 55,
          currency: { symbol: "$" },
          promoCode: "WELCOME",
          message: "ok",
        }}
        onPromoApplied={jest.fn()}
        onPromoRemoved={jest.fn()}
      />
    );
    // Active banner: promo label + code chip + formatted discount "-$25.00"
    expect(screen.getByText("promo")).toBeTruthy();
    expect(screen.getByText("WELCOME")).toBeTruthy();
    expect(screen.getByText("-$25.00")).toBeTruthy();
  });

  it("removing an active promo (via confirm) calls promoCodeApi.remove and onPromoRemoved", async () => {
    // Register a show fn that auto-fires the destructive action's onPress.
    _registerAlertDialogShow(({ actions }: { actions?: AlertAction[] }) => {
      const destructive = actions?.find((a) => a.style === "destructive");
      destructive?.onPress?.();
    });

    const onPromoRemoved = jest.fn();
    (nodeApi.delete as jest.Mock).mockResolvedValueOnce({
      data: { success: true, message: "removed", data: { bookingReference: "UF-2025-00001", finalPrice: 80 } },
    });

    render(
      <PromoBlock
        booking={BOOKING}
        bookingRef="UF-2025-00001"
        localPromo={{
          success: true,
          discountAmount: 25,
          finalAmount: 55,
          currency: { symbol: "$" },
          promoCode: "WELCOME",
          message: "ok",
        }}
        onPromoApplied={jest.fn()}
        onPromoRemoved={onPromoRemoved}
      />
    );

    // Press the Trash2 remove pressable (accessibilityLabel = removePromo key).
    fireEvent.press(screen.getByLabelText("removePromo"));

    await waitFor(() =>
      expect(nodeApi.delete as jest.Mock).toHaveBeenCalledWith(
        "/promocode",
        { data: { bookingReference: "UF-2025-00001" } }
      )
    );
    await waitFor(() => expect(onPromoRemoved).toHaveBeenCalledWith(80));
  });
});
