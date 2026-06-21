/**
 * bookingsApi.test.ts — Node + Strapi transport for user bookings.
 *
 * Asserts exact endpoint path, HTTP method, payload, and returned shape for
 * every exported function plus the two pure helpers (capitalizeStatus,
 * toPaymentStatus).
 */

import {
  bookingsApi,
  capitalizeStatus,
  toPaymentStatus,
} from "@/api/bookingsApi";
import { nodeApi } from "@/api/nodeApi";
import { http } from "@/api/http";

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Pure helpers ───────────────────────────────────────────────────────────

describe("capitalizeStatus", () => {
  it("title-cases a valid status", () => {
    expect(capitalizeStatus("scheduled")).toBe("Scheduled");
    expect(capitalizeStatus("COMPLETED")).toBe("Completed");
    expect(capitalizeStatus("cAnCeLeD")).toBe("Canceled");
  });

  it("maps each canonical status to itself", () => {
    expect(capitalizeStatus("Pending")).toBe("Pending");
    expect(capitalizeStatus("Requested")).toBe("Requested");
  });

  it("falls back to 'Pending' for an unknown status", () => {
    expect(capitalizeStatus("weird")).toBe("Pending");
    expect(capitalizeStatus("")).toBe("Pending");
  });
});

describe("toPaymentStatus", () => {
  it("lowercases and accepts valid statuses", () => {
    expect(toPaymentStatus("PAID")).toBe("paid");
    expect(toPaymentStatus("Partial")).toBe("partial");
    expect(toPaymentStatus("refunded")).toBe("refunded");
    expect(toPaymentStatus("unpaid")).toBe("unpaid");
  });

  it("defaults to 'unpaid' when undefined", () => {
    expect(toPaymentStatus(undefined)).toBe("unpaid");
  });

  it("defaults to 'unpaid' for an invalid value", () => {
    expect(toPaymentStatus("bogus")).toBe("unpaid");
  });
});

// ─── getByUser ───────────────────────────────────────────────────────────────

describe("bookingsApi.getByUser", () => {
  it("GETs /booking/by-user and maps rows to BookingListItem", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          {
            _id: "m1",
            bookingReference: "REF-1",
            date: "2025-01-02",
            price: 100,
            status: "scheduled",
          },
        ],
      },
    });

    const result = await bookingsApi.getByUser();

    expect(nodeApi.get).toHaveBeenCalledTimes(1);
    expect((nodeApi.get as jest.Mock).mock.calls[0][0]).toBe("/booking/by-user");
    expect(result).toEqual([
      {
        realId: "m1",
        bookingReference: "REF-1",
        date: "2025-01-02",
        amount: 100,
        status: "Scheduled",
      },
    ]);
  });

  it("falls back date to payment.providerResponseAt when date is missing", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          {
            _id: "m2",
            bookingReference: "REF-2",
            price: 50,
            status: "pending",
            payment: { providerResponseAt: "2025-03-03" },
          },
        ],
      },
    });

    const result = await bookingsApi.getByUser();
    expect(result[0].date).toBe("2025-03-03");
  });

  it("falls back date to empty string when neither date nor payment present", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: {
        success: true,
        data: [{ _id: "m3", bookingReference: "REF-3", price: 0, status: "x" }],
      },
    });
    const result = await bookingsApi.getByUser();
    expect(result[0].date).toBe("");
    // unknown status coerces to "Pending"
    expect(result[0].status).toBe("Pending");
  });

  it("returns [] when success is false", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: { success: false, data: [{ _id: "x" }] },
    });
    expect(await bookingsApi.getByUser()).toEqual([]);
  });

  it("returns [] when data is not an array", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: { success: true, data: null },
    });
    expect(await bookingsApi.getByUser()).toEqual([]);
  });
});

// ─── getDetails ────────────────────────────────────────────────────────────--

describe("bookingsApi.getDetails", () => {
  it("GETs /booking/:ref/details and returns res.data.data", async () => {
    const detail = { booking: { _id: "b1" } } as never;
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: { success: true, data: detail },
    });

    const result = await bookingsApi.getDetails("REF-9");

    expect((nodeApi.get as jest.Mock).mock.calls[0][0]).toBe(
      "/booking/REF-9/details"
    );
    expect(result).toBe(detail);
  });

  it("propagates rejection", async () => {
    (nodeApi.get as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    await expect(bookingsApi.getDetails("REF-X")).rejects.toThrow("boom");
  });
});

// ─── getOfferingNodeData ──────────────────────────────────────────────────────

