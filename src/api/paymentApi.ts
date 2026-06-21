/**
 * paymentApi — Node API transport for payment initiation.
 * Backend: Node (nodeApi + Auth0 Bearer).
 * Transport only — no multi-step logic.
 *
 * Endpoints:
 *   POST /webhook/payment/whish/url  → get Whish Money collect URL
 */

import { nodeApi } from "@/api/nodeApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WhishUrlResponse {
  success: boolean;
  paymentId: string;
  /** Triple nested: res.data.data.data.collectUrl */
  data: {
    collectUrl: string;
    [key: string]: unknown;
  };
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const paymentApi = {
  /**
   * POST /webhook/payment/whish/url
   * Initiates a Whish Money payment. Returns the collectUrl the user visits.
   *
   * Triple nesting on the backend response:
   *   res.data          → { success, paymentId, data: <whish response> }
   *   res.data.data     → Whish response object
   *   res.data.data.data.collectUrl → the URL to open
   *
   * We unwrap all three levels and return collectUrl directly.
   */
  async getWhishUrl(
    bookingReference: string,
    notes?: string
  ): Promise<string> {
    const res = await nodeApi.post<{
      success: boolean;
      paymentId: string;
      data: { data: { collectUrl: string } };
    }>("/webhook/payment/whish/url", {
      bookingReference,
      notes: notes ?? "",
    });

    if (!res.data?.success) {
      throw new Error("Payment initiation failed");
    }

    const collectUrl = res.data?.data?.data?.collectUrl;
    if (!collectUrl) {
      throw new Error("No collect URL returned from payment provider");
    }
    return collectUrl;
  },
};
