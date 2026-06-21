/**
 * OfferingCheckoutScreen — full checkout flow integration test.
 *
 * The screen reads `id` (= bookingReference) from useLocalSearchParams. The global
 * expo-router mock returns {} (so bookingRef = "" and the load() early-returns,
 * leaving loading=true forever). We therefore override useLocalSearchParams per
 * test via jest.spyOn to inject a real bookingReference.
 *
 * nodeApi is globally mocked; we drive it with a URL-routing mockImplementation:
 *   GET /booking/payment-status/:ref  → bookingsApi.getPaymentStatus
 *   GET /booking/:ref                 → bookingsApi.getById (flat checkout shape)
 *   POST /webhook/payment/whish/url   → paymentApi.getWhishUrl
 *   GET /compares/* , /favorites/*    → not used here
 * http (Strapi) is used for the offering image; default {} → empty image is fine.
 *
 * Auth state lives in the real (unmocked) Zustand authStore — we set it directly.
 * t() returns the translation key string, so we assert on keys.
 */

import { renderWithProviders, screen, fireEvent, waitFor } from "@/test-utils/renderWithProviders";
import { nodeApi } from "@/api/nodeApi";
import { http } from "@/api/http";
import { useAuthStore } from "@/stores/authStore";
import { useSignInSheetStore } from "@/auth/signInSheetStore";
import { useToastStore } from "@/stores/toastStore";
import OfferingCheckoutScreen from "@/screens/checkout/OfferingCheckoutScreen";

// lucide-react-native renders real SVG icons through the globally-mocked
// react-native-svg (jest.setup.ts). That mock only exports a subset of SVG
// primitives — notably it has NO `Polyline`, which icons like `Inbox`
// (EmptyState) and `Clock` (BookingSessionCard meta row) use. The missing
// primitive resolves to `undefined`, crashing those icons' render with
// "Element type is invalid". We stub every icon to a harmless host element so
// the screen's real behaviour (data load, render, press handlers) is what we
// assert. Mirrors the existing pattern in FindInstitutionsScreen/BookingsTab tests.
jest.mock("lucide-react-native", () => {
  const React = require("react");
  return new Proxy(
    {},
    {
      get: () => (props: Record<string, unknown>) =>
        React.createElement("Icon", props),
    }
  );
});

const r = require("expo-router");

const BOOKING_REF = "UF-2025-00001";

const FLAT_BOOKING = {
  _id: "mongo-booking-1",
  bookingReference: BOOKING_REF,
  offeringId: {
    _id: "mongo-offering-1",
    offeringContentId: "off-content-9",
    title: "Career Coaching Session",
  },
  specialistId: { name: "Dr. Layla" },
  eventTypeId: {
    basePrice: 100,
    discountedPrice: 80,
    durationMinutes: 45,
    mode: "online",
  },
  currency: { symbol: "$", code: "USD" },
  finalPrice: 80,
  appliedPromoCode: null,
  startTime: "02:30 PM",
  endTime: "03:15 PM",
  date: "2025-07-01",
  pricing: { originalPrice: 100, discountAmount: 0, finalPrice: 80 },
};

/** Login the real authStore so the screen passes its auth gate. */
function login() {
  useAuthStore.setState({
    isLoggedIn: true,
    isBootstrapping: false,
    accessToken: "tok",
    user: { sub: "auth0|abc", userID: "abc", name: "Test" },
  });
}

function logout() {
  useAuthStore.setState({
    isLoggedIn: false,
    isBootstrapping: false,
    accessToken: null,
    user: null,
  });
}

/**
 * Route nodeApi.get by URL. paymentStatus controls the payment-status response;
 * the flat booking is returned for the bare /booking/:ref endpoint.
 */
function routeNodeGet(paymentStatus: string, booking: unknown = FLAT_BOOKING) {
  (nodeApi.get as jest.Mock).mockImplementation((url: string) => {
    if (url.includes("/booking/payment-status/")) {
      return Promise.resolve({ data: { data: { paymentStatus } } });
    }
    if (url.startsWith(`/booking/${BOOKING_REF}`)) {
      return Promise.resolve({ data: { success: true, data: booking } });
    }
    return Promise.resolve({ data: {} });
  });
}

