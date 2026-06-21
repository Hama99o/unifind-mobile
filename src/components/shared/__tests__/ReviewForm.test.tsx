/**
 * ReviewForm — auth-gated review submission form.
 *
 * Traced behaviour (src/components/shared/ReviewForm.tsx):
 *
 * Logged-out:
 *   - Renders a login-prompt card: t("leave_review") heading,
 *     t("login_to_review") body, and a Button labeled t("sign_in_to_review").
 *   - Pressing that button calls openSignIn (useSignInSheet().open).
 *   - The full form (and its submit button) is NOT rendered.
 *
 * Logged-in:
 *   - On mount, loads campuses via institutionDetailApi.getCampusesForInstitution
 *     (which calls the mocked Strapi `http.get`).
 *   - Renders 4 rating blocks (general, education_quality, campus_facilities,
 *     student_life) -> 20 star buttons, the cascade selects, an experience
 *     textarea, and a submit button labeled t("submit_review").
 *
 * handleSubmit:
 *   1. If any of the 4 ratings < 1 -> setRatingError(true) and RETURN
 *      (createReview NOT called; rating error messages appear).
 *   2. Else setSubmitted(true); if any required select is empty -> RETURN
 *      (createReview NOT called; fieldRequired errors appear).
 *   3. Else POST via reviewsApi.createReview(dto) where
 *        comment = "Campus Attended: {campusId}\nFaculty: {facultyId}\n
 *                   Study Period: {start}-{end}\nExperience: {text}"
 *        dto = { targetID: programDocId, targetType: "Program", generalRating,
 *                parentID: institutionDocumentId,
 *                ratings: { educationQuality, campusFacilities, studentLife },
 *                comment }
 *      On a message containing "success"/"created" -> showToast(t("success")),
 *      resetForm, onReviewSubmitted().
 *
 * NOTE: reviewsApi.createReview goes through the globally-mocked nodeApi; we
 * spy on the reviewsApi method directly to assert the assembled payload.
 */

import {
  renderWithProviders,
  screen,
  fireEvent,
  waitFor,
} from "@/test-utils/renderWithProviders";
import { ReviewForm } from "@/components/shared/ReviewForm";
import { useSignInSheetStore } from "@/auth/signInSheetStore";
import { useToastStore } from "@/stores/toastStore";
import { reviewsApi } from "@/api/reviewsApi";
import { institutionDetailApi } from "@/api/institutionDetailApi";

// ─── Fixtures ───────────────────────────────────────────────────────────────

const CAMPUSES = [{ id: 10, documentId: "c-10", name: "Main Campus" }];
const FACULTIES = [{ id: 20, documentId: "f-20", name: "Engineering" }];
const PROGRAMS = [{ documentId: "prog-doc-1", label: "BSc Computer Science" }];

const baseProps = {
  institutionSlug: "acme-university",
  institutionDocumentId: "inst-doc-1",
  locale: "en" as const,
  isLoggedIn: true,
};

// Spy on the API layer (transport) rather than wiring raw nodeApi/http mocks,
// so we can assert the exact assembled DTO the form builds.
let createReviewSpy: jest.SpyInstance;
let getCampusesSpy: jest.SpyInstance;
let getFacultiesSpy: jest.SpyInstance;
let getProgramsSpy: jest.SpyInstance;

