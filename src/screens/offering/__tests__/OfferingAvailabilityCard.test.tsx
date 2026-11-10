/**
 * OfferingAvailabilityCard — the payments switch (PAY-01) decides between the
 * "Book a Session" button and the coming-soon notice. Never a dead button.
 */

import { renderWithProviders, screen, fireEvent } from "@/test-utils/renderWithProviders";
import { OfferingAvailabilityCard } from "@/screens/offering/OfferingAvailabilityCard";

let mockPaymentsEnabled = false;
jest.mock("@/config/payments", () => ({
  get PAYMENTS_ENABLED() {
    return mockPaymentsEnabled;
  },
}));

const baseProps = {
  dates: [{ date: "2026-11-20", slotsCount: 2 }],
  datesLoading: false,
  selectedDateIndex: null,
  onSelectDate: jest.fn(),
  timeSlots: [],
  timesLoading: false,
  selectedSlot: null,
  onSelectSlot: jest.fn(),
  price: { basePrice: 45, finalPrice: 45, currency: "USD" },
  booking: false,
};

describe("OfferingAvailabilityCard — payments switch", () => {
  it("OFF (default): shows the notice, no book button", () => {
    mockPaymentsEnabled = false;
    const onBook = jest.fn();
    renderWithProviders(<OfferingAvailabilityCard {...baseProps} onBook={onBook} />);
    expect(screen.getByTestId("payments-unavailable")).toBeTruthy();
    expect(screen.queryByTestId("offering-book-session")).toBeNull();
  });

  it("ON: shows Book a Session and calls onBook", () => {
    mockPaymentsEnabled = true;
    const onBook = jest.fn();
    renderWithProviders(<OfferingAvailabilityCard {...baseProps} onBook={onBook} />);
    expect(screen.queryByTestId("payments-unavailable")).toBeNull();
    fireEvent.press(screen.getByTestId("offering-book-session"));
    expect(onBook).toHaveBeenCalledTimes(1);
  });
});
