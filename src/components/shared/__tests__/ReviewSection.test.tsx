/**
 * ReviewSection — review overview + distribution + category cards + paginated
 * review cards. Pure presentational: driven entirely by props (no react-query,
 * no API calls — despite the batch note, the source delegates all data via props).
 *
 * Traced behaviour (src/components/shared/ReviewSection.tsx):
 *   - Heading t("reviews_ratings"); label t("overal_reviews_ratings").
 *   - Big average = Number(data.average).toFixed(1).
 *   - "based_on {totalReviews} reviews" line (t keys + raw number).
 *   - Distribution: rows for stars 5,4,3,2,1. Each row shows "{star} stars"
 *     (t("stars")) and the count = distribution.find(d=>d.star===star)?.count ?? 0.
 *   - Category cards render ONLY when data.categories.length > 0; each shows
 *     category.title and Number(category.average).toFixed(1).
 *   - One ReviewCard per data.reviews entry (ReviewCard shows the author name,
 *     or t("anonymous") when blank, plus per-category "value/5" chips).
 *   - Pagination block renders ONLY when totalPages > 1: a "{currentPage} / {totalPages}"
 *     label and two Pressables (back, next). Back is disabled when currentPage<=1,
 *     Next disabled when currentPage>=totalPages. Pressing fires onPageChange(±1).
 *     (The pagination Pressables have no role/text/testID. UNSAFE_getAllByType(Pressable)
 *      is unreliable here because the test's react-native `Pressable` reference does not
 *      match the one the component imports, so we target them via findAll on the only
 *      nodes that carry an `onPress` handler — there are exactly two in this component.)
 */

import { render, screen, fireEvent } from "@testing-library/react-native";
import { ReviewSection } from "@/components/shared/ReviewSection";
import type { ReviewSectionData } from "@/components/shared/ReviewSection";

// The two pagination controls are the only press-handling nodes in this component.
const getPaginationControls = () =>
  screen.UNSAFE_root.findAll(
    (node: any) => node.props != null && typeof node.props.onPress === "function"
  );

// ─── Fixtures ───────────────────────────────────────────────────────────────

const fullData: ReviewSectionData = {
  average: 4.25,
  totalReviews: 8,
  distribution: [
    { star: 5, count: 4 },
    { star: 4, count: 2 },
    { star: 3, count: 1 },
    // star 2 omitted on purpose -> falls back to 0
    { star: 1, count: 1 },
  ],
  categories: [
    { title: "Education Quality", average: 4.5, totalReviews: 8 },
    { title: "Campus Facilities", average: 3.8, totalReviews: 8 },
  ],
  reviews: [
    {
      generalRating: 5,
      date: "2025-01-15T00:00:00Z",
      comment: "Experience: Loved it",
      experience: "Loved it",
      studyPeriod: "2020-2024",
      ratings: [{ category: "QUALITY", value: 5 }],
      author: { name: "Jane Doe" },
    },
    {
      generalRating: 3,
      date: "2025-02-20T00:00:00Z",
      comment: "Experience: It was fine",
      experience: "It was fine",
      studyPeriod: "2019-2023",
      ratings: [{ category: "QUALITY", value: 3 }],
      author: { name: "" }, // blank -> t("anonymous")
    },
  ],
};

const baseProps = {
  data: fullData,
  currentPage: 1,
  totalPages: 1,
  onPageChange: jest.fn(),
};

// ─── Overview ─────────────────────────────────────────────────────────────────

describe("ReviewSection — overview", () => {
  it("renders the section heading and overall label", () => {
    render(<ReviewSection {...baseProps} />);
    expect(screen.getByText("reviews_ratings")).toBeTruthy();
    expect(screen.getByText("overal_reviews_ratings")).toBeTruthy();
  });

  it("renders the big average to one decimal place", () => {
    render(<ReviewSection {...baseProps} />);
    expect(screen.getByText("4.3")).toBeTruthy(); // 4.25.toFixed(1) -> "4.3"
  });

  it("renders the 'based_on N reviews' summary", () => {
    render(<ReviewSection {...baseProps} />);
    // Single Text node: "{t('based_on')} {totalReviews} {t('reviews')}" -> "based_on 8 reviews".
    expect(screen.getByText("based_on 8 reviews")).toBeTruthy();
  });
});

// ─── Distribution ─────────────────────────────────────────────────────────────

