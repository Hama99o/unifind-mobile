/**
 * ReviewCard — render test.
 *
 * Shows: stars + date, experience text (wrapped in literal quotes), per-category
 * mini-ratings (value/5), study period line (t("study_period"): <period>), and
 * author name (falls back to t("anonymous")).
 *
 * Experience/studyPeriod prefer the explicit fields, else extract from `comment`:
 *   extractExperience: text after "Experience:" up to newline, else whole comment.
 *   extractStudyPeriod: text after "Study Period:" up to newline, else "".
 */

import { render, screen } from "@testing-library/react-native";
import { ReviewCard } from "@/components/shared/ReviewCard";
import type { ReviewItem } from "@/components/shared/ReviewSection";

const baseReview: ReviewItem = {
  generalRating: 4,
  date: "2024-05-01T00:00:00.000Z",
  comment: "Experience: Great campus\nStudy Period: 2020-2024",
  ratings: [
    { category: "Quality", value: 5 },
    { category: "Campus", value: 3 },
  ],
  author: { name: "Jane Doe" },
};

describe("ReviewCard", () => {
  it("renders the experience text in quotes and the author name", () => {
    render(<ReviewCard review={baseReview} />);
    // Component wraps experience as `"{experience}"`.
    expect(screen.getByText('"Great campus"')).toBeTruthy();
    expect(screen.getByText("Jane Doe")).toBeTruthy();
  });

  it("renders each per-category mini rating as value/5", () => {
    render(<ReviewCard review={baseReview} />);
    expect(screen.getByText("Quality")).toBeTruthy();
    expect(screen.getByText("Campus")).toBeTruthy();
    expect(screen.getByText("5/5")).toBeTruthy();
    expect(screen.getByText("3/5")).toBeTruthy();
  });

  it("renders the study period line (label key + value)", () => {
    render(<ReviewCard review={baseReview} />);
    // t("study_period") returns the key; rendered as "study_period: 2020-2024".
    expect(screen.getByText("study_period: 2020-2024")).toBeTruthy();
  });

  it("prefers the explicit experience/studyPeriod fields over the comment", () => {
    render(
      <ReviewCard
        review={{
          ...baseReview,
          experience: "Explicit exp",
          studyPeriod: "2018-2022",
          comment: "Experience: ignored\nStudy Period: ignored",
        }}
      />
    );
    expect(screen.getByText('"Explicit exp"')).toBeTruthy();
    expect(screen.getByText("study_period: 2018-2022")).toBeTruthy();
  });

  it("falls back to t('anonymous') when the author name is empty", () => {
    render(
      <ReviewCard
        review={{ ...baseReview, author: { name: "" } }}
      />
    );
    expect(screen.getByText("anonymous")).toBeTruthy();
  });

  it("renders the whole comment as experience when there is no 'Experience:' marker", () => {
    // extractExperience returns the entire comment when no marker is present.
    render(
      <ReviewCard
        review={{
          ...baseReview,
          comment: "Just a plain comment",
        }}
      />
    );
    expect(screen.getByText('"Just a plain comment"')).toBeTruthy();
  });

  it("renders no per-category ratings when the ratings array is empty", () => {
    render(<ReviewCard review={{ ...baseReview, ratings: [] }} />);
    expect(screen.queryByText("5/5")).toBeNull();
    expect(screen.queryByText("Quality")).toBeNull();
  });

  it("omits the experience block when experience resolves to empty", () => {
    // comment empty → extractExperience returns "" → experience block not rendered.
    render(
      <ReviewCard
        review={{ ...baseReview, comment: "", studyPeriod: "2020-2024" }}
      />
    );
    expect(screen.queryByText('""')).toBeNull();
    // study period still shows (explicit field).
    expect(screen.getByText("study_period: 2020-2024")).toBeTruthy();
  });
});
