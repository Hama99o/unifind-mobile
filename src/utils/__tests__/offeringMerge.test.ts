/**
 * offeringMerge.test.ts — unit tests for mergeOfferingsByContentId.
 *
 * Validates:
 *   - Correct merging when offeringContentId matches strapi item id.
 *   - Unmatched node items are dropped (no strapi counterpart).
 *   - Unmatched strapi items are dropped (no node counterpart).
 *   - mergeExtra callback is called with the correct pair.
 *   - Empty inputs produce empty output.
 *   - offeringContentId is coerced to number for the map lookup.
 */

import {
  mergeOfferingsByContentId,
  type HasOfferingContentId,
  type HasStrapiId,
} from "@/utils/offeringMerge";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

interface StrapiOffering extends HasStrapiId {
  id: number;
  title: string;
}

interface NodeOffering extends HasOfferingContentId {
  offeringContentId: string;
  sessionDuration: number;
  nodeId: string;
}

const strapiItems: StrapiOffering[] = [
  { id: 1, title: "IELTS Preparation" },
  { id: 2, title: "SAT Math" },
  { id: 3, title: "Python for Beginners" },
  { id: 4, title: "Unmatched Strapi Only" },
];

const nodeItems: NodeOffering[] = [
  { offeringContentId: "1", sessionDuration: 60, nodeId: "n1" },
  { offeringContentId: "2", sessionDuration: 90, nodeId: "n2" },
  { offeringContentId: "3", sessionDuration: 45, nodeId: "n3" },
  { offeringContentId: "999", sessionDuration: 30, nodeId: "n_orphan" }, // No strapi match
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("mergeOfferingsByContentId", () => {
  it("returns only items matched in BOTH strapi and node sources", () => {
    const result = mergeOfferingsByContentId(
      strapiItems,
      nodeItems,
      (_, n) => ({ sessionDuration: n.sessionDuration })
    );
    // 3 matched (ids 1,2,3); id 4 (strapi only) + id 999 (node only) dropped
    expect(result).toHaveLength(3);
  });

  it("attaches the mergeExtra fields onto the result", () => {
    const result = mergeOfferingsByContentId(
      strapiItems,
      nodeItems,
      (_, n) => ({ sessionDuration: n.sessionDuration, nodeId: n.nodeId })
    );
    const ielts = result.find((r) => r.id === 1);
    expect(ielts).toBeDefined();
    expect(ielts?.title).toBe("IELTS Preparation");
    expect(ielts?.sessionDuration).toBe(60);
    expect(ielts?.nodeId).toBe("n1");
  });

  it("preserves all strapi fields on the merged result", () => {
    const result = mergeOfferingsByContentId(
      strapiItems,
      nodeItems,
      (_, n) => ({ sessionDuration: n.sessionDuration })
    );
    const sat = result.find((r) => r.id === 2);
    expect(sat?.title).toBe("SAT Math");
    expect(sat?.id).toBe(2);
  });

  it("drops node items with no matching strapi entry (orphaned node item)", () => {
    const result = mergeOfferingsByContentId(
      strapiItems,
      nodeItems,
      (_, n) => ({ sessionDuration: n.sessionDuration })
    );
    const orphan = result.find((r) => (r as { nodeId?: string }).nodeId === "n_orphan");
    expect(orphan).toBeUndefined();
  });

  it("drops strapi items with no matching node entry", () => {
    const result = mergeOfferingsByContentId(
      strapiItems,
      nodeItems,
      (_, n) => ({ sessionDuration: n.sessionDuration })
    );
    const unmatchedStrapi = result.find((r) => r.id === 4);
    expect(unmatchedStrapi).toBeUndefined();
  });

  it("coerces offeringContentId string to number for lookup", () => {
    // offeringContentId "3" (string) should match strapi id 3 (number)
    const result = mergeOfferingsByContentId(
      strapiItems,
      [{ offeringContentId: "3", sessionDuration: 45, nodeId: "n3" }],
      (_, n) => ({ sessionDuration: n.sessionDuration })
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(3);
  });

  it("calls mergeExtra with the correct strapi item and node item", () => {
    const mergeExtra = jest.fn((s: StrapiOffering, n: NodeOffering) => ({
      sessionDuration: n.sessionDuration,
    }));

    mergeOfferingsByContentId(
      [strapiItems[0]],
      [nodeItems[0]],
      mergeExtra
    );

    expect(mergeExtra).toHaveBeenCalledTimes(1);
    expect(mergeExtra).toHaveBeenCalledWith(strapiItems[0], nodeItems[0]);
  });

  it("returns [] for empty strapi input", () => {
    const result = mergeOfferingsByContentId(
      [],
      nodeItems,
      (_, n) => ({ sessionDuration: n.sessionDuration })
    );
    expect(result).toEqual([]);
  });

  it("returns [] for empty node input", () => {
    const result = mergeOfferingsByContentId(
      strapiItems,
      [],
      (_, n) => ({ sessionDuration: (n as NodeOffering).sessionDuration })
    );
    expect(result).toEqual([]);
  });

  it("returns [] for both inputs empty", () => {
    const result = mergeOfferingsByContentId([], [], () => ({}));
    expect(result).toEqual([]);
  });

  it("supports the offeringsApi usage pattern (nodeData + ratingStars)", () => {
    const result = mergeOfferingsByContentId(
      [{ id: 1, title: "IELTS" }],
      [{ offeringContentId: "1", sessionDuration: 60, nodeId: "n1" }],
      (_, n) => ({ nodeData: n, ratingStars: 0 })
    );
    expect(result[0].nodeData).toBeDefined();
    expect(result[0].ratingStars).toBe(0);
  });
});
