/**
 * compareStore.test.ts — unit tests for the Zustand compare cart store.
 *
 * Coverage:
 *   setCompared   — sets the full list for a type, replaces previous state.
 *   addCompare    — adds an item; returns true on success.
 *   addCompare    — max-5 enforcement: 6th add returns false, item not added.
 *   removeCompare — removes an item; other items unaffected.
 *   isCompared    — correct true/false; cross-type isolation.
 *   getCount      — correct count after add/remove/setCompared.
 *   type isolation — Program and Institution slots are independent.
 *
 * Pure Zustand store — no RN modules, no hooks needed.
 * State is reset before each test by calling setCompared(type, []).
 */

import { useCompareStore } from "@/stores/compareStore";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Reset both type slots to empty before each test. */
beforeEach(() => {
  const { setCompared } = useCompareStore.getState();
  setCompared("Program", []);
  setCompared("Institution", []);
});

// ─── setCompared ──────────────────────────────────────────────────────────────

describe("setCompared", () => {
  it("populates the Program slot with the given ids", () => {
    const { setCompared, isCompared, getCount } = useCompareStore.getState();
    setCompared("Program", ["p1", "p2", "p3"]);
    expect(getCount("Program")).toBe(3);
    expect(isCompared("Program", "p1")).toBe(true);
    expect(isCompared("Program", "p2")).toBe(true);
    expect(isCompared("Program", "p3")).toBe(true);
  });

  it("replaces existing state with the new list", () => {
    const { setCompared, isCompared } = useCompareStore.getState();
    setCompared("Program", ["old1", "old2"]);
    setCompared("Program", ["new1"]);
    expect(isCompared("Program", "old1")).toBe(false);
    expect(isCompared("Program", "new1")).toBe(true);
  });

  it("clears the slot when given an empty array", () => {
    const { setCompared, getCount } = useCompareStore.getState();
    setCompared("Institution", ["i1"]);
    setCompared("Institution", []);
    expect(getCount("Institution")).toBe(0);
  });

  it("does not affect the other type slot", () => {
    const { setCompared, getCount } = useCompareStore.getState();
    setCompared("Program", ["p1"]);
    expect(getCount("Institution")).toBe(0);
  });
});

// ─── addCompare ───────────────────────────────────────────────────────────────

describe("addCompare", () => {
  it("returns true and adds the item", () => {
    const { addCompare, isCompared } = useCompareStore.getState();
    const result = addCompare("Program", "p1");
    expect(result).toBe(true);
    expect(isCompared("Program", "p1")).toBe(true);
  });

  it("adding up to 5 items all return true", () => {
    const { addCompare } = useCompareStore.getState();
    const results = ["p1", "p2", "p3", "p4", "p5"].map((id) => addCompare("Program", id));
    expect(results).toEqual([true, true, true, true, true]);
  });

  it("max-5 enforcement: 6th add returns false", () => {
    const { addCompare, getCount } = useCompareStore.getState();
    ["p1", "p2", "p3", "p4", "p5"].forEach((id) => addCompare("Program", id));
    const result = addCompare("Program", "p6");
    expect(result).toBe(false);
    expect(getCount("Program")).toBe(5);
  });

  it("6th item is not added to the store when limit reached", () => {
    const { addCompare, isCompared } = useCompareStore.getState();
    ["p1", "p2", "p3", "p4", "p5"].forEach((id) => addCompare("Program", id));
    addCompare("Program", "p6");
    expect(isCompared("Program", "p6")).toBe(false);
  });

  it("adding a duplicate does not increase the count (Set semantics)", () => {
    const { addCompare, getCount } = useCompareStore.getState();
    addCompare("Program", "p1");
    addCompare("Program", "p1");
    expect(getCount("Program")).toBe(1);
  });

  it("Institution slot is independent from Program slot", () => {
    const { addCompare, getCount } = useCompareStore.getState();
    ["p1", "p2", "p3", "p4", "p5"].forEach((id) => addCompare("Program", id));
    // Can still add to Institution
    const result = addCompare("Institution", "i1");
    expect(result).toBe(true);
    expect(getCount("Institution")).toBe(1);
  });
});

// ─── removeCompare ────────────────────────────────────────────────────────────

describe("removeCompare", () => {
  it("removes the specified item", () => {
    const { addCompare, removeCompare, isCompared } = useCompareStore.getState();
    addCompare("Program", "p1");
    addCompare("Program", "p2");
    removeCompare("Program", "p1");
    expect(isCompared("Program", "p1")).toBe(false);
  });

  it("does not affect other items in the same slot", () => {
    const { addCompare, removeCompare, isCompared } = useCompareStore.getState();
    addCompare("Program", "p1");
    addCompare("Program", "p2");
    removeCompare("Program", "p1");
    expect(isCompared("Program", "p2")).toBe(true);
  });

  it("decrements the count", () => {
    const { addCompare, removeCompare, getCount } = useCompareStore.getState();
    addCompare("Program", "p1");
    addCompare("Program", "p2");
    removeCompare("Program", "p1");
    expect(getCount("Program")).toBe(1);
  });

  it("removing a non-existent item is a no-op (no throw)", () => {
    const { removeCompare, getCount } = useCompareStore.getState();
    expect(() => removeCompare("Program", "nonexistent")).not.toThrow();
    expect(getCount("Program")).toBe(0);
  });

  it("after removing all 5, a new item can be added", () => {
    const { addCompare, removeCompare, getCount } = useCompareStore.getState();
    const ids = ["p1", "p2", "p3", "p4", "p5"];
    ids.forEach((id) => addCompare("Program", id));
    ids.forEach((id) => removeCompare("Program", id));
    const result = addCompare("Program", "p6");
    expect(result).toBe(true);
    expect(getCount("Program")).toBe(1);
  });
});

// ─── isCompared ───────────────────────────────────────────────────────────────

describe("isCompared", () => {
  it("returns false for an item not in the store", () => {
    expect(useCompareStore.getState().isCompared("Program", "absent")).toBe(false);
  });

  it("returns true after adding the item", () => {
    const { addCompare, isCompared } = useCompareStore.getState();
    addCompare("Institution", "i99");
    expect(isCompared("Institution", "i99")).toBe(true);
  });

  it("cross-type: Program item is NOT in Institution slot", () => {
    const { addCompare, isCompared } = useCompareStore.getState();
    addCompare("Program", "shared-id");
    expect(isCompared("Institution", "shared-id")).toBe(false);
  });
});

// ─── getCount ─────────────────────────────────────────────────────────────────

describe("getCount", () => {
  it("returns 0 for an empty slot", () => {
    expect(useCompareStore.getState().getCount("Program")).toBe(0);
  });

  it("returns the correct count after multiple adds", () => {
    const { addCompare, getCount } = useCompareStore.getState();
    addCompare("Program", "p1");
    addCompare("Program", "p2");
    expect(getCount("Program")).toBe(2);
  });

  it("returns the count from setCompared", () => {
    const { setCompared, getCount } = useCompareStore.getState();
    setCompared("Institution", ["i1", "i2", "i3", "i4"]);
    expect(getCount("Institution")).toBe(4);
  });

  it("tracks Program and Institution counts independently", () => {
    const { addCompare, getCount } = useCompareStore.getState();
    addCompare("Program", "p1");
    addCompare("Program", "p2");
    addCompare("Institution", "i1");
    expect(getCount("Program")).toBe(2);
    expect(getCount("Institution")).toBe(1);
  });
});
