/**
 * testimonialsService.test.ts — unit tests for the testimonial join service.
 *
 * fetchTestimonials orchestrates:
 *   1. nodeApi.get("/reviews/latest-reviews-offering-program") → raw reviews
 *   2. Strapi fetches (via @/api/catalog.say → http.get) for institutions,
 *      programs and offerings referenced by the reviews
 *   3. Client-side join; reviews whose Strapi entity is missing are dropped
 *
 * nodeApi and http (@/api/http) are globally mocked (jest.setup.ts). The
 * catalog.say helpers are REAL and call the mocked http.get — we route http.get
 * by URL so the institution/program/offering responses are returned correctly
 * regardless of Promise.all ordering.
 *
 * Also covers the small pure exports:
 *   extractProgramStudied, extractExperience (re-exported).
 */

import {
  fetchTestimonials,
  extractProgramStudied,
  extractExperience,
} from "@/services/testimonialsService";
import { nodeApi } from "@/api/nodeApi";
import { http } from "@/api/http";

// ─── Strapi fixtures (raw Strapi row shapes consumed by catalog.say) ──────────

const INSTITUTION_ROW = {
  id: 10,
  documentId: "inst-doc-1",
  name: "Acme University",
  slug: "acme-university",
  photoCover: { url: "https://strapi/cover.jpg" },
  logo: { url: "https://strapi/logo.png" },
};

const PROGRAM_ROW = {
  documentId: "prog-doc-1",
  name: "Computer Science BSc",
};

const OFFERING_ROW = {
  id: 55,
  documentId: "off-doc-1",
  title: "IELTS Crash Course",
  slug: "ielts-crash-course",
  image: { url: "https://strapi/offering.jpg" },
};

/**
 * Route http.get by URL substring → the catalog.say helper that issued it.
 * Each helper expects a response shaped as { data: { data: StrapiRawItem[] } }.
 */
