/**
 * useReviewList.test.ts — paginated review fetching + mapping.
 *
 * Goes through the real reviewsApi.getSampleReviews, which calls the globally
 * mocked nodeApi.get. We drive nodeApi.get's resolved value per-test.
 *
 * getSampleReviews returns `res.data ?? EMPTY` and swallows errors → EMPTY
 * ({ reviews: [], totalReviews: 0, totalPages: 0 }), so a rejected nodeApi.get
 * yields an empty review list and totalPages defaults to 1 (res.totalPages||1).
 *
 * Mapping traced from source:
 *   generalRating ← rev.generalRating ?? 0
 *   date          ← rev.createdAt
 *   comment       ← rev.comment
 *   experience    ← extractExperience(comment)  (the "Experience:" line, else whole comment)
 *   studyPeriod   ← strategy "extract" → extractStudyPeriod(comment); "empty" → ""
 *   ratings       ← mapCategories(rev)
 *   author.name   ← formatReviewerName(firstName, lastName, anonymousFallback)
 *   author.avatarUrl ← rev.photo
 */

import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useReviewList, type MapCategoriesFn } from "@/hooks/useReviewList";
import { nodeApi } from "@/api/nodeApi";

const getMock = nodeApi.get as jest.Mock;

/** Build a raw review row as the backend would return it. */
function rawReview(over: Partial<{
  generalRating: number;
  ratings: Record<string, number>;
  comment: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  photo: string;
}> = {}) {
  return {
    generalRating: 4,
    ratings: { educationQuality: 5, campusFacilities: 3, studentLife: 4 },
    comment: "Experience: Great place\nStudy Period: 2020-2024",
    createdAt: "2025-06-01T12:00:00Z",
    firstName: "Ada",
    lastName: "Lovelace",
    photo: "https://img/ada.png",
    ...over,
  };
}

/** A stable mapCategories used by most tests. */
const mapCats: MapCategoriesFn = (rev) => [
  { category: "quality", value: rev.ratings.educationQuality ?? 0 },
  { category: "facilities", value: rev.ratings.campusFacilities ?? 0 },
];

beforeEach(() => {
  jest.clearAllMocks();
  // Default: one page with one review.
  getMock.mockResolvedValue({
    data: { reviews: [rawReview()], totalReviews: 1, totalPages: 1 },
  });
});

