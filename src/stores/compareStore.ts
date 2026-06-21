/**
 * compareStore — Zustand store for compare cart (max 5 per type).
 * Mirrors COMPARE_FAVORITES.md spec.
 *
 * Holds the set of compared itemIDs per type.
 * Enforces max 5 client-side.
 */

import { create } from "zustand";
import type { CompareItemType } from "@/api/comparesApi";

const MAX_COMPARE = 5;

interface CompareState {
  /** Map: itemType → Set of compared itemIDs */
  compared: Record<CompareItemType, Set<string>>;

  /** Set the full list of compared ids for a type (after server fetch). */
  setCompared: (type: CompareItemType, ids: string[]) => void;

  /** Add to compare (returns false if limit reached). */
  addCompare: (type: CompareItemType, id: string) => boolean;

  /** Remove from compare. */
  removeCompare: (type: CompareItemType, id: string) => void;

  /** Check if an item is in compare. */
  isCompared: (type: CompareItemType, id: string) => boolean;

  /** Get count for a type. */
  getCount: (type: CompareItemType) => number;
}

export const useCompareStore = create<CompareState>((set, get) => ({
  compared: {
    Program: new Set(),
    Institution: new Set(),
  },

  setCompared: (type, ids) =>
    set((s) => ({
      compared: {
        ...s.compared,
        [type]: new Set(ids),
      },
    })),

  addCompare: (type, id) => {
    const current = get().compared[type];
    if (current.size >= MAX_COMPARE) return false;
    set((s) => {
      const next = new Set(s.compared[type]);
      next.add(id);
      return { compared: { ...s.compared, [type]: next } };
    });
    return true;
  },

  removeCompare: (type, id) =>
    set((s) => {
      const next = new Set(s.compared[type]);
      next.delete(id);
      return { compared: { ...s.compared, [type]: next } };
    }),

  isCompared: (type, id) => get().compared[type].has(id),

  getCount: (type) => get().compared[type].size,
}));
