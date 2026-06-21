/**
 * reviewComment.test.ts — unit tests for review helper functions in reviewsApi.
 *
 * Pure functions — no network calls, no RN modules.  Axios instances are
 * mocked in jest.setup.ts but these tests don't use them.
 *
 * Coverage:
 *   extractExperience  — normal, multi-line body, no match, empty string
 *   extractStudyPeriod — normal, no match, multi-line comment, empty string
 *   formatReviewerName — first+last, first only, last only, both empty, fallback
 */

import {
  extractExperience,
  extractStudyPeriod,
  formatReviewerName,
} from "@/api/reviewsApi";

// ─── extractExperience ────────────────────────────────────────────────────────

describe("extractExperience", () => {
  it("extracts the line after 'Experience:'", () => {
    const comment = "Experience: Great program, learned a lot.\nStudy Period: 2023-2024";
    expect(extractExperience(comment)).toBe("Great program, learned a lot.");
  });

  it("trims leading/trailing whitespace from the extracted value", () => {
    const comment = "Experience:   Excellent.   \nOther: stuff";
    expect(extractExperience(comment)).toBe("Excellent.");
  });

  it("returns the full comment as fallback when no 'Experience:' label", () => {
    const comment = "Just a plain comment without structure.";
    expect(extractExperience(comment)).toBe("Just a plain comment without structure.");
  });

  it("returns '' for an empty string", () => {
    expect(extractExperience("")).toBe("");
  });

  it("handles multi-line experience body — stops at the first newline", () => {
    // The regex matches up to \n or end-of-string; the first segment is returned
    const comment =
      "Experience: First line of experience\nSecond line\nStudy Period: 2022";
    expect(extractExperience(comment)).toBe("First line of experience");
  });

  it("handles experience at the very end of the string (no trailing newline)", () => {
    const comment = "Study Period: 2023\nExperience: Solid foundation";
    expect(extractExperience(comment)).toBe("Solid foundation");
  });

  it("is case-sensitive — 'experience:' lowercase does NOT match", () => {
    const comment = "experience: lowercase";
    // No match → returns the full comment as fallback
    expect(extractExperience(comment)).toBe("experience: lowercase");
  });
});

// ─── extractStudyPeriod ───────────────────────────────────────────────────────

describe("extractStudyPeriod", () => {
  it("extracts the value after 'Study Period:'", () => {
    const comment = "Experience: Good course.\nStudy Period: September 2022 – June 2023";
    expect(extractStudyPeriod(comment)).toBe("September 2022 – June 2023");
  });

  it("trims the extracted value", () => {
    const comment = "Study Period:   Fall 2021   ";
    expect(extractStudyPeriod(comment)).toBe("Fall 2021");
  });

  it("returns '' when 'Study Period:' is not present", () => {
    const comment = "Experience: Good.";
    expect(extractStudyPeriod(comment)).toBe("");
  });

  it("returns '' for an empty string", () => {
    expect(extractStudyPeriod("")).toBe("");
  });

  it("handles 'Study Period:' in a multi-line comment — stops at newline", () => {
    const comment = "Experience: Great.\nStudy Period: 2020-2021\nExtra line";
    expect(extractStudyPeriod(comment)).toBe("2020-2021");
  });

  it("returns '' for a comment that only has 'Experience:'", () => {
    const comment = "Experience: Some text here";
    expect(extractStudyPeriod(comment)).toBe("");
  });
});

// ─── formatReviewerName ───────────────────────────────────────────────────────

describe("formatReviewerName", () => {
  it("combines first and last name with a space", () => {
    expect(formatReviewerName("John", "Doe")).toBe("John Doe");
  });

  it("returns only first name when last is undefined", () => {
    expect(formatReviewerName("Alice", undefined)).toBe("Alice");
  });

  it("returns only first name when last is empty string", () => {
    expect(formatReviewerName("Bob", "")).toBe("Bob");
  });

  it("returns last name when first is undefined", () => {
    // first is undefined → "" | last is "Smith" → " Smith" → trim → "Smith"
    expect(formatReviewerName(undefined, "Smith")).toBe("Smith");
  });

  it("returns the fallback when both first and last are empty", () => {
    expect(formatReviewerName("", "", "Anonymous")).toBe("Anonymous");
  });

  it("returns the fallback when both are undefined", () => {
    expect(formatReviewerName(undefined, undefined, "Anonymous User")).toBe(
      "Anonymous User"
    );
  });

  it("returns '' (empty string) when both are empty and no fallback provided", () => {
    expect(formatReviewerName("", "")).toBe("");
  });

  it("handles names with special characters", () => {
    expect(formatReviewerName("محمد", "علي")).toBe("محمد علي");
  });

  it("trims the combined name (no leading/trailing spaces)", () => {
    // first = "  John  " — trim happens on the combined string
    // Note: the actual implementation does template literal + trim; test the trim
    expect(formatReviewerName("  Jane  ", "  Doe  ").trim()).toBe("Jane     Doe");
    // More precise: the function trims the OUTER result, not inner spaces
    // Let's test what the function actually produces per implementation:
    // `${first ?? ""}${last ? " " + last : ""}`.trim()
    // = "  Jane  " + " " + "  Doe  " → "  Jane     Doe  ".trim() → "Jane     Doe"
    expect(formatReviewerName("  Jane  ", "  Doe  ")).toBe("Jane     Doe");
  });

  it("handles a single-word full name (first only, common in Arabic names)", () => {
    expect(formatReviewerName("Layla")).toBe("Layla");
  });
});
