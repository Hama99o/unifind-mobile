/**
 * ratings.test.ts — unit tests for injectAvgRatings.
 *
 * injectAvgRatings(items, getId, fetchAvg?):
 *   - For each item: id = getId(item); if id → fetchAvg(id), else 0.
 *   - Per-item fetchAvg rejection → ratingStars = 0 (does NOT break the batch).
 *   - Always attaches `ratingStars` (and spreads the original item).
 *   - Order is preserved (Promise.all over items.map).
 *   - Default fetchAvg = reviewsApi.getInstitutionAvgRating — but we always pass
 *     our own injectable fetchAvg so no network is touched.
 */

import { injectAvgRatings } from "@/utils/ratings";

interface Item {
  id?: string;
  name: string;
}

describe("injectAvgRatings", () => {
  it("returns [] for an empty input array (and never calls fetchAvg)", async () => {
    const fetchAvg = jest.fn(async () => 5);
    const result = await injectAvgRatings<Item>([], (i) => i.id, fetchAvg);
    expect(result).toEqual([]);
    expect(fetchAvg).not.toHaveBeenCalled();
  });

  it("injects the fetched rating onto a single item", async () => {
    const fetchAvg = jest.fn(async () => 4.5);
    const result = await injectAvgRatings<Item>(
      [{ id: "a", name: "Alpha" }],
      (i) => i.id,
      fetchAvg
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ id: "a", name: "Alpha", ratingStars: 4.5 });
    expect(fetchAvg).toHaveBeenCalledTimes(1);
    expect(fetchAvg).toHaveBeenCalledWith("a");
  });

  it("preserves all original item fields alongside ratingStars", async () => {
    const fetchAvg = jest.fn(async () => 3);
    const [out] = await injectAvgRatings<Item>(
      [{ id: "x", name: "Xavier" }],
      (i) => i.id,
      fetchAvg
    );
    expect(out.id).toBe("x");
    expect(out.name).toBe("Xavier");
    expect(out.ratingStars).toBe(3);
  });

  it("fetches ratings for multiple items, in order, calling fetchAvg with each id", async () => {
    const ratings: Record<string, number> = { a: 4, b: 2, c: 5 };
    const fetchAvg = jest.fn(async (id: string) => ratings[id]);
    const result = await injectAvgRatings<Item>(
      [
        { id: "a", name: "A" },
        { id: "b", name: "B" },
        { id: "c", name: "C" },
      ],
      (i) => i.id,
      fetchAvg
    );
    expect(result.map((r) => r.ratingStars)).toEqual([4, 2, 5]);
    expect(result.map((r) => r.name)).toEqual(["A", "B", "C"]);
    expect(fetchAvg).toHaveBeenCalledTimes(3);
    expect(fetchAvg.mock.calls.map((c: string[]) => c[0])).toEqual(["a", "b", "c"]);
  });

  it("uses 0 (and does NOT call fetchAvg) when getId returns undefined", async () => {
    const fetchAvg = jest.fn(async () => 9);
    const result = await injectAvgRatings<Item>(
      [{ name: "no-id" }],
      (i) => i.id,
      fetchAvg
    );
    expect(result[0].ratingStars).toBe(0);
    expect(result[0].name).toBe("no-id");
    expect(fetchAvg).not.toHaveBeenCalled();
  });

  it("falls back to 0 when fetchAvg rejects for an item, without breaking the batch", async () => {
    const fetchAvg = jest.fn(async (id: string) => {
      if (id === "bad") throw new Error("network down");
      return 5;
    });
    const result = await injectAvgRatings<Item>(
      [
        { id: "good", name: "Good" },
        { id: "bad", name: "Bad" },
      ],
      (i) => i.id,
      fetchAvg
    );
    expect(result).toHaveLength(2);
    expect(result.find((r) => r.id === "good")?.ratingStars).toBe(5);
    // Per-item failure is swallowed → 0.
    expect(result.find((r) => r.id === "bad")?.ratingStars).toBe(0);
  });

  it("mixes id/no-id and success/failure items correctly", async () => {
    const fetchAvg = jest.fn(async (id: string) => {
      if (id === "err") throw new Error("boom");
      return 4.2;
    });
    const result = await injectAvgRatings<Item>(
      [
        { id: "ok", name: "Ok" },
        { name: "Missing" }, // no id → 0, no fetch
        { id: "err", name: "Err" }, // fetch rejects → 0
      ],
      (i) => i.id,
      fetchAvg
    );
    expect(result.map((r) => r.ratingStars)).toEqual([4.2, 0, 0]);
    // fetchAvg called only for the two items that had an id.
    expect(fetchAvg).toHaveBeenCalledTimes(2);
  });

  it("treats an empty-string id as falsy → 0 and no fetch", async () => {
    const fetchAvg = jest.fn(async () => 7);
    const result = await injectAvgRatings<Item>(
      [{ id: "", name: "Empty" }],
      (i) => i.id,
      fetchAvg
    );
    expect(result[0].ratingStars).toBe(0);
    expect(fetchAvg).not.toHaveBeenCalled();
  });

  it("does not mutate the input items (returns new objects)", async () => {
    const fetchAvg = jest.fn(async () => 1);
    const input: Item[] = [{ id: "a", name: "A" }];
    const result = await injectAvgRatings<Item>(input, (i) => i.id, fetchAvg);
    expect(input[0]).not.toHaveProperty("ratingStars");
    expect(result[0]).not.toBe(input[0]);
  });
});
