/**
 * favoritesStore.test.ts — unit tests for the Zustand favorites store.
 *
 * Coverage:
 *   setFavorites  — sets the full list for a type, replaces previous state.
 *   addFavorite   — adds an item; dedup via Set semantics.
 *   removeFavorite— removes an item; other items unaffected; no-op on absent.
 *   isFavorite    — correct true/false; cross-type isolation.
 *   type isolation — Program / Institution / Offering / Specialist independent.
 *
 * Pure Zustand store — no RN modules, no hooks needed.
 * State is reset before each test by clearing every type slot via setFavorites.
 */

import { useFavoritesStore } from "@/stores/favoritesStore";
import type { FavoriteItemType } from "@/api/favoritesApi";

const ALL_TYPES: FavoriteItemType[] = [
  "Program",
  "Institution",
  "Offering",
  "Specialist",
];

// ─── Reset ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  const { setFavorites } = useFavoritesStore.getState();
  ALL_TYPES.forEach((t) => setFavorites(t, []));
});

// ─── setFavorites ────────────────────────────────────────────────────────────

describe("setFavorites", () => {
  it("populates a slot with the given ids", () => {
    const { setFavorites, isFavorite } = useFavoritesStore.getState();
    setFavorites("Program", ["p1", "p2"]);
    expect(isFavorite("Program", "p1")).toBe(true);
    expect(isFavorite("Program", "p2")).toBe(true);
  });

  it("replaces existing state with the new list", () => {
    const { setFavorites, isFavorite } = useFavoritesStore.getState();
    setFavorites("Institution", ["old"]);
    setFavorites("Institution", ["new"]);
    expect(isFavorite("Institution", "old")).toBe(false);
    expect(isFavorite("Institution", "new")).toBe(true);
  });

  it("clears the slot when given an empty array", () => {
    const { setFavorites, isFavorite } = useFavoritesStore.getState();
    setFavorites("Offering", ["o1"]);
    setFavorites("Offering", []);
    expect(isFavorite("Offering", "o1")).toBe(false);
  });

  it("dedups duplicate ids in the input list (Set semantics)", () => {
    const { setFavorites } = useFavoritesStore.getState();
    setFavorites("Program", ["dup", "dup", "dup"]);
    // Re-read state to get the updated Set.
    const set = useFavoritesStore.getState().favorites.Program;
    expect(set.size).toBe(1);
    expect(set.has("dup")).toBe(true);
  });

  it("does not affect other type slots", () => {
    const { setFavorites, isFavorite } = useFavoritesStore.getState();
    setFavorites("Program", ["p1"]);
    expect(isFavorite("Institution", "p1")).toBe(false);
    expect(isFavorite("Offering", "p1")).toBe(false);
    expect(isFavorite("Specialist", "p1")).toBe(false);
  });
});

// ─── addFavorite ─────────────────────────────────────────────────────────────

describe("addFavorite", () => {
  it("adds an item to the slot", () => {
    const { addFavorite, isFavorite } = useFavoritesStore.getState();
    addFavorite("Program", "p1");
    expect(isFavorite("Program", "p1")).toBe(true);
  });

  it("adding a duplicate does not increase the set size (Set semantics)", () => {
    const { addFavorite } = useFavoritesStore.getState();
    addFavorite("Program", "p1");
    addFavorite("Program", "p1");
    expect(useFavoritesStore.getState().favorites.Program.size).toBe(1);
  });

  it("supports many distinct items (no max-cap unlike compare)", () => {
    const { addFavorite } = useFavoritesStore.getState();
    ["a", "b", "c", "d", "e", "f", "g"].forEach((id) =>
      addFavorite("Institution", id)
    );
    expect(useFavoritesStore.getState().favorites.Institution.size).toBe(7);
  });

  it("adds independently per type", () => {
    const { addFavorite, isFavorite } = useFavoritesStore.getState();
    addFavorite("Specialist", "s1");
    expect(isFavorite("Specialist", "s1")).toBe(true);
    expect(isFavorite("Program", "s1")).toBe(false);
  });
});

// ─── removeFavorite ────────────────────────────────────────────────────────────

describe("removeFavorite", () => {
  it("removes the specified item", () => {
    const { addFavorite, removeFavorite, isFavorite } =
      useFavoritesStore.getState();
    addFavorite("Program", "p1");
    addFavorite("Program", "p2");
    removeFavorite("Program", "p1");
    expect(isFavorite("Program", "p1")).toBe(false);
  });

  it("does not affect other items in the same slot", () => {
    const { addFavorite, removeFavorite, isFavorite } =
      useFavoritesStore.getState();
    addFavorite("Program", "p1");
    addFavorite("Program", "p2");
    removeFavorite("Program", "p1");
    expect(isFavorite("Program", "p2")).toBe(true);
  });

  it("removing a non-existent item is a no-op (no throw)", () => {
    const { removeFavorite } = useFavoritesStore.getState();
    expect(() => removeFavorite("Program", "ghost")).not.toThrow();
    expect(useFavoritesStore.getState().favorites.Program.size).toBe(0);
  });
});

// ─── isFavorite ────────────────────────────────────────────────────────────────

describe("isFavorite", () => {
  it("returns false for an item not in the store", () => {
    expect(useFavoritesStore.getState().isFavorite("Program", "absent")).toBe(
      false
    );
  });

  it("returns true after adding the item", () => {
    const { addFavorite, isFavorite } = useFavoritesStore.getState();
    addFavorite("Offering", "o99");
    expect(isFavorite("Offering", "o99")).toBe(true);
  });

  it("cross-type: a Program item is NOT in the Institution slot", () => {
    const { addFavorite, isFavorite } = useFavoritesStore.getState();
    addFavorite("Program", "shared");
    expect(isFavorite("Institution", "shared")).toBe(false);
  });
});

// ─── type isolation ─────────────────────────────────────────────────────────────

describe("type isolation", () => {
  it("tracks all four type slots independently", () => {
    const { addFavorite, favorites } = useFavoritesStore.getState();
    addFavorite("Program", "p1");
    addFavorite("Institution", "i1");
    addFavorite("Offering", "o1");
    addFavorite("Specialist", "s1");
    const state = useFavoritesStore.getState().favorites;
    expect(state.Program.size).toBe(1);
    expect(state.Institution.size).toBe(1);
    expect(state.Offering.size).toBe(1);
    expect(state.Specialist.size).toBe(1);
    // destructured snapshot reference is a record with all four keys
    expect(Object.keys(favorites).sort()).toEqual(
      ["Institution", "Offering", "Program", "Specialist"].sort()
    );
  });
});
