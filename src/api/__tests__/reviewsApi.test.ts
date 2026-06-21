/**
 * reviewsApi.test.ts — Node + Strapi transport for user reviews.
 *
 * Covers every exported function and the pure helpers
 * (formatReviewerName, extractExperience, extractStudyPeriod), tracing the
 * exact (sometimes quirky) fallback logic in the source.
 */

import {
  reviewsApi,
  formatReviewerName,
  extractExperience,
  extractStudyPeriod,
  type CreateReviewDto,
  type UserReview,
} from "@/api/reviewsApi";
import { nodeApi } from "@/api/nodeApi";
import { http } from "@/api/http";

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Pure helpers ───────────────────────────────────────────────────────────

describe("formatReviewerName", () => {
  it("joins first and last name", () => {
    expect(formatReviewerName("Ada", "Lovelace")).toBe("Ada Lovelace");
  });

  it("uses first name only when last is absent", () => {
    expect(formatReviewerName("Ada")).toBe("Ada");
  });

  it("returns the fallback when both parts are empty", () => {
    expect(formatReviewerName("", "", "Anonymous")).toBe("Anonymous");
    expect(formatReviewerName(undefined, undefined, "Guest")).toBe("Guest");
  });

  it("defaults the fallback to '' ", () => {
    expect(formatReviewerName(undefined, undefined)).toBe("");
  });
});

describe("extractExperience", () => {
  it("returns '' for an empty comment", () => {
    expect(extractExperience("")).toBe("");
  });

  it("extracts the Experience portion up to a newline", () => {
    expect(extractExperience("Experience: Great\nStudy Period: 2024")).toBe(
      "Great"
    );
  });

  it("extracts to end of string when no trailing newline", () => {
    expect(extractExperience("Experience: Amazing course")).toBe(
      "Amazing course"
    );
  });

  it("returns the whole comment when no Experience label is present", () => {
    expect(extractExperience("Just a plain comment")).toBe(
      "Just a plain comment"
    );
  });
});

describe("extractStudyPeriod", () => {
  it("returns '' for an empty comment", () => {
    expect(extractStudyPeriod("")).toBe("");
  });

  it("extracts the Study Period line", () => {
    expect(
      extractStudyPeriod("Experience: Great\nStudy Period: Fall 2024")
    ).toBe("Fall 2024");
  });

  it("returns '' when no Study Period label present", () => {
    expect(extractStudyPeriod("Experience: Great")).toBe("");
  });
});

// ─── getUserReviews ───────────────────────────────────────────────────────────

describe("reviewsApi.getUserReviews", () => {
  it("GETs /reviews/user with page+limit params and returns res.data", async () => {
    const payload = { data: [], totalPages: 2, currentPage: 1 };
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: payload });

    const result = await reviewsApi.getUserReviews(1, 10);

    expect((nodeApi.get as jest.Mock).mock.calls[0][0]).toBe("/reviews/user");
    expect((nodeApi.get as jest.Mock).mock.calls[0][1]).toEqual({
      params: { page: 1, limit: 10 },
    });
    expect(result).toBe(payload);
  });
});

// ─── deleteReview ─────────────────────────────────────────────────────────────

describe("reviewsApi.deleteReview", () => {
  it("DELETEs /reviews/:id", async () => {
    (nodeApi.delete as jest.Mock).mockResolvedValueOnce({ data: {} });
    await reviewsApi.deleteReview("rev-7");
    expect((nodeApi.delete as jest.Mock).mock.calls[0][0]).toBe("/reviews/rev-7");
  });

  it("propagates a rejection", async () => {
    (nodeApi.delete as jest.Mock).mockRejectedValueOnce(new Error("403"));
    await expect(reviewsApi.deleteReview("rev-7")).rejects.toThrow("403");
  });
});

// ─── getInstitutionAvgRating ──────────────────────────────────────────────────

