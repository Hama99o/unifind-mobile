/**
 * ActivityTab — RQ-01: my reviews as an infinite React Query list.
 * Regression: "load more" never ran past page 1 (busy flag set before the call).
 */

import { renderWithProviders, screen, fireEvent, waitFor } from "@/test-utils/renderWithProviders";
import { ActivityTab } from "@/screens/profile/tabs/ActivityTab";
import { reviewsApi } from "@/api/reviewsApi";
import { useAuthStore } from "@/stores/authStore";

jest.mock("@/api/reviewsApi", () => ({
  ...jest.requireActual("@/api/reviewsApi"),
  reviewsApi: { getUserReviews: jest.fn(), normalizeReview: jest.fn(), deleteReview: jest.fn() },
}));
const getUserReviews = reviewsApi.getUserReviews as jest.Mock;
const normalize = reviewsApi.normalizeReview as jest.Mock;

const review = (id: string) => ({
  id,
  targetType: "Program",
  generalRating: 4,
  comment: "",
  targetName: `name ${id}`,
  experience: "",
  studyPeriod: "",
  ratings: [],
  date: "2026-11-01",
});

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ user: { userID: "u1" } as never });
  getUserReviews.mockImplementation(async (page: number) => ({
    data: [{ _id: `r${page}` }],
    totalPages: 2,
  }));
  normalize.mockImplementation(async (raw: { _id: string }) => review(raw._id));
});

describe("ActivityTab", () => {
  it("loads page 1 and then page 2 when scrolled to the bottom", async () => {
    renderWithProviders(<ActivityTab />);
    await waitFor(() => expect(getUserReviews).toHaveBeenCalledWith(1, expect.any(Number)));
    expect(await screen.findByText("name r1")).toBeTruthy();
    const scroll = screen.UNSAFE_getByType(require("react-native").ScrollView);
    fireEvent.scroll(scroll, {
      nativeEvent: {
        layoutMeasurement: { height: 800 },
        contentOffset: { y: 400 },
        contentSize: { height: 1200 },
      },
    });
    await waitFor(() => expect(getUserReviews).toHaveBeenCalledWith(2, expect.any(Number)));
  });
});
