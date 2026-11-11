/**
 * BookingReviewSection — leave-a-review form behaviour.
 *
 * On mount it calls reviewsApi.checkOfferingReviewed(offeringContentId), which is
 * transport over the globally-mocked nodeApi.get:
 *   - string response containing "cantreview" (whitespace-stripped) → already reviewed
 *   - array response → not reviewed (shows the form)
 * createReview() posts to /reviews; success message must be exactly
 * "Review created successfully" to trigger the reset + success toast.
 *
 * The form's star rows use local AnimatedStar Pressables (no accessibilityRole,
 * testID, or text). Under jest-expo, RN `Pressable` renders as a host `View`, so
 * UNSAFE_getAllByType(Pressable) finds nothing — instead we target every node that
 * carries an `onPress` handler. Render order of the onPress-bearing nodes:
 *   indexes 0-4   = General Rating stars (star 1..5)
 *   indexes 5-9   = Content Helpfulness
 *   indexes 10-14 = Specialist Rating
 *   indexes 15-19 = Recommend Offering
 *   index  20     = the Button composite (it forwards an onPress prop)
 *   index  21     = the Button's inner submit Pressable (the LAST node)
 *
 * t() returns the key string; toasts land in the real toastStore.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { nodeApi } from "@/api/nodeApi";
import { useToastStore } from "@/stores/toastStore";
import { BookingReviewSection } from "@/screens/booking/BookingReviewSection";

const PROPS = {
  offeringContentId: "off-content-9",
  specialistName: "Dr. Layla",
  eventTypeMode: "online",
};

/** Every node carrying an onPress handler, in render order (20 stars, then the
 * Button composite, then its inner submit Pressable). See the file header. */
function getPressableNodes() {
  return screen.root.findAll(
    (node: { props: unknown }) => typeof (node.props as { onPress?: unknown })?.onPress === "function"
  );
}

/** Set the checkOfferingReviewed result by routing the GET /reviews/user/offering call. */
function mockReviewedCheck(response: unknown) {
  (nodeApi.get as jest.Mock).mockImplementation((url: string) => {
    if (url.includes("/reviews/user/offering/")) {
      return Promise.resolve({ data: response });
    }
    return Promise.resolve({ data: {} });
  });
}

describe("BookingReviewSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useToastStore.setState({ message: null, seq: 0 });
  });

  it("renders the review form once the reviewed-check resolves to not-reviewed", async () => {
    mockReviewedCheck([]); // array = not reviewed
    render(<BookingReviewSection {...PROPS} />);
    await waitFor(() => expect(screen.getByText("review.leaveReview")).toBeTruthy());
    // Required rating labels are present.
    expect(screen.getByText("review.generalRating")).toBeTruthy();
    expect(screen.getByText("review.contentHelpfulness")).toBeTruthy();
    expect(screen.getByText("review.specialistRating")).toBeTruthy();
    // Submit button label.
    expect(screen.getByText("review.submit")).toBeTruthy();
  });

  it("shows the already-reviewed message when the offering was reviewed", async () => {
    // checkOfferingReviewed lowercases + strips whitespace then looks for the
    // literal substring "cantreview" — so use "Cant review" (no apostrophe, which
    // would break the match) so the stripped form contains "cantreview".
    mockReviewedCheck("You cant review this offering twice");
    render(<BookingReviewSection {...PROPS} />);
    await waitFor(() => expect(screen.getByText("review.alreadyReviewed")).toBeTruthy());
    // The form heading should NOT render in the already-reviewed branch.
    expect(screen.queryByText("review.leaveReview")).toBeNull();
  });

  it("blocks submit and shows a validation toast when required ratings are missing", async () => {
    mockReviewedCheck([]);
    render(<BookingReviewSection {...PROPS} />);
    await waitFor(() => expect(screen.getByText("review.submit")).toBeTruthy());

    // Press Submit with all ratings still 0.
    fireEvent.press(screen.getByText("review.submit"));

    await waitFor(() =>
      expect(useToastStore.getState().message).toBe("review.validationError")
    );
    // createReview (POST /reviews) must NOT have been called.
    const postedReview = (nodeApi.post as jest.Mock).mock.calls.some(
      (c) => c[0] === "/reviews"
    );
    expect(postedReview).toBe(false);
  });

  it("submits a valid review → calls reviewsApi.createReview and shows success", async () => {
    mockReviewedCheck([]);
    (nodeApi.post as jest.Mock).mockResolvedValueOnce({
      data: { message: "Review created successfully" },
    });

    render(<BookingReviewSection {...PROPS} />);
    await waitFor(() => expect(screen.getByText("review.submit")).toBeTruthy());

    const pressables = getPressableNodes();
    // Set all three required ratings to 5 (the 5th star = index 4 within each row).
    fireEvent.press(pressables[4]); // generalRating = 5
    fireEvent.press(pressables[9]); // contentHelpfulness = 5
    fireEvent.press(pressables[14]); // specialistRating = 5

    // Submit is the last onPress node in the tree (Button's inner Pressable).
    fireEvent.press(pressables[pressables.length - 1]);

    await waitFor(() =>
      expect(nodeApi.post as jest.Mock).toHaveBeenCalledWith(
        "/reviews",
        expect.objectContaining({
          targetID: "off-content-9",
          targetType: "Offering",
          generalRating: 5,
          ratings: expect.objectContaining({
            contentHelpfulness: 5,
            specialistRating: 5,
            recommendOffering: 0,
          }),
        })
      )
    );
    // Success toast key fired and form flips to already-reviewed.
    await waitFor(() =>
      expect(useToastStore.getState().message).toBe("review.submitSuccess")
    );
    await waitFor(() =>
      expect(screen.getByText("review.alreadyReviewed")).toBeTruthy()
    );
  });

  it("shows an error toast when createReview returns an unexpected message", async () => {
    mockReviewedCheck([]);
    (nodeApi.post as jest.Mock).mockResolvedValueOnce({
      data: { message: "Something else" },
    });

    render(<BookingReviewSection {...PROPS} />);
    await waitFor(() => expect(screen.getByText("review.submit")).toBeTruthy());

    const pressables = getPressableNodes();
    fireEvent.press(pressables[4]);
    fireEvent.press(pressables[9]);
    fireEvent.press(pressables[14]);
    fireEvent.press(pressables[pressables.length - 1]);

    await waitFor(() =>
      expect(useToastStore.getState().message).toBe("review.submitError")
    );
  });
});
