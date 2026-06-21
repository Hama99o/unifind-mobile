/**
 * ratings.ts — shared util for injecting per-item average ratings.
 *
 * injectAvgRatings<T>
 *   - Fetches avg rating for each item in parallel (Promise.all).
 *   - Per-item failure → 0 (does NOT break the batch).
 *   - Missing/undefined id → 0, item still included.
 *   - Output key is always `ratingStars`.
 *
 * Default fetchAvg = reviewsApi.getInstitutionAvgRating (override for other types).
 */

import { reviewsApi } from "@/api/reviewsApi";

export async function injectAvgRatings<T>(
  items: T[],
  getId: (item: T) => string | undefined,
  fetchAvg: (id: string) => Promise<number> = reviewsApi.getInstitutionAvgRating.bind(reviewsApi)
): Promise<(T & { ratingStars: number })[]> {
  return Promise.all(
    items.map(async (item) => {
      const id = getId(item);
      let ratingStars = 0;
      if (id) {
        try {
          ratingStars = await fetchAvg(id);
        } catch {
          ratingStars = 0;
        }
      }
      return { ...item, ratingStars };
    })
  );
}