describe("reviewsApi.getInstitutionAvgRating", () => {
  it("GETs the average-rating endpoint and returns avgRating", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: { avgRating: 4.5 },
    });

    const result = await reviewsApi.getInstitutionAvgRating("inst-1");

    expect((nodeApi.get as jest.Mock).mock.calls[0][0]).toBe(
      "/reviews/university/inst-1/average-rating"
    );
    expect(result).toBe(4.5);
  });

  it("returns 0 when the backend reports no general ratings", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: { message: "No general ratings found" },
    });
    expect(await reviewsApi.getInstitutionAvgRating("inst-1")).toBe(0);
  });

  it("returns 0 when avgRating absent", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: {} });
    expect(await reviewsApi.getInstitutionAvgRating("inst-1")).toBe(0);
  });

  it("returns 0 (swallows error) on rejection", async () => {
    (nodeApi.get as jest.Mock).mockRejectedValueOnce(new Error("500"));
    expect(await reviewsApi.getInstitutionAvgRating("inst-1")).toBe(0);
  });
});

// ─── checkOfferingReviewed (reviewed / not-reviewed / error) ─────────────────-

describe("reviewsApi.checkOfferingReviewed", () => {
  it("GETs /reviews/user/offering/:id", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });
    await reviewsApi.checkOfferingReviewed("off-1");
    expect((nodeApi.get as jest.Mock).mock.calls[0][0]).toBe(
      "/reviews/user/offering/off-1"
    );
  });

  it("returns true when a string response contains 'cant review' (already reviewed)", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: "You cant review this offering again",
    });
    expect(await reviewsApi.checkOfferingReviewed("off-1")).toBe(true);
  });

  it("returns false for a string that does NOT contain 'cantreview'", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: "some message" });
    expect(await reviewsApi.checkOfferingReviewed("off-1")).toBe(false);
  });

  it("returns false when response is an array (not yet reviewed)", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: [{ id: 1 }] });
    expect(await reviewsApi.checkOfferingReviewed("off-1")).toBe(false);
  });

  it("returns true when response is an object with a 'data' key (review exists)", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: { data: { id: "x" } },
    });
    expect(await reviewsApi.checkOfferingReviewed("off-1")).toBe(true);
  });

  it("returns false for a plain object without a 'data' key", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: { foo: 1 } });
    expect(await reviewsApi.checkOfferingReviewed("off-1")).toBe(false);
  });

  it("returns false (swallows error) on rejection", async () => {
    (nodeApi.get as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    expect(await reviewsApi.checkOfferingReviewed("off-1")).toBe(false);
  });
});

// ─── createReview (payload incl. ratings object) ─────────────────────────────-

describe("reviewsApi.createReview", () => {
  it("POSTs /reviews with the full dto and returns res.data", async () => {
    const dto: CreateReviewDto = {
      targetID: "off-1",
      targetType: "Offering",
      generalRating: 5,
      parentID: "inst-1",
      ratings: {
        contentHelpfulness: 5,
        specialistRating: 4,
        recommendOffering: 5,
      },
      comment: "Experience: Loved it",
    };
    (nodeApi.post as jest.Mock).mockResolvedValueOnce({
      data: { message: "Review created" },
    });

    const result = await reviewsApi.createReview(dto);

    expect((nodeApi.post as jest.Mock).mock.calls[0][0]).toBe("/reviews");
    expect((nodeApi.post as jest.Mock).mock.calls[0][1]).toEqual(dto);
    expect((nodeApi.post as jest.Mock).mock.calls[0][1].ratings).toEqual({
      contentHelpfulness: 5,
      specialistRating: 4,
      recommendOffering: 5,
    });
    expect(result).toEqual({ message: "Review created" });
  });

  it("propagates a rejection", async () => {
    (nodeApi.post as jest.Mock).mockRejectedValueOnce(new Error("422"));
    await expect(
      reviewsApi.createReview({
        targetID: "p1",
        targetType: "Program",
        generalRating: 3,
        ratings: { educationQuality: 3 },
        comment: "ok",
      })
    ).rejects.toThrow("422");
  });
});

// ─── getAllAverageRating ──────────────────────────────────────────────────────

