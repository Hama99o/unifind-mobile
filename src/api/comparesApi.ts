/**
 * comparesApi — Node API transport for user comparisons.
 * Backend: Node (nodeApi + Auth0 Bearer).
 * Transport only — no multi-step logic.
 *
 * Endpoints:
 *   POST /compares/          → toggle compare item { itemID, itemType }
 *   GET  /compares/:type     → current compare list for a type
 *   GET  /compares/count/:type → count for a type
 */

import { nodeApi } from "@/api/nodeApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CompareItemType = "Program" | "Institution";

export interface CompareItem {
  _id: string;
  itemID: string;
  itemType: CompareItemType;
  userId: string;
}

export interface ToggleCompareResponse {
  type: "success" | "error";
  compareCount?: number;
  message?: string;
}

export interface GetComparesResponse {
  type: "success" | "error";
  data: CompareItem[];
}

export interface GetCompareCountResponse {
  type: "success" | "error";
  data: { count: number };
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const comparesApi = {
  /** POST /compares/ — toggle compare membership */
  async toggleCompare(
    itemID: string,
    itemType: CompareItemType
  ): Promise<ToggleCompareResponse> {
    const res = await nodeApi.post<ToggleCompareResponse>("/compares/", {
      itemID,
      itemType,
    });
    return res.data;
  },

  /** GET /compares/:type — get all compared IDs for a type */
  async getCompareIds(itemType: CompareItemType): Promise<string[]> {
    const res = await nodeApi.get<GetComparesResponse>(`/compares/${itemType}`);
    if (res.data?.type === "success") {
      return res.data.data.map((item) => item.itemID);
    }
    return [];
  },

  /** GET /compares/count/:type — get count for a type */
  async getCompareCount(itemType: CompareItemType): Promise<number> {
    try {
      const res = await nodeApi.get<GetCompareCountResponse>(
        `/compares/count/${itemType}`
      );
      if (res.data?.type === "success") {
        return res.data.data?.count ?? 0;
      }
      return 0;
    } catch {
      return 0;
    }
  },
};
