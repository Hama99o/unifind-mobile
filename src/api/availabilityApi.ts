/**
 * availabilityApi — Node API transport for offering availability.
 * Backend: Node (nodeApi + Auth0 Bearer — auth required).
 * Transport only — no multi-step logic.
 *
 * Endpoints:
 *   GET /availability/dates/:offeringId/:specialistId/:type
 *     → { data: [{date, slotsCount}], price: {basePrice, discountedPrice, currency, finalPrice}, eventTypeId }
 *   GET /availability/times/:offeringId/:specialistId/:type/:date
 *     → [{start, end, fullyBooked}]
 *
 * Note: times returned are already Beirut-local HH:mm strings — do NOT re-convert TZ.
 */

import { nodeApi } from "@/api/nodeApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AvailabilityDate {
  date: string;
  slotsCount: number;
  day?: string;
  slots?: number;
}

export interface AvailabilityPrice {
  basePrice: number;
  discountedPrice?: number;
  currency: string;
  finalPrice: number;
}

export interface AvailabilityDatesResponse {
  data: AvailabilityDate[];
  price: AvailabilityPrice;
  eventTypeId: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  fullyBooked?: boolean;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const availabilityApi = {
  /**
   * GET /availability/dates/:offeringId/:specialistId/:type (AUTH)
   * Returns available dates, pricing, and eventTypeId.
   */
  async getDates(
    offeringId: string,
    specialistId: string,
    mode: string
  ): Promise<AvailabilityDatesResponse | null> {
    try {
      const res = await nodeApi.get<{
        success: boolean;
        data: AvailabilityDate[];
        price: AvailabilityPrice;
        eventTypeId: string;
      }>(`/availability/dates/${offeringId}/${specialistId}/${mode}`);

      if (res.data?.success === true) {
        return {
          data: res.data.data ?? [],
          price: res.data.price,
          eventTypeId: res.data.eventTypeId,
        };
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * GET /availability/times/:offeringId/:specialistId/:type/:date (AUTH)
   * Returns time slots for a specific date.
   * Times are pre-formatted Beirut HH:mm — do NOT re-convert TZ.
   */
  async getTimes(
    offeringId: string,
    specialistId: string,
    mode: string,
    date: string
  ): Promise<TimeSlot[]> {
    try {
      const res = await nodeApi.get<{
        success: boolean;
        data: TimeSlot[];
      }>(`/availability/times/${offeringId}/${specialistId}/${mode}/${date}`);

      if (res.data?.success === true) {
        return res.data.data ?? [];
      }
      return [];
    } catch {
      return [];
    }
  },
};