beforeEach(() => {
  // Real timers: the year options are computed from new Date().getFullYear(),
  // but the picks used below (2024 / 2025) exist for any current year >= 2025,
  // so no fake clock is needed — and real timers keep async waitFor stable.

  // Reset shared zustand stores.
  useSignInSheetStore.setState({ isOpen: false });
  useToastStore.setState({ message: null, seq: 0 });

  createReviewSpy = jest
    .spyOn(reviewsApi, "createReview")
    .mockResolvedValue({ message: "Review created successfully" });
  getCampusesSpy = jest
    .spyOn(institutionDetailApi, "getCampusesForInstitution")
    .mockResolvedValue(CAMPUSES);
  getFacultiesSpy = jest
    .spyOn(institutionDetailApi, "getAcademicUnitsForCampus")
    .mockResolvedValue(FACULTIES);
  getProgramsSpy = jest
    .spyOn(institutionDetailApi, "getProgramsForReviewDropdown")
    .mockResolvedValue(PROGRAMS);
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ─── Logged-out ──────────────────────────────────────────────────────────────

describe("ReviewForm — logged out", () => {
  it("renders the login-prompt card and not the submit button", () => {
    renderWithProviders(<ReviewForm {...baseProps} isLoggedIn={false} />);
    expect(screen.getByText("login_to_review")).toBeTruthy();
    expect(screen.getByText("sign_in_to_review")).toBeTruthy();
    expect(screen.queryByText("submit_review")).toBeNull();
  });

  it("opens the sign-in sheet when the sign-in button is pressed", () => {
    renderWithProviders(<ReviewForm {...baseProps} isLoggedIn={false} />);
    expect(useSignInSheetStore.getState().isOpen).toBe(false);
    fireEvent.press(screen.getByText("sign_in_to_review"));
    expect(useSignInSheetStore.getState().isOpen).toBe(true);
  });

  it("does not attempt to load campuses when logged out", () => {
    renderWithProviders(<ReviewForm {...baseProps} isLoggedIn={false} />);
    expect(getCampusesSpy).not.toHaveBeenCalled();
  });
});

// ─── Logged-in: rendering + campus load ───────────────────────────────────────

describe("ReviewForm — logged in (rendering)", () => {
  it("renders the form heading and submit button", async () => {
    renderWithProviders(<ReviewForm {...baseProps} />);
    expect(screen.getByText("leave_review")).toBeTruthy();
    expect(screen.getByText("submit_review")).toBeTruthy();
    // let the mount effect's promise resolve so no act warning lingers
    await waitFor(() => expect(getCampusesSpy).toHaveBeenCalled());
  });

  it("loads campuses for the institution on mount", async () => {
    renderWithProviders(<ReviewForm {...baseProps} />);
    await waitFor(() =>
      expect(getCampusesSpy).toHaveBeenCalledWith("acme-university", "en")
    );
  });

  it("renders 20 star buttons (4 rating blocks × 5 stars)", async () => {
    renderWithProviders(<ReviewForm {...baseProps} />);
    await waitFor(() => expect(getCampusesSpy).toHaveBeenCalled());
    // 20 star buttons; the cascade triggers are role="combobox", submit is the Button
    expect(screen.getAllByRole("button").length).toBe(20);
  });
});

// ─── Logged-in: validation paths ──────────────────────────────────────────────

describe("ReviewForm — validation blocks submit", () => {
  it("does NOT call createReview and shows rating errors when ratings are unset", async () => {
    renderWithProviders(<ReviewForm {...baseProps} />);
    await waitFor(() => expect(getCampusesSpy).toHaveBeenCalled());

    fireEvent.press(screen.getByText("submit_review"));

    expect(createReviewSpy).not.toHaveBeenCalled();
    // ratingError -> ratingRequired message appears (one per invalid block)
    expect(screen.getAllByText("ratingRequired").length).toBeGreaterThan(0);
  });

  it("does NOT call createReview when ratings are set but required selects are empty", async () => {
    renderWithProviders(<ReviewForm {...baseProps} />);
    await waitFor(() => expect(getCampusesSpy).toHaveBeenCalled());

    // Set all 4 ratings to 5 by tapping the last star of each block.
    // Star buttons are the only role="button" elements (20 of them), in
    // render order: general[0-4], education[5-9], campus[10-14], studentLife[15-19].
    const stars = screen.getAllByRole("button");
    [4, 9, 14, 19].forEach((i) => fireEvent.press(stars[i]));

    fireEvent.press(screen.getByText("submit_review"));

    // ratings valid -> passes rating gate, but selects empty -> returns early
    expect(createReviewSpy).not.toHaveBeenCalled();
    // submitted=true -> fieldRequired errors now visible
    expect(screen.getAllByText("fieldRequired").length).toBeGreaterThan(0);
  });
});

// ─── Logged-in: successful submit ─────────────────────────────────────────────

describe("ReviewForm — successful submit", () => {
  it("assembles the DTO and calls createReview, then toasts + resets", async () => {
    const onReviewSubmitted = jest.fn();
    renderWithProviders(
      <ReviewForm {...baseProps} onReviewSubmitted={onReviewSubmitted} />
    );
    await waitFor(() => expect(getCampusesSpy).toHaveBeenCalled());

    // 1. Set all 4 ratings to 5.
    const stars = screen.getAllByRole("button");
    [4, 9, 14, 19].forEach((i) => fireEvent.press(stars[i]));

    // 2. Campus: open its combobox (accessibilityLabel = placeholder "campus_attend"),
    //    pick the loaded campus. Selecting it triggers the faculty load effect.
    fireEvent.press(screen.getByLabelText("campus_attend"));
    fireEvent.press(screen.getByText("Main Campus"));
    await waitFor(() =>
      expect(getFacultiesSpy).toHaveBeenCalledWith(10, "en")
    );

    // 3. Faculty: placeholder becomes "faculty" once a campus is chosen.
    fireEvent.press(screen.getByLabelText("faculty"));
    fireEvent.press(screen.getByText("Engineering"));
    await waitFor(() =>
      expect(getProgramsSpy).toHaveBeenCalledWith(20, "en")
    );

    // 4. Program: placeholder becomes "program_studied" once a faculty is chosen.
    fireEvent.press(screen.getByLabelText("program_studied"));
    fireEvent.press(screen.getByText("BSc Computer Science"));

    // 5. Start year: placeholder is "year". Options run CURRENT_YEAR..1950, so
    //    "2024" is always present. Pick it.
    fireEvent.press(screen.getByLabelText("year"));
    fireEvent.press(screen.getByText("2024"));

    // 6. End year: after a start year is set its placeholder becomes "year" too,
    //    so two "year"-labelled comboboxes now exist; the 2nd is the end-year.
    const yearTriggers = screen.getAllByLabelText("year");
    fireEvent.press(yearTriggers[yearTriggers.length - 1]);
    // endYearOpts = getYearOptions(2024, 2026) -> 2026,2025,2024
    fireEvent.press(screen.getByText("2025"));

    // 7. Submit.
    fireEvent.press(screen.getByText("submit_review"));

    await waitFor(() => expect(createReviewSpy).toHaveBeenCalledTimes(1));

    expect(createReviewSpy).toHaveBeenCalledWith({
      targetID: "prog-doc-1",
      targetType: "Program",
      generalRating: 5,
      parentID: "inst-doc-1",
      ratings: { educationQuality: 5, campusFacilities: 5, studentLife: 5 },
      comment:
        "Campus Attended: 10\nFaculty: 20\nStudy Period: 2024-2025\nExperience: ",
    });

    // Success message contains "created" -> success toast + reset + callback.
    await waitFor(() =>
      expect(useToastStore.getState().message).toBe("success")
    );
    expect(onReviewSubmitted).toHaveBeenCalledTimes(1);
  });
});