describe("ReviewSection — distribution bars", () => {
  it("renders a row for each of the 5 star levels", () => {
    render(<ReviewSection {...baseProps} />);
    // Each row's label Text is "{star} {t('stars')}" = e.g. "5 stars" (single node).
    expect(screen.getByText("5 stars")).toBeTruthy();
    expect(screen.getByText("4 stars")).toBeTruthy();
    expect(screen.getByText("3 stars")).toBeTruthy();
    expect(screen.getByText("2 stars")).toBeTruthy();
    expect(screen.getByText("1 stars")).toBeTruthy();
  });

  it("renders the provided counts and falls back to 0 for a missing star level", () => {
    render(<ReviewSection {...baseProps} />);
    // star 5 -> 4, star 4 -> 2, star 3 -> 1, star 2 (missing) -> 0, star 1 -> 1
    // count "0" only comes from the missing star-2 row.
    expect(screen.getByText("0")).toBeTruthy();
    // counts 4 and 2 appear once each as distribution counts
    expect(screen.getByText("4")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });
});

// ─── Category cards ───────────────────────────────────────────────────────────

describe("ReviewSection — category cards", () => {
  it("renders a card per category with title + average", () => {
    render(<ReviewSection {...baseProps} />);
    expect(screen.getByText("Education Quality")).toBeTruthy();
    expect(screen.getByText("Campus Facilities")).toBeTruthy();
    expect(screen.getByText("4.5")).toBeTruthy(); // 4.5.toFixed(1)
    expect(screen.getByText("3.8")).toBeTruthy(); // 3.8.toFixed(1)
  });

  it("renders no category cards when categories is empty", () => {
    render(
      <ReviewSection
        {...baseProps}
        data={{ ...fullData, categories: [] }}
      />
    );
    expect(screen.queryByText("Education Quality")).toBeNull();
  });
});

// ─── Review cards ─────────────────────────────────────────────────────────────

describe("ReviewSection — review cards", () => {
  it("renders one card per review showing the author name", () => {
    render(<ReviewSection {...baseProps} />);
    expect(screen.getByText("Jane Doe")).toBeTruthy();
  });

  it("falls back to t('anonymous') for a blank author name", () => {
    render(<ReviewSection {...baseProps} />);
    expect(screen.getByText("anonymous")).toBeTruthy();
  });

  it("renders the experience text wrapped in quotes", () => {
    render(<ReviewSection {...baseProps} />);
    expect(screen.getByText('"Loved it"')).toBeTruthy();
  });

  it("renders nothing in the reviews list when reviews is empty", () => {
    render(<ReviewSection {...baseProps} data={{ ...fullData, reviews: [] }} />);
    expect(screen.queryByText("Jane Doe")).toBeNull();
    expect(screen.queryByText("anonymous")).toBeNull();
  });
});

// ─── Pagination ───────────────────────────────────────────────────────────────

describe("ReviewSection — pagination", () => {
  it("does NOT render pagination when there is only one page", () => {
    render(<ReviewSection {...baseProps} totalPages={1} currentPage={1} />);
    // no "1 / 1" indicator and no pagination controls
    expect(screen.queryByText("1 / 1")).toBeNull();
    expect(getPaginationControls()).toHaveLength(0);
  });

  it("renders the page indicator and two controls when totalPages > 1", () => {
    render(<ReviewSection {...baseProps} totalPages={3} currentPage={2} />);
    expect(screen.getByText("2 / 3")).toBeTruthy();
    expect(getPaginationControls()).toHaveLength(2);
  });

  it("fires onPageChange(currentPage - 1) when back is pressed", () => {
    const onPageChange = jest.fn();
    render(
      <ReviewSection
        {...baseProps}
        totalPages={3}
        currentPage={2}
        onPageChange={onPageChange}
      />
    );
    const [back] = getPaginationControls();
    fireEvent.press(back);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("fires onPageChange(currentPage + 1) when next is pressed", () => {
    const onPageChange = jest.fn();
    render(
      <ReviewSection
        {...baseProps}
        totalPages={3}
        currentPage={2}
        onPageChange={onPageChange}
      />
    );
    const [, next] = getPaginationControls();
    fireEvent.press(next);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("disables the back control on the first page", () => {
    render(<ReviewSection {...baseProps} totalPages={3} currentPage={1} />);
    const [back] = getPaginationControls();
    expect(back.props.disabled).toBe(true);
  });

  it("disables the next control on the last page", () => {
    render(<ReviewSection {...baseProps} totalPages={3} currentPage={3} />);
    const [, next] = getPaginationControls();
    expect(next.props.disabled).toBe(true);
  });
});
