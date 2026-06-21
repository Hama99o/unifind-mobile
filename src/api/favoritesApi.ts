/**
 * favoritesApi — Node API transport for user favorites.
 * Backend: Node (nodeApi + Auth0 Bearer).
 * Transport only — no multi-step logic.
 *
 * Endpoints:
 *   POST /favorites              → toggle favorite { itemID, itemType }
 *   GET  /favorites/:userId/:type → paginated favorites for a type
 */

import { nodeApi } from "@/api/nodeApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FavoriteItemType = "Program" | "Institution" | "Offering" | "Specialist";

export interface FavoriteItem {
  _id: string;
  itemID: string;
  itemType: FavoriteItemType;
  userId: string;
}

export interface ToggleFavoriteResponse {
  type: "success" | "error";
  action?: "added" | "removed";
  message?: string;
}

export interface GetFavoritesResponse {
  type: "success" | "error";
  data: FavoriteItem[];
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const favoritesApi = {
  /** POST /favorites — toggle (add or remove) a favorite */
  async toggleFavorite(
    itemID: string,
    itemType: FavoriteItemType
  ): Promise<ToggleFavoriteResponse> {
    const res = await nodeApi.post<ToggleFavoriteResponse>("/favorites", {
      itemID,
      itemType,
    });
    return res.data;
  },

  /** GET /favorites/:userId/:type — get all favorite IDs for a type */
  async getFavoriteIds(
    userId: string,
    itemType: FavoriteItemType
  ): Promise<string[]> {
    const res = await nodeApi.get<GetFavoritesResponse>(
      `/favorites/${userId}/${itemType}`
    );
    if (res.data?.type === "success") {
      return res.data.data.map((fav) => fav.itemID);
    }
    return [];
  },
};
