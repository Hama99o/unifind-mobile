/**
 * strapiQuery.test.ts — unit tests for addPopulate (Strapi populate builder).
 *
 * Pure function operating on a URLSearchParams. No network. Mirrors the web
 * API.service.tsx addPopulate helper.
 *
 * Coverage:
 *   - array form: appends populate[prefix][fields][i]
 *   - object form with fields only
 *   - object form with nested populate (recursion + prefix nesting)
 *   - deep recursion (object → object → array)
 *   - empty array / empty object inputs
 *   - multiple sub-keys under one populate
 */

import { addPopulate } from "@/api/strapiQuery";

describe("addPopulate", () => {
  it("appends one fields entry per element when given a string array", () => {
    const params = new URLSearchParams();
    addPopulate(params, "logo", ["url", "alt"]);
    expect(params.get("populate[logo][fields][0]")).toBe("url");
    expect(params.get("populate[logo][fields][1]")).toBe("alt");
    // Only the two fields entries should exist
    expect(Array.from(params.keys())).toEqual([
      "populate[logo][fields][0]",
      "populate[logo][fields][1]",
    ]);
  });

  it("appends nothing for an empty string array", () => {
    const params = new URLSearchParams();
    addPopulate(params, "logo", []);
    expect(Array.from(params.keys())).toEqual([]);
  });

  it("appends fields entries from the object's fields property", () => {
    const params = new URLSearchParams();
    addPopulate(params, "mainLocation", { fields: ["street", "zip"] });
    expect(params.get("populate[mainLocation][fields][0]")).toBe("street");
    expect(params.get("populate[mainLocation][fields][1]")).toBe("zip");
  });

  it("does nothing for an object with neither fields nor populate", () => {
    const params = new URLSearchParams();
    addPopulate(params, "x", {});
    expect(Array.from(params.keys())).toEqual([]);
  });

  it("recurses into nested populate, nesting the prefix as [populate][subKey]", () => {
    const params = new URLSearchParams();
    addPopulate(params, "campus", {
      fields: ["name"],
      populate: {
        location: { fields: ["street"] },
      },
    });
    // own fields
    expect(params.get("populate[campus][fields][0]")).toBe("name");
    // nested location fields — prefix becomes `campus][populate][location`
    expect(
      params.get("populate[campus][populate][location][fields][0]")
    ).toBe("street");
  });

  it("recurses multiple levels deep (object → object → array)", () => {
    const params = new URLSearchParams();
    addPopulate(params, "campus", {
      populate: {
        location: {
          populate: {
            city: ["name"], // array form at the leaf
          },
        },
      },
    });
    expect(
      params.get(
        "populate[campus][populate][location][populate][city][fields][0]"
      )
    ).toBe("name");
  });

  it("handles multiple sub-keys under one populate", () => {
    const params = new URLSearchParams();
    addPopulate(params, "institution", {
      populate: {
        logo: ["url"],
        tuition: { fields: ["minTuition", "maxTuition"] },
      },
    });
    expect(
      params.get("populate[institution][populate][logo][fields][0]")
    ).toBe("url");
    expect(
      params.get("populate[institution][populate][tuition][fields][0]")
    ).toBe("minTuition");
    expect(
      params.get("populate[institution][populate][tuition][fields][1]")
    ).toBe("maxTuition");
  });

  it("emits both fields AND nested populate for the same object", () => {
    const params = new URLSearchParams();
    addPopulate(params, "campus", {
      fields: ["name", "code"],
      populate: { location: ["street"] },
    });
    expect(params.getAll("populate[campus][fields][0]")).toEqual(["name"]);
    expect(params.get("populate[campus][fields][1]")).toBe("code");
    expect(
      params.get("populate[campus][populate][location][fields][0]")
    ).toBe("street");
  });
});
