/**
 * nodeOfferingApi — Node API transport for offering detail & specialists.
 * Backend: Node (nodeApi; token optional for listing, auth for availability).
 * Transport only — no multi-step logic.
 *
 * Endpoints:
 *   GET /offering/:slug           → offering node metadata (offeringContentId, sessionDuration, etc.)
 *   GET /offering/:id/specialist  → specialists for an offering filtered by mode
 */

import { nodeApi } from "@/api/nodeApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NodeOfferingEventType {
  mode: "group_live" | "group_online" | "1o1" | string;
  effectivePrice?: number;
  specialistName?: string;
  specialistPhoto?: string | null;
}

export interface NodeOfferingSpecialist {
  _id: string;
  id?: string;
  name: string;
  headline?: string;
  bio?: string;
  avatar?: string | null;
}

export interface NodeOfferingDetail {
  _id: string;
  offeringContentId: string | number;
  slug?: string;
  sessionDuration?: number;
  sessionCount?: number;
  eventTypes: NodeOfferingEventType[];
  specialists?: NodeOfferingSpecialist[];
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const nodeOfferingApi = {
  /**
   * GET /offering/:slug → Node offering metadata.
   * Note: backend matches by slug field. Returns eventTypes sorted by server; we re-sort client-side.
   */
  async getBySlug(slug: string): Promise<NodeOfferingDetail | null> {
    try {
      const res = await nodeApi.get<{
        success: boolean;
        data: NodeOfferingDetail;
      }>(`/offering/${slug}`);
      if (res.data?.success === true) {
        return res.data.data;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * GET /offering/:offeringId/specialist?mode=<mode>
   * Returns specialists available for the offering filtered by event mode.
   */
  async getSpecialists(
    offeringId: string,
    mode: string
  ): Promise<NodeOfferingSpecialist[]> {
    try {
      const res = await nodeApi.get<{
        success: boolean;
        specialists: NodeOfferingSpecialist[];
      }>(`/offering/${offeringId}/specialist`, {
        params: { mode },
      });
      if (res.data?.success === true) {
        return res.data.specialists ?? [];
      }
      return [];
    } catch {
      return [];
    }
  },
};
