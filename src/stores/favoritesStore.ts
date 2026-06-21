/**
 * favoritesStore — Zustand store for optimistic favorites toggling.
 * Mirrors COMPARE_FAVORITES.md spec.
 *
 * Holds the set of favorited itemIDs per type.
 * Callers should reconcile with server after optimistic toggle.
 */

import { create } from "zustand";
import type { FavoriteItemType } from "@/api/favoritesApi";

interface FavoritesState {
  /** Map: itemType → Set of favorited itemIDs */
  favorites: Record<FavoriteItemType, Set<string>>;

  /** Set the full list of favorite ids for a type (after server fetch). */
  setFavorites: (type: FavoriteItemType, ids: string[]) => void;

  /** Optimistically add a favorite. */
  addFavorite: (type: FavoriteItemType, id: string) => void;

  /** Optimistically remove a favorite. */
  removeFavorite: (type: FavoriteItemType, id: string) => void;

  /** Check if an item is favorited. */
  isFavorite: (type: FavoriteItemType, id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: {
    Program: new Set(),
    Institution: new Set(),
    Offering: new Set(),
    Specialist: new Set(),
  },

  setFavorites: (type, ids) =>
    set((s) => ({
      favorites: {
        ...s.favorites,
        [type]: new Set(ids),
      },
    })),

  addFavorite: (type, id) =>
    set((s) => {
      const next = new Set(s.favorites[type]);
      next.add(id);
      return { favorites: { ...s.favorites, [type]: next } };
    }),

  removeFavorite: (type, id) =>
    set((s) => {
      const next = new Set(s.favorites[type]);
      next.delete(id);
      return { favorites: { ...s.favorites, [type]: next } };
    }),

  isFavorite: (type, id) => get().favorites[type].has(id),
}));