describe("OfferingCheckoutScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset cross-test global state.
    useSignInSheetStore.setState({ isOpen: false });
    useToastStore.setState({ message: null, seq: 0 });
    // Default route param: a valid booking reference.
    jest.spyOn(r, "useLocalSearchParams").mockReturnValue({ id: BOOKING_REF });
    // Reset to a benign default each test (clearAllMocks keeps prior implementations).
    (nodeApi.get as jest.Mock).mockResolvedValue({ data: {} });
    (nodeApi.post as jest.Mock).mockResolvedValue({ data: {} });
    // Strapi image lookup → empty (no image).
    (http.get as jest.Mock).mockResolvedValue({ data: { data: [] } });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows the sign-in-required state and opens the sheet when logged out", async () => {
    logout();
    renderWithProviders(<OfferingCheckoutScreen />);
    // EmptyState title key + description key are rendered.
    expect(await screen.findByText("signInRequired")).toBeTruthy();
    expect(screen.getByText("signInDescription")).toBeTruthy();
    // The auth-gate effect opens the global sign-in sheet.
    await waitFor(() => expect(useSignInSheetStore.getState().isOpen).toBe(true));
  });

  it("renders the checkout summary, notes, promo input and pay button when unpaid", async () => {
    login();
    routeNodeGet("unpaid");
    renderWithProviders(<OfferingCheckoutScreen />);

    // Pay Now button (testID) confirms the main checkout UI mounted.
    await waitFor(() => expect(screen.getByTestId("checkout-pay-now")).toBeTruthy());
    // Session summary surfaces the offering title + specialist.
    expect(screen.getByText("Career Coaching Session")).toBeTruthy();
    expect(screen.getByText("Dr. Layla")).toBeTruthy();
    // Promo input form shows the apply button (no promo active yet).
    expect(screen.getByText("apply_code")).toBeTruthy();
    // Price breakdown total label.
    expect(screen.getByText("total")).toBeTruthy();
  });

  it("shows the already-paid state when payment status is 'paid'", async () => {
    login();
    routeNodeGet("paid");
    renderWithProviders(<OfferingCheckoutScreen />);
    // EmptyState-pattern already-paid copy + go-to-bookings CTA.
    await waitFor(() => expect(screen.getByText("alreadyPaid")).toBeTruthy());
    expect(screen.getByText("alreadyPaidDesc")).toBeTruthy();
    expect(screen.getByText("goToBookings")).toBeTruthy();
    // getById should NOT be called once payment-status short-circuits to paid.
    const calledBare = (nodeApi.get as jest.Mock).mock.calls.some(
      (c) => c[0] === `/booking/${BOOKING_REF}`
    );
    expect(calledBare).toBe(false);
  });

  it("shows the error/notFound state when the booking fetch throws", async () => {
    login();
    (nodeApi.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/booking/payment-status/")) {
        return Promise.resolve({ data: { data: { paymentStatus: "unpaid" } } });
      }
      // getById rejects → screen sets error = profileLoadError.
      return Promise.reject(new Error("boom"));
    });
    renderWithProviders(<OfferingCheckoutScreen />);
    await waitFor(() => expect(screen.getByText("profileLoadError")).toBeTruthy());
    // Retry button present.
    expect(screen.getByText("common.retry")).toBeTruthy();
  });

  it("pressing Pay Now initiates the Whish payment via paymentApi", async () => {
    login();
    routeNodeGet("unpaid");
    // paymentApi.getWhishUrl posts to /webhook/payment/whish/url and unwraps the URL.
    (nodeApi.post as jest.Mock).mockResolvedValue({
      data: { success: true, paymentId: "pay-1", data: { data: { collectUrl: "https://whish.test/collect/1" } } },
    });

    renderWithProviders(<OfferingCheckoutScreen />);
    const payBtn = await screen.findByTestId("checkout-pay-now");
    fireEvent.press(payBtn);

    await waitFor(() =>
      expect(nodeApi.post as jest.Mock).toHaveBeenCalledWith(
        "/webhook/payment/whish/url",
        expect.objectContaining({ bookingReference: BOOKING_REF, notes: "" })
      )
    );
  });

  it("surfaces a toast when Whish payment initiation fails", async () => {
    login();
    routeNodeGet("unpaid");
    // Backend returns success:false → paymentApi.getWhishUrl throws → toast shown.
    (nodeApi.post as jest.Mock).mockResolvedValue({ data: { success: false } });

    renderWithProviders(<OfferingCheckoutScreen />);
    const payBtn = await screen.findByTestId("checkout-pay-now");
    fireEvent.press(payBtn);

    await waitFor(() =>
      expect(useToastStore.getState().message).toBeTruthy()
    );
  });
});