describe("bookingsApi.getOfferingNodeData", () => {
  it("returns [] immediately for empty ids (no network call)", async () => {
    const result = await bookingsApi.getOfferingNodeData([]);
    expect(result).toEqual([]);
    expect(nodeApi.get).not.toHaveBeenCalled();
  });

  it("appends one offeringContentId query param per id", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: { success: true, data: [{ offeringContentId: "1" }] },
    });

    const result = await bookingsApi.getOfferingNodeData(["1", "2"]);

    expect((nodeApi.get as jest.Mock).mock.calls[0][0]).toBe(
      "/offering?offeringContentId=1&offeringContentId=2"
    );
    expect(result).toEqual([{ offeringContentId: "1" }]);
  });

  it("returns [] when success is falsy", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: { success: false, data: [{ offeringContentId: "9" }] },
    });
    expect(await bookingsApi.getOfferingNodeData(["9"])).toEqual([]);
  });
});

// ─── create ────────────────────────────────────────────────────────────────--

describe("bookingsApi.create", () => {
  const body = {
    offeringId: "o1",
    specialistId: "s1",
    eventTypeId: "e1",
    date: "2025-06-01",
    start: "10:00",
    end: "11:00",
    priceAtBooking: 200,
    currency: "USD",
  };

  it("POSTs /booking with the body and returns data on success", async () => {
    (nodeApi.post as jest.Mock).mockResolvedValueOnce({
      data: { success: true, data: { bookingReference: "REF-NEW" } },
    });

    const result = await bookingsApi.create(body);

    expect((nodeApi.post as jest.Mock).mock.calls[0][0]).toBe("/booking");
    expect((nodeApi.post as jest.Mock).mock.calls[0][1]).toEqual(body);
    expect(result).toEqual({ bookingReference: "REF-NEW" });
  });

  it("throws with the backend message when success is not true", async () => {
    (nodeApi.post as jest.Mock).mockResolvedValueOnce({
      data: { success: false, message: "Slot taken" },
    });
    await expect(bookingsApi.create(body)).rejects.toThrow("Slot taken");
  });

  it("throws the default message when none provided", async () => {
    (nodeApi.post as jest.Mock).mockResolvedValueOnce({
      data: { success: false },
    });
    await expect(bookingsApi.create(body)).rejects.toThrow("Booking failed");
  });
});

// ─── getOfferingImageUrl (Strapi via http) ───────────────────────────────────-

describe("bookingsApi.getOfferingImageUrl", () => {
  it("GETs the Strapi offerings endpoint and returns the image url", async () => {
    (http.get as jest.Mock).mockResolvedValueOnce({
      data: { data: [{ image: { url: "https://cdn/x.png" } }] },
    });

    const result = await bookingsApi.getOfferingImageUrl("42");

    expect((http.get as jest.Mock).mock.calls[0][0]).toBe(
      "/api/offerings?filters[id][$eq]=42&populate=image&status=draft"
    );
    expect(result).toBe("https://cdn/x.png");
  });

  it("returns '' when no image present", async () => {
    (http.get as jest.Mock).mockResolvedValueOnce({ data: { data: [{}] } });
    expect(await bookingsApi.getOfferingImageUrl("1")).toBe("");
  });

  it("returns '' (swallows error) on rejection", async () => {
    (http.get as jest.Mock).mockRejectedValueOnce(new Error("nope"));
    expect(await bookingsApi.getOfferingImageUrl("1")).toBe("");
  });
});

// ─── getById (flat checkout shape) ────────────────────────────────────────────

describe("bookingsApi.getById", () => {
  it("GETs /booking/:ref and returns data on success", async () => {
    const booking = { _id: "c1", bookingReference: "REF-C" } as never;
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: { success: true, data: booking },
    });

    const result = await bookingsApi.getById("REF-C");

    expect((nodeApi.get as jest.Mock).mock.calls[0][0]).toBe("/booking/REF-C");
    expect(result).toBe(booking);
  });

  it("throws when success is falsy", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: { success: false },
    });
    await expect(bookingsApi.getById("REF-C")).rejects.toThrow(
      "Failed to fetch booking"
    );
  });
});

// ─── getPaymentStatus ─────────────────────────────────────────────────────────

describe("bookingsApi.getPaymentStatus", () => {
  it("GETs /booking/payment-status/:ref and returns the status", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: { data: { paymentStatus: "paid" } },
    });

    const result = await bookingsApi.getPaymentStatus("REF-P");

    expect((nodeApi.get as jest.Mock).mock.calls[0][0]).toBe(
      "/booking/payment-status/REF-P"
    );
    expect(result).toBe("paid");
  });

  it("returns 'unpaid' when paymentStatus missing", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: {} } });
    expect(await bookingsApi.getPaymentStatus("REF-P")).toBe("unpaid");
  });
});
