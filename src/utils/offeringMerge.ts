/**
 * offeringMerge.ts — shared util for merging Strapi offering items with Node offering items.
 *
 * mergeOfferingsByContentId
 *   - Keys strapiItems by `item.id` (number).
 *   - For each nodeItem, looks up `Number(nodeItem.offeringContentId)` in the map.
 *   - Only returns items that matched in BOTH sources (drops unmatched strapi items).
 *   - Preserves the exact merged shape { ...strapiItem, ...extras } both call sites expect:
 *       offeringsApi.listPage:    { ...strapiItem, nodeData: nodeItem, ratingStars: 0 }
 *       OfferingsFavoriteTab:     { ...strapiItem, sessionDuration: nodeItem.sessionDuration }
 *
 * The `mergeExtra` callback lets each call site define what extra fields to attach.
 *
 * Usage:
 *   // offeringsApi.listPage:
 *   mergeOfferingsByContentId(strapiItems, nodeItems, (s, n) => ({ nodeData: n, ratingStars: 0 }))
 *
 *   // OfferingsFavoriteTab:
 *   mergeOfferingsByContentId(strapiItems, nodeItems, (_, n) => ({ sessionDuration: n.sessionDuration }))
 */

export interface HasOfferingContentId {
  offeringContentId: string;
}

export interface HasStrapiId {
  id: number;
}

export function mergeOfferingsByContentId<S extends HasStrapiId, N extends HasOfferingContentId, E>(
  strapiItems: S[],
  nodeItems: N[],
  mergeExtra: (strapiItem: S, nodeItem: N) => E
): (S & E)[] {
  const strapiMap = new Map<number, S>(strapiItems.map((s) => [s.id, s]));

  const result: (S & E)[] = [];
  for (const nodeItem of nodeItems) {
    const strapiItem = strapiMap.get(Number(nodeItem.offeringContentId));
    if (!strapiItem) continue;
    result.push({ ...strapiItem, ...mergeExtra(strapiItem, nodeItem) });
  }
  return result;
}
