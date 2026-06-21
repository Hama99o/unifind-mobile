/**
 * BookingsTab — Profile > Bookings tab.
 *
 * bookingsApi.getByUser → nodeApi.get('/booking/by-user'). The default global
 * mock resolves { data: {} } so res.data.success is falsy → [] → empty state
 * (bookings.empty). We feed a success payload to render rows.
 *
 * Navigation uses useRouter().push. The global expo-router mock returns FRESH
 * fns each render, so we override useRouter via jest.spyOn to inject a stable
 * push spy for the navigation assertions.
 *
 * t() returns key strings; useLocalization formats USD as `$${v.toFixed(2)}`.
 */

// lucide-react-native is run through the real transform (not mocked globally),
// and its icons render react-native-svg primitives. The global jest.setup svg
// mock only exports a SUBSET of primitives — notably it lacks `Polyline`, which
// the `Inbox` icon used by <EmptyState> renders. Hitting the undefined `Polyline`
// throws inside <Svg> and tears down the tree ("Unable to find node on an
// unmounted component"), which broke the empty-state assertion here (the data-row
// tests dodged it because they never render <EmptyState>). Icons carry no
// assertable text, so render them as inert nodes. This mirrors the shim in
// FindInstitutionsScreen.test.tsx / UniversalList.test.tsx and is a
// test-environment fix, not a change to app behaviour.
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

import { renderWithProviders, screen, fireEvent, waitFor } from "@/test-utils/renderWithProviders";
import { nodeApi } from "@/api/nodeApi";
import { BookingsTab } from "@/screens/profile/tabs/BookingsTab";

const r = require("expo-router");

const SUCCESS = (rows: unknown[]) => ({ data: { success: true, data: rows } });

describe("BookingsTab", () => {
  let push: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    push = jest.fn();
    jest.spyOn(r, "useRouter").mockReturnValue({ push, replace: jest.fn(), back: jest.fn() });
    (nodeApi.get as jest.Mock).mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows the empty state when the user has no bookings", async () => {
    renderWithProviders(<BookingsTab />);
    await waitFor(() => expect(screen.getByText("bookings.empty")).toBeTruthy());
    expect(screen.getByText("bookings.emptyDesc")).toBeTruthy();
  });

  it("renders a booking row with reference, formatted amount and status", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce(
      SUCCESS([
        { _id: "m1", bookingReference: "UF-2025-00001", date: "2025-07-01", price: 80, status: "completed" },
      ])
    );
    renderWithProviders(<BookingsTab />);
    await waitFor(() => expect(screen.getByText("UF-2025-00001")).toBeTruthy());
    // capitalizeStatus("completed") → "Completed" rendered by StatusPill.
    expect(screen.getByText("Completed")).toBeTruthy();
    // formatCurrency(80, "USD") → "$80.00".
    expect(screen.getByText("$80.00")).toBeTruthy();
  });

  it("View Details navigates to the booking detail route", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce(
      SUCCESS([
        { _id: "m1", bookingReference: "UF-2025-00001", date: "2025-07-01", price: 80, status: "scheduled" },
      ])
    );
    renderWithProviders(<BookingsTab />);
    await waitFor(() => expect(screen.getByText("UF-2025-00001")).toBeTruthy());

    fireEvent.press(screen.getByText("bookings.viewDetails"));
    expect(push).toHaveBeenCalledWith("/(main)/booking/UF-2025-00001");
  });

  it("Review is disabled (no navigation) when the booking is not Completed", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce(
      SUCCESS([
        { _id: "m1", bookingReference: "UF-2025-00002", date: "2025-07-02", price: 50, status: "scheduled" },
      ])
    );
    renderWithProviders(<BookingsTab />);
    await waitFor(() => expect(screen.getByText("UF-2025-00002")).toBeTruthy());

    // Pressing the disabled Review button must not navigate.
    fireEvent.press(screen.getByText("bookings.review"));
    const reviewNav = push.mock.calls.some((c) => String(c[0]).includes("anchor="));
    expect(reviewNav).toBe(false);
  });

  it("Review navigates with the review anchor when the booking is Completed", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce(
      SUCCESS([
        { _id: "m1", bookingReference: "UF-2025-00003", date: "2025-07-03", price: 50, status: "completed" },
      ])
    );
    renderWithProviders(<BookingsTab />);
    await waitFor(() => expect(screen.getByText("UF-2025-00003")).toBeTruthy());

    fireEvent.press(screen.getByText("bookings.review"));
    expect(push).toHaveBeenCalledWith("/(main)/booking/UF-2025-00003?anchor=offeringReviewsID");
  });
});