describe("reviewsApi.getAllAverageRating", () => {
  it("GETs the all-average-rating endpoint with type+documentId", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: { averages: { averageGeneralRating: 4, totalReviews: 10 } },
    });

    const result = await reviewsApi.getAllAverageRating("Institution", "doc-1");

    expect((nodeApi.get as jest.Mock).mock.calls[0][0]).toBe(
      "/reviews/all-average-rating/Institution/doc-1"
    );
    // averages merged over the ZERO defaults
    expect(result.averageGeneralRating).toBe(4);
    expect(result.totalReviews).toBe(10);
    expect(result.star5).toBe(0);
  });

  it("merges top-level fields when there is no `averages` wrapper", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: { star5: 7, averageQualityRating: 3.2 },
    });
    const result = await reviewsApi.getAllAverageRating("Program", "p1");
    expect(result.star5).toBe(7);
    expect(result.averageQualityRating).toBe(3.2);
    expect(result.averageGeneralRating).toBe(0);
  });

  it("returns all-zero when the backend reports no reviews", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: { message: "No reviews yet" },
    });
    const result = await reviewsApi.getAllAverageRating("Offering", "o1");
    expect(result.totalReviews).toBe(0);
    expect(result.averageGeneralRating).toBe(0);
  });

  it("returns all-zero when data is falsy", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: null });
    const result = await reviewsApi.getAllAverageRating("Institution", "x");
    expect(result.totalReviews).toBe(0);
  });

  it("returns all-zero (swallows error) on rejection", async () => {
    (nodeApi.get as jest.Mock).mockRejectedValueOnce(new Error("down"));
    const result = await reviewsApi.getAllAverageRating("Institution", "x");
    expect(result.totalReviews).toBe(0);
  });
});

// ─── getSampleReviews ─────────────────────────────────────────────────────────

describe("reviewsApi.getSampleReviews", () => {
  it("GETs seven-reviews with page+limit query and returns res.data", async () => {
    const payload = { reviews: [{ generalRating: 5 }], totalReviews: 1, totalPages: 1 };
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: payload });

    const result = await reviewsApi.getSampleReviews("Program", "parent-1", 2, 5);

    expect((nodeApi.get as jest.Mock).mock.calls[0][0]).toBe(
      "/reviews/seven-reviews/Program/parent-1?page=2&limit=5"
    );
    expect(result).toBe(payload);
  });

  it("uses the default limit of 5 when omitted", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: { reviews: [], totalReviews: 0, totalPages: 0 },
    });
    await reviewsApi.getSampleReviews("Offering", "p2", 1);
    expect((nodeApi.get as jest.Mock).mock.calls[0][0]).toBe(
      "/reviews/seven-reviews/Offering/p2?page=1&limit=5"
    );
  });

  it("returns EMPTY when res.data is nullish", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: null });
    expect(await reviewsApi.getSampleReviews("Program", "p", 1)).toEqual({
      reviews: [],
      totalReviews: 0,
      totalPages: 0,
    });
  });

  it("returns EMPTY (swallows error) on rejection", async () => {
    (nodeApi.get as jest.Mock).mockRejectedValueOnce(new Error("oops"));
    expect(await reviewsApi.getSampleReviews("Program", "p", 1)).toEqual({
      reviews: [],
      totalReviews: 0,
      totalPages: 0,
    });
  });
});

// ─── checkReviewedInstitution ─────────────────────────────────────────────────

describe("reviewsApi.checkReviewedInstitution", () => {
  it("GETs /reviews/user/university/:documentId", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: {} });
    await reviewsApi.checkReviewedInstitution("doc-1");
    expect((nodeApi.get as jest.Mock).mock.calls[0][0]).toBe(
      "/reviews/user/university/doc-1"
    );
  });

  it("returns true when a string response contains 'cant review'", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: "You cant review again",
    });
    expect(await reviewsApi.checkReviewedInstitution("doc-1")).toBe(true);
  });

  it("returns false for a non-matching string", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: "all good" });
    expect(await reviewsApi.checkReviewedInstitution("doc-1")).toBe(false);
  });

  it("returns false for an object response (legacy can-review)", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: { foo: 1 } });
    expect(await reviewsApi.checkReviewedInstitution("doc-1")).toBe(false);
  });

  it("returns false (swallows error) on rejection", async () => {
    (nodeApi.get as jest.Mock).mockRejectedValueOnce(new Error("x"));
    expect(await reviewsApi.checkReviewedInstitution("doc-1")).toBe(false);
  });
});

