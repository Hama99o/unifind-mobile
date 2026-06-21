/**
 * bookingsApi — Node API transport for user bookings.
 * Backend: Node (nodeApi + Auth0 Bearer).
 * Transport only — no multi-step logic.
 *
 * Endpoints:
 *   GET /booking/by-user                      → all user bookings
 *   GET /booking/:bookingReference/details    → booking detail
 *   GET /offering?offeringContentId=<ids>     → offering node data (session duration)
 *
 * Strapi:
 *   GET /api/offerings?filters[id][$eq]=<id>&populate=image → offering image
 */

import { nodeApi } from "@/api/nodeApi";
import { http } from "@/api/http";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BookingStatus =
  | "Pending"
  | "Requested"
  | "Scheduled"
  | "Completed"
  | "Canceled";

// ─── Checkout / payment types ──────────────────────────────────────────────────

export interface CheckoutBookingCurrency {
  symbol: string;
  code: string;
}

export interface CheckoutAppliedPromoCode {
  type: string;
  value: number;
  currency: CheckoutBookingCurrency;
  code: string;
}

export interface CheckoutEventType {
  basePrice: number;
  discountedPrice: number;
  durationMinutes: number;
  mode: string;
}

export interface CheckoutBooking {
  _id: string;
  bookingReference: string;
  offeringId: {
    _id: string;
    offeringContentId: string;
    title: string;
  };
  specialistId: { name: string };
  eventTypeId: CheckoutEventType;
  currency: CheckoutBookingCurrency;
  finalPrice: number;
  appliedPromoCode: CheckoutAppliedPromoCode | null;
  startTime: string;
  endTime: string;
  date: string;
  pricing: {
    originalPrice: number;
    discountAmount: number;
    finalPrice: number;
  };
}

export type PaymentStatus = "unpaid" | "partial" | "paid" | "refunded";

export interface BookingListItem {
  realId: string;
  bookingReference: string;
  date: string;
  amount: number;
  status: BookingStatus;
}

export interface BookingDetailData {
  booking: {
    _id: string;
    status: string;
    paymentStatus: string;
    date: string;
    start: string;
    end: string;
  };
  offering: {
    title: string;
    offeringContentId: string;
    duration: number;
  };
  specialist: {
    name: string;
  };
  eventType: {
    mode: string;
  };
  session?: {
    meetingLink?: string;
  };
  pricing: {
    originalPrice: number;
    discountPrice: number;
    finalPrice: number;
    currency: { symbol: string };
    appliedPromoCode: string;
    promoCode?: string;
    promoCurrency?: { symbol: string };
  };
  notes?: string;
}

export interface NodeOffering {
  offeringContentId: string;
  sessionDuration?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function capitalizeStatus(status: string): BookingStatus {
  const s = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  const valid: BookingStatus[] = [
    "Pending",
    "Requested",
    "Scheduled",
    "Completed",
    "Canceled",
  ];
  return valid.includes(s as BookingStatus) ? (s as BookingStatus) : "Pending";
}

export function toPaymentStatus(status?: string): PaymentStatus {
  const s = status?.toLowerCase() ?? "unpaid";
  const valid: PaymentStatus[] = ["unpaid", "partial", "paid", "refunded"];
  return valid.includes(s as PaymentStatus) ? (s as PaymentStatus) : "unpaid";
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const bookingsApi = {
  /** GET /booking/by-user — all user bookings */
  async getByUser(): Promise<BookingListItem[]> {
    const res = await nodeApi.get<{ success: boolean; data: Array<{
      _id: string;
      bookingReference: string;
      date?: string;
      price: number;
      status: string;
      payment?: { providerResponseAt?: string };
    }> }>("/booking/by-user");

    if (res.data.success && Array.isArray(res.data.data)) {
      return res.data.data.map((b) => ({
        realId: b._id,
        bookingReference: b.bookingReference,
        date: b.date ?? b.payment?.providerResponseAt ?? "",
        amount: b.price,
        status: capitalizeStatus(b.status),
      }));
    }
    return [];
  },

  /** GET /booking/:bookingReference/details */
  async getDetails(bookingReference: string): Promise<BookingDetailData> {
    const res = await nodeApi.get<{ success: boolean; data: BookingDetailData }>(
      `/booking/${bookingReference}/details`
    );
    return res.data.data;
  },

  /** GET /offering?offeringContentId=<id>&offeringContentId=<id>... — Node offering data.
   * The Node controller uses $in for REPEATED params, not a comma-joined value. */
  async getOfferingNodeData(ids: string[]): Promise<NodeOffering[]> {
    if (ids.length === 0) return [];
    const qp = new URLSearchParams();
    ids.forEach((id) => qp.append("offeringContentId", id));
    const res = await nodeApi.get<{ success: boolean; data: NodeOffering[] }>(
      `/offering?${qp.toString()}`
    );
    if (res.data?.success) {
      return res.data.data;
    }
    return [];
  },

  /**
   * POST /booking (AUTH)
   * Create a new booking. Returns { bookingReference }.
   */
  async create(body: {
    offeringId: string;
    specialistId: string;
    eventTypeId: string;
    date: string;
    start: string;
    end: string;
    priceAtBooking: number;
    currency: string;
  }): Promise<{ bookingReference: string }> {
    const res = await nodeApi.post<{
      success: boolean;
      data: { bookingReference: string };
      message?: string;
    }>("/booking", body);
    if (res.data?.success === true) {
      return res.data.data;
    }
    throw new Error(res.data?.message ?? "Booking failed");
  },

  /** GET Strapi offering image by Strapi id */
  async getOfferingImageUrl(strapiId: string): Promise<string> {
    try {
      const res = await http.get<{ data: Array<{ image?: { url?: string } }> }>(
        `/api/offerings?filters[id][$eq]=${strapiId}&populate=image&status=draft`
      );
      return res.data?.data?.[0]?.image?.url ?? "";
    } catch {
      return "";
    }
  },

  /**
   * GET /booking/:bookingReference — FLAT checkout shape (differs from /details).
   * Used by the checkout screen. Auth required.
   */
  async getById(bookingReference: string): Promise<CheckoutBooking> {
    const res = await nodeApi.get<{ success: boolean; data: CheckoutBooking }>(
      `/booking/${bookingReference}`
    );
    if (res.data?.success) return res.data.data;
    throw new Error("Failed to fetch booking");
  },

  /**
   * GET /booking/payment-status/:bookingReference
   * Returns { data: { paymentStatus: string } }.
   */
  async getPaymentStatus(bookingReference: string): Promise<string> {
    const res = await nodeApi.get<{ data: { paymentStatus: string } }>(
      `/booking/payment-status/${bookingReference}`
    );
    return res.data?.data?.paymentStatus ?? "unpaid";
  },
};
