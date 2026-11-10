/**
 * BookingDetailScreen — RQ-01: loads through useAsyncResource (React Query).
 */

import { renderWithProviders, screen, fireEvent, waitFor } from "@/test-utils/renderWithProviders";
import BookingDetailScreen from "@/screens/booking/BookingDetailScreen";
import { bookingsApi } from "@/api/bookingsApi";

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ bookingReference: "BK-1" }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  router: { push: jest.fn(), back: jest.fn() },
  usePathname: () => "/booking/BK-1",
}));
jest.mock("@/api/bookingsApi", () => ({
  ...jest.requireActual("@/api/bookingsApi"),
  bookingsApi: { getDetails: jest.fn(), getOfferingImageUrl: jest.fn() },
}));

const getDetails = bookingsApi.getDetails as jest.Mock;
const getImage = bookingsApi.getOfferingImageUrl as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe("BookingDetailScreen", () => {
  it("shows the error state and retries the load", async () => {
    getDetails.mockRejectedValue(new Error("network"));
    renderWithProviders(<BookingDetailScreen />);
    expect(await screen.findByText("profileLoadError")).toBeTruthy();
    expect(getDetails).toHaveBeenCalledWith("BK-1");
    fireEvent.press(screen.getByText("common.retry"));
    await waitFor(() => expect(getDetails).toHaveBeenCalledTimes(2));
  });

  it("fetches the offering image once the booking is loaded", async () => {
    getDetails.mockResolvedValue({ offering: { offeringContentId: "9" } });
    getImage.mockResolvedValue("https://img/9.png");
    renderWithProviders(<BookingDetailScreen />);
    await waitFor(() => expect(getImage).toHaveBeenCalledWith("9"));
  });
});
