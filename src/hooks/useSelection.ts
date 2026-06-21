/**
 * useSelection — ONE canonical favorite + compare toggle hook.
 *
 * H1 fix: replaces 7 copy-pasted handlers across:
 *   useInstitutionsData, useProgramsData, useOfferingsData,
 *   useProgramSelection, InstitutionDetailScreen, OfferingDetailScreen,
 *   OfferingSpecialistSection, FacultyAccordion.
 *
 * Owns:
 *   - Auth gate (opens SignInSheet when logged out)
 *   - Optimistic toggle + rollback on error + showToast
 *   - Max-5 via compareStore.addCompare (the store is the single source)
 *   - seedSelection(types) — loads favorites + compares from server for given types
 *
 * userId fix: the Node FavoriteController IGNORES the :userId path param and
 * authorizes off req.user.sub (token). We standardize to authStore user.userID
 * everywhere (= sub.split("|")[1]) and remove the three divergent derivations
 * (raw sub vs split("|").pop() vs userID).
 *
 * No circular deps: imports stores + api + auth helpers only.
 */

import { useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useFavoritesStore } from "@/stores/favoritesStore";
import { useCompareStore } from "@/stores/compareStore";
import { useAuthGate } from "@/auth/useAuthGate";
import { favoritesApi } from "@/api/favoritesApi";
import { comparesApi } from "@/api/comparesApi";
import { showToast } from "@/stores/toastStore";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import type { FavoriteItemType } from "@/api/favoritesApi";
import type { CompareItemType } from "@/api/comparesApi";

/** All types that can be favorited */
export type SelectionFavoriteType = FavoriteItemType;
/** All types that support compare (subset of favorite types) */
export type SelectionCompareType = CompareItemType;

/** Item types for seedSelection */
export type ItemType = FavoriteItemType | CompareItemType;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSelection() {
  const { t } = useCustomTranslation();
  const { requireAuth } = useAuthGate();
  const { isLoggedIn } = useAuthStore();
  const favStore = useFavoritesStore();
  const compareStore = useCompareStore();

  /**
   * Canonical userId: authStore user.userID = sub.split("|")[1].
   * The backend ignores this param and authorizes off the token,
   * but we still pass a consistent value for path construction.
   */
  const getUserId = useCallback((): string => {
    return useAuthStore.getState().user?.userID ?? "";
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const isFavorite = useCallback(
    (type: SelectionFavoriteType, id: string) => favStore.isFavorite(type, id),
    [favStore]
  );

  const isCompared = useCallback(
    (type: SelectionCompareType, id: string) => compareStore.isCompared(type, id),
    [compareStore]
  );

  // ── Favorite toggle ─────────────────────────────────────────────────────────

  const toggleFavorite = useCallback(
    (type: SelectionFavoriteType, id: string) => {
      requireAuth(async () => {
        const wasFav = favStore.isFavorite(type, id);
        // Optimistic
        if (wasFav) favStore.removeFavorite(type, id);
        else favStore.addFavorite(type, id);
        try {
          await favoritesApi.toggleFavorite(id, type);
        } catch {
          // Rollback
          if (wasFav) favStore.addFavorite(type, id);
          else favStore.removeFavorite(type, id);
          showToast(t("failedUpdateFavorite"));
        }
      });
    },
    [requireAuth, favStore, t]
  );

  // ── Compare toggle ───────────────────────────────────────────────────────────

  const toggleCompare = useCallback(
    (type: SelectionCompareType, id: string) => {
      requireAuth(async () => {
        const wasCompared = compareStore.isCompared(type, id);

        if (wasCompared) {
          // Remove from compare
          compareStore.removeCompare(type, id);
          try {
            await comparesApi.toggleCompare(id, type);
          } catch {
            // Rollback
            compareStore.addCompare(type, id);
            showToast(t("failedUpdateComparison"));
          }
        } else {
          // Add to compare — max-5 enforced by the store
          const added = compareStore.addCompare(type, id);
          if (!added) {
            // Determine message by type for specificity
            const limitKey =
              type === "Program" ? "compareProgramsLimit" : "compareInstitutionsLimit";
            showToast(t(limitKey));
            return;
          }
          try {
            const res = await comparesApi.toggleCompare(id, type);
            if (res.type === "success") {
              const newCount = res.compareCount ?? compareStore.getCount(type);
              showToast(`${newCount}/5 ${t("selected")}`);
            }
          } catch {
            // Rollback
            compareStore.removeCompare(type, id);
            showToast(t("failedUpdateComparison"));
          }
        }
      });
    },
    [requireAuth, compareStore, t]
  );

  // ── Seed from server ─────────────────────────────────────────────────────────

  /**
   * Load favorites + compares for the given types from the server and seed the
   * stores. Safe to call even when logged out (no-ops).
   *
   * Uses canonical userID (= sub without the "auth0|" prefix).
   * The backend ignores the userId path param and uses the token, so passing
   * userID instead of raw sub is safe (no behavior change).
   */
  const seedSelection = useCallback(
    async (types: ItemType[]) => {
      if (!isLoggedIn) return;
      const userId = getUserId();
      if (!userId) return;

      const favoriteTypes = types.filter(
        (t): t is SelectionFavoriteType =>
          ["Program", "Institution", "Offering", "Specialist"].includes(t)
      );
      const compareTypes = types.filter(
        (t): t is SelectionCompareType => ["Program", "Institution"].includes(t)
      );

      const promises: Promise<void>[] = [
        ...favoriteTypes.map(async (type) => {
          try {
            const ids = await favoritesApi.getFavoriteIds(userId, type);
            useFavoritesStore.getState().setFavorites(type, ids);
          } catch {
            // silently ignore — user can still see the list
          }
        }),
        ...compareTypes.map(async (type) => {
          try {
            const ids = await comparesApi.getCompareIds(type);
            useCompareStore.getState().setCompared(type, ids);
          } catch {
            // silently ignore
          }
        }),
      ];

      await Promise.all(promises);
    },
    [isLoggedIn, getUserId]
  );

  return {
    isFavorite,
    isCompared,
    toggleFavorite,
    toggleCompare,
    seedSelection,
  };
}