describe("useReviewList", () => {
  it("starts with empty reviews, page 1 and totalPages 1", () => {
    // Hold the fetch so we observe the initial synchronous state.
    getMock.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() =>
      useReviewList("Program", "inst-1", mapCats)
    );
    expect(result.current.reviews).toEqual([]);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(1);
  });

  it("fetches on mount and maps the raw review into a ReviewItem", async () => {
    const { result } = renderHook(() =>
      useReviewList("Program", "inst-1", mapCats)
    );
    await waitFor(() => expect(result.current.reviews).toHaveLength(1));

    const r = result.current.reviews[0];
    expect(r.generalRating).toBe(4);
    expect(r.date).toBe("2025-06-01T12:00:00Z");
    expect(r.comment).toBe("Experience: Great place\nStudy Period: 2020-2024");
    expect(r.experience).toBe("Great place");
    expect(r.studyPeriod).toBe("2020-2024");
    expect(r.ratings).toEqual([
      { category: "quality", value: 5 },
      { category: "facilities", value: 3 },
    ]);
    expect(r.author.name).toBe("Ada Lovelace");
    expect(r.author.avatarUrl).toBe("https://img/ada.png");
  });

  it("calls getSampleReviews with the correct target type, parentId, page and limit 5", async () => {
    renderHook(() => useReviewList("Offering", "off-9", mapCats));
    await waitFor(() => expect(getMock).toHaveBeenCalled());
    // reviewsApi builds the URL: /reviews/seven-reviews/<type>/<id>?page=&limit=5
    expect(getMock).toHaveBeenCalledWith(
      "/reviews/seven-reviews/Offering/off-9?page=1&limit=5"
    );
  });

  it("propagates totalPages from the response", async () => {
    getMock.mockResolvedValue({
      data: { reviews: [], totalReviews: 12, totalPages: 3 },
    });
    const { result } = renderHook(() =>
      useReviewList("Program", "inst-1", mapCats)
    );
    await waitFor(() => expect(result.current.totalPages).toBe(3));
  });

  it("defaults totalPages to 1 when the response reports 0", async () => {
    getMock.mockResolvedValue({
      data: { reviews: [], totalReviews: 0, totalPages: 0 },
    });
    const { result } = renderHook(() =>
      useReviewList("Program", "inst-1", mapCats)
    );
    // res.totalPages || 1 → 0 becomes 1
    await waitFor(() => expect(result.current.totalPages).toBe(1));
    expect(result.current.reviews).toEqual([]);
  });

  it("does not fetch when parentId is empty (early return)", async () => {
    const { result } = renderHook(() =>
      useReviewList("Program", "", mapCats)
    );
    // give the effect a tick; nothing should be requested
    await act(async () => {
      await Promise.resolve();
    });
    expect(getMock).not.toHaveBeenCalled();
    expect(result.current.reviews).toEqual([]);
  });

  it("setCurrentPage triggers a re-fetch for the new page (pagination)", async () => {
    getMock.mockImplementation((url: string) => {
      const page = url.includes("page=2") ? 2 : 1;
      return Promise.resolve({
        data: {
          reviews: [rawReview({ comment: `page ${page}`, firstName: `P${page}`, lastName: "" })],
          totalReviews: 10,
          totalPages: 2,
        },
      });
    });

    const { result } = renderHook(() =>
      useReviewList("Program", "inst-1", mapCats)
    );
    await waitFor(() => expect(result.current.reviews[0]?.comment).toBe("page 1"));

    act(() => result.current.setCurrentPage(2));

    await waitFor(() => expect(result.current.currentPage).toBe(2));
    await waitFor(() => expect(result.current.reviews[0]?.comment).toBe("page 2"));
    expect(getMock).toHaveBeenCalledWith(
      "/reviews/seven-reviews/Program/inst-1?page=2&limit=5"
    );
  });

  it("refetch re-runs the request for the current page", async () => {
    const { result } = renderHook(() =>
      useReviewList("Program", "inst-1", mapCats)
    );
    await waitFor(() => expect(getMock).toHaveBeenCalledTimes(1));

    act(() => result.current.refetch());

    await waitFor(() => expect(getMock).toHaveBeenCalledTimes(2));
    // still page 1
    expect(getMock).toHaveBeenLastCalledWith(
      "/reviews/seven-reviews/Program/inst-1?page=1&limit=5"
    );
  });

  it("studyPeriodStrategy 'empty' always yields an empty studyPeriod", async () => {
    const { result } = renderHook(() =>
      useReviewList("Offering", "off-1", mapCats, { studyPeriodStrategy: "empty" })
    );
    await waitFor(() => expect(result.current.reviews).toHaveLength(1));
    expect(result.current.reviews[0].studyPeriod).toBe("");
  });

  it("uses anonymousFallback when reviewer has no first/last name", async () => {
    getMock.mockResolvedValue({
      data: {
        reviews: [rawReview({ firstName: "", lastName: "" })],
        totalReviews: 1,
        totalPages: 1,
      },
    });
    const { result } = renderHook(() =>
      useReviewList("Program", "inst-1", mapCats, { anonymousFallback: "Anonymous" })
    );
    await waitFor(() => expect(result.current.reviews).toHaveLength(1));
    expect(result.current.reviews[0].author.name).toBe("Anonymous");
  });

  it("falls back generalRating to 0 when missing", async () => {
    getMock.mockResolvedValue({
      data: {
        // intentionally omit generalRating to test the `?? 0` fallback
        reviews: [
          { ratings: {}, comment: "x", createdAt: "2025-01-01T00:00:00Z" } as never,
        ],
        totalReviews: 1,
        totalPages: 1,
      },
    });
    const { result } = renderHook(() =>
      useReviewList("Program", "inst-1", mapCats)
    );
    await waitFor(() => expect(result.current.reviews).toHaveLength(1));
    expect(result.current.reviews[0].generalRating).toBe(0);
  });

  it("experience falls back to the whole comment when no 'Experience:' marker", async () => {
    getMock.mockResolvedValue({
      data: {
        reviews: [rawReview({ comment: "just a plain comment" })],
        totalReviews: 1,
        totalPages: 1,
      },
    });
    const { result } = renderHook(() =>
      useReviewList("Program", "inst-1", mapCats)
    );
    await waitFor(() => expect(result.current.reviews).toHaveLength(1));
    expect(result.current.reviews[0].experience).toBe("just a plain comment");
    // no "Study Period:" marker → extract yields ""
    expect(result.current.reviews[0].studyPeriod).toBe("");
  });

  it("yields an empty list when the API rejects (getSampleReviews swallows to EMPTY)", async () => {
    getMock.mockRejectedValue(new Error("network down"));
    const { result } = renderHook(() =>
      useReviewList("Program", "inst-1", mapCats)
    );
    // EMPTY.totalPages is 0 → res.totalPages || 1 → 1
    await waitFor(() => expect(result.current.totalPages).toBe(1));
    expect(result.current.reviews).toEqual([]);
  });
});