// ─── normalizeReview (mixes Strapi name lookup with structured comment) ───────

describe("reviewsApi.normalizeReview", () => {
  const labels = {
    quality: "Quality",
    campusFacilities: "Facilities",
    studentLife: "Student Life",
    helpfulness: "Helpfulness",
    specialist: "Specialist",
    recommendOffering: "Recommend",
  };

  it("fetches the program name from Strapi and builds program ratings", async () => {
    (http.get as jest.Mock).mockResolvedValueOnce({
      data: { data: [{ name: "Computer Science" }] },
    });

    const raw: UserReview = {
      id: "r1",
      targetID: "55",
      targetType: "Program",
      generalRating: 4,
      ratings: { educationQuality: 5, campusFacilities: 3, studentLife: 4 },
      comment: "Experience: Loved it\nStudy Period: 2024",
      createdAt: "2025-01-01",
    };

    const result = await reviewsApi.normalizeReview(raw, labels);

    // program name fetched from the programs endpoint
    expect((http.get as jest.Mock).mock.calls[0][0]).toBe(
      "/api/programs?filters[id][$eq]=55&fields[0]=name&status=draft"
    );
    expect(result.targetName).toBe("Computer Science");
    expect(result.experience).toBe("Loved it");
    expect(result.studyPeriod).toBe("2024");
    expect(result.ratings).toEqual([
      { category: "Quality", value: 5 },
      { category: "Facilities", value: 3 },
      { category: "Student Life", value: 4 },
    ]);
    expect(result.generalRating).toBe(4);
    expect(result.date).toBe("2025-01-01");
  });

  it("fetches the offering title and builds offering ratings, defaulting missing values to 0", async () => {
    (http.get as jest.Mock).mockResolvedValueOnce({
      data: { data: [{ title: "IELTS Prep" }] },
    });

    const raw: UserReview = {
      id: "r2",
      targetID: "77",
      targetType: "Offering",
      generalRating: 0,
      ratings: { contentHelpfulness: 5 }, // others missing -> default 0
      comment: "Plain comment with no labels",
      createdAt: "2025-02-02",
    };

    const result = await reviewsApi.normalizeReview(raw, labels);

    expect((http.get as jest.Mock).mock.calls[0][0]).toBe(
      "/api/offerings?filters[id][$eq]=77&fields[0]=title&status=draft"
    );
    expect(result.targetName).toBe("IELTS Prep");
    expect(result.ratings).toEqual([
      { category: "Helpfulness", value: 5 },
      { category: "Specialist", value: 0 },
      { category: "Recommend", value: 0 },
    ]);
    // no "Experience:" label -> experience falls back to the whole comment
    expect(result.experience).toBe("Plain comment with no labels");
    expect(result.studyPeriod).toBe("");
  });

  it("returns empty targetName when the Strapi lookup throws (swallowed)", async () => {
    (http.get as jest.Mock).mockRejectedValueOnce(new Error("strapi down"));

    const raw: UserReview = {
      id: "r3",
      targetID: "9",
      targetType: "Program",
      generalRating: 2,
      ratings: {},
      comment: "",
      createdAt: "2025-03-03",
    };

    const result = await reviewsApi.normalizeReview(raw, labels);
    expect(result.targetName).toBe("");
    // missing program ratings default to 0
    expect(result.ratings).toEqual([
      { category: "Quality", value: 0 },
      { category: "Facilities", value: 0 },
      { category: "Student Life", value: 0 },
    ]);
  });
});