function routeStrapi(opts: {
  institutions?: unknown[];
  programs?: unknown[];
  offerings?: unknown[];
}) {
  (http.get as jest.Mock).mockImplementation((url: string) => {
    if (url.includes("/api/instituitions")) {
      return Promise.resolve({ data: { data: opts.institutions ?? [] } });
    }
    if (url.includes("/api/programs")) {
      return Promise.resolve({ data: { data: opts.programs ?? [] } });
    }
    if (url.includes("/api/offerings")) {
      return Promise.resolve({ data: { data: opts.offerings ?? [] } });
    }
    return Promise.resolve({ data: { data: [] } });
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── extractProgramStudied (pure) ─────────────────────────────────────────────

describe("extractProgramStudied", () => {
  it("returns the text after 'Program Studied:'", () => {
    expect(extractProgramStudied("Program Studied: Mechanical Engineering")).toBe(
      "Mechanical Engineering"
    );
  });

  it("trims surrounding whitespace", () => {
    expect(extractProgramStudied("Program Studied:   Law   ")).toBe("Law");
  });

  it("returns '' when the marker is absent", () => {
    expect(extractProgramStudied("Some unrelated comment")).toBe("");
  });

  it("returns '' for null/undefined/empty input", () => {
    expect(extractProgramStudied(null)).toBe("");
    expect(extractProgramStudied(undefined)).toBe("");
    expect(extractProgramStudied("")).toBe("");
  });
});

// ─── extractExperience (re-exported from reviewsApi) ──────────────────────────

describe("extractExperience (re-export)", () => {
  it("extracts the text after 'Experience:' up to the first newline", () => {
    expect(extractExperience("Experience: Great teachers\nStudy Period: 2020")).toBe(
      "Great teachers"
    );
  });

  it("returns the whole comment when there is no 'Experience:' marker", () => {
    expect(extractExperience("Just a plain comment")).toBe("Just a plain comment");
  });

  it("returns '' for an empty comment", () => {
    expect(extractExperience("")).toBe("");
  });
});

// ─── fetchTestimonials ────────────────────────────────────────────────────────

describe("fetchTestimonials", () => {
  it("returns [] when the Node endpoint reports no reviews", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: { reviews: [] } });
    const result = await fetchTestimonials("en");
    expect(result).toEqual([]);
    // Short-circuits before hitting Strapi.
    expect(http.get).not.toHaveBeenCalled();
  });

  it("returns [] when the Node response has no reviews field at all", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: {} });
    const result = await fetchTestimonials("en");
    expect(result).toEqual([]);
    expect(http.get).not.toHaveBeenCalled();
  });

  it("maps a Program review using the institution + program Strapi entities", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: {
        reviews: [
          {
            targetType: "Program",
            parentID: "inst-doc-1", // institution documentId
            targetID: "prog-doc-1", // program documentId
            generalRating: 4,
            comment: "Experience: Loved it\nStudy Period: 2021",
            firstName: "Sara",
            photo: { url: "https://node/sara.png" },
          },
        ],
      },
    });
    routeStrapi({ institutions: [INSTITUTION_ROW], programs: [PROGRAM_ROW] });

    const result = await fetchTestimonials("en");

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      imageUrl: "https://strapi/cover.jpg",
      logoUrl: "https://strapi/logo.png",
      title: "Acme University",
      rating: 4,
      testimonial: "Loved it", // extractExperience stops at the newline
      userName: "Sara",
      userAvatar: "https://node/sara.png",
      userProgram: "Computer Science BSc",
      linkHref: "institution-detail/acme-university",
    });
  });

  it("maps an Offering review using the offering Strapi entity (numeric id match)", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: {
        reviews: [
          {
            targetType: "Offering",
            targetID: "55", // string id matched against numeric offering id 55
            generalRating: 5,
            comment: "Absolutely fantastic course", // no Experience: marker → whole comment
            firstName: "Omar",
            photo: "https://node/omar-string.png", // photo as a plain string
          },
        ],
      },
    });
    routeStrapi({ offerings: [OFFERING_ROW] });

    const result = await fetchTestimonials("en");

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      imageUrl: "https://strapi/offering.jpg",
      logoUrl: "", // offerings have no logo
      title: "IELTS Crash Course",
      rating: 5,
      testimonial: "Absolutely fantastic course",
      userName: "Omar",
      userAvatar: "https://node/omar-string.png", // string photo resolved directly
      userProgram: "", // offerings carry no program
      linkHref: "offering-detail/ielts-crash-course",
    });
  });

  it("drops a Program review whose institution is missing from Strapi", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: {
        reviews: [
          {
            targetType: "Program",
            parentID: "missing-inst",
            targetID: "prog-doc-1",
            generalRating: 3,
            comment: "x",
            firstName: "Lost",
          },
        ],
      },
    });
    // Strapi returns no institutions → the review is dropped.
    routeStrapi({ institutions: [], programs: [PROGRAM_ROW] });

    const result = await fetchTestimonials("en");
    expect(result).toEqual([]);
  });

  it("drops an Offering review whose offering is missing from Strapi", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: {
        reviews: [
          {
            targetType: "Offering",
            targetID: "999", // no matching offering
            generalRating: 2,
            comment: "y",
            firstName: "Gone",
          },
        ],
      },
    });
    routeStrapi({ offerings: [OFFERING_ROW] }); // id 55 only → 999 unmatched

    const result = await fetchTestimonials("en");
    expect(result).toEqual([]);
  });

  it("keeps a found Program review but tolerates a missing program (userProgram '')", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: {
        reviews: [
          {
            targetType: "Program",
            parentID: "inst-doc-1",
            targetID: "prog-doc-MISSING",
            generalRating: 4,
            comment: "fine",
            firstName: "Mia",
            // no photo → userAvatar null
          },
        ],
      },
    });
    // Institution present, program list empty → program not found, but the
    // testimonial is still produced (institution drives the card).
    routeStrapi({ institutions: [INSTITUTION_ROW], programs: [] });

    const result = await fetchTestimonials("en");
    expect(result).toHaveLength(1);
    expect(result[0].userProgram).toBe("");
    expect(result[0].userAvatar).toBeNull();
    expect(result[0].title).toBe("Acme University");
  });

  it("defaults rating to 0 and userName to '' when the review omits them", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: {
        reviews: [
          {
            targetType: "Offering",
            targetID: "55",
            // no generalRating, no firstName, no comment, no photo
          },
        ],
      },
    });
    routeStrapi({ offerings: [OFFERING_ROW] });

    const result = await fetchTestimonials("en");
    expect(result).toHaveLength(1);
    expect(result[0].rating).toBe(0);
    expect(result[0].userName).toBe("");
    expect(result[0].testimonial).toBe(""); // extractExperience("") → ""
    expect(result[0].userAvatar).toBeNull();
  });

  it("joins a mix of Program and Offering reviews and preserves Node order", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: {
        reviews: [
          {
            targetType: "Program",
            parentID: "inst-doc-1",
            targetID: "prog-doc-1",
            generalRating: 4,
            comment: "Experience: nice",
            firstName: "A",
          },
          {
            targetType: "Offering",
            targetID: "55",
            generalRating: 5,
            comment: "Experience: super",
            firstName: "B",
          },
        ],
      },
    });
    routeStrapi({
      institutions: [INSTITUTION_ROW],
      programs: [PROGRAM_ROW],
      offerings: [OFFERING_ROW],
    });

    const result = await fetchTestimonials("en");
    expect(result).toHaveLength(2);
    // Order matches the raw reviews iteration order.
    expect(result[0].title).toBe("Acme University");
    expect(result[1].title).toBe("IELTS Crash Course");
  });

  it("passes the requested locale through to the Strapi queries", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: {
        reviews: [
          {
            targetType: "Offering",
            targetID: "55",
            generalRating: 5,
            comment: "ok",
            firstName: "C",
          },
        ],
      },
    });
    routeStrapi({ offerings: [OFFERING_ROW] });

    await fetchTestimonials("ar");

    // The offerings query should carry the ar locale filter.
    const offeringCall = (http.get as jest.Mock).mock.calls.find(([u]: [string]) =>
      u.includes("/api/offerings")
    );
    expect(offeringCall).toBeDefined();
    expect(decodeURIComponent(offeringCall[0])).toContain("filters[locale][$eq]=ar");
  });
});
