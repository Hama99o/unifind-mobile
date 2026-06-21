/**
 * promoCodeApi — Node API transport for promo codes.
 * Backend: Node (nodeApi + Auth0 Bearer).
 * Transport only — no multi-step logic.
 *
 * Endpoints:
 *   POST /promocode  { promoCode, offeringId, bookingId } → apply
 *   DELETE /promocode { bookingReference }               → remove
 */

import { nodeApi } from "@/api/nodeApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppliedPromo {
  success: boolean;
  discountAmount: number;
  finalAmount: number;
  currency: { symbol: string };
  promoCode: string;
  message: string;
}

export interface RemovePromoResponse {
  success: boolean;
  message: string;
  data: { bookingReference: string; finalPrice: number };
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const promoCodeApi = {
  /**
   * POST /promocode
   * Apply a promo code to a booking.
   *   - promoCode  : the code string the user typed
   *   - offeringId : booking.offeringId._id (mongo _id, NOT the Strapi content id)
   *   - bookingId  : booking._id            (mongo _id, NOT the bookingReference)
   *
   * Errors: invalid/inactive, expired, not applicable, already applied.
   * The backend returns either { success:true, ...} or throws with response.data.message.
   */
  async apply(
    promoCode: string,
    offeringId: string,
    bookingId: string
  ): Promise<AppliedPromo> {
    const res = await nodeApi.post<AppliedPromo>("/promocode", {
      promoCode,
      offeringId,
      bookingId,
    });
    return res.data;
  },

  /**
   * DELETE /promocode
   * Remove the applied promo code from a booking by its bookingReference.
   * Returns { data: { finalPrice } }.
   */
  async remove(bookingReference: string): Promise<RemovePromoResponse> {
    const res = await nodeApi.delete<RemovePromoResponse>("/promocode", {
      data: { bookingReference },
    });
    return res.data;
  },
};
