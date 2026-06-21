/**
 * availabilityApi.test.ts — unit tests for the offering-availability Node transport.
 *
 * nodeApi is globally mocked. Covers URL path building (offeringId/specialistId/
 * mode[/date]), success gating, default empty arrays, and try/catch fallbacks.
 */

import { availabilityApi } from "@/api/availabilityApi";
import { nodeApi } from "@/api/nodeApi";

const mockGet = nodeApi.get as jest.Mock;

function lastUrl(): string {
  return mockGet.mock.calls[mockGet.mock.calls.length - 1][0] as string;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── getDates ───────────────────────────────────────────────────────────────────

describe("availabilityApi.getDates", () => {
  it("builds /availability/dates/:offeringId/:specialistId/:mode and returns data+price+eventTypeId", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: [{ date: "2025-06-01", slotsCount: 3 }],
        price: { basePrice: 100, currency: "USD", finalPrice: 90 },
        eventTypeId: "et1",
      },
    });
    const result = await availabilityApi.getDates("off1", "spec1", "1o1");
    expect(lastUrl()).toBe("/availability/dates/off1/spec1/1o1");
    expect(result).toEqual({
      data: [{ date: "2025-06-01", slotsCount: 3 }],
      price: { basePrice: 100, currency: "USD", finalPrice: 90 },
      eventTypeId: "et1",
    });
  });

  it("defaults data to [] when success is true but data is missing", async () => {
    mockGet.mockResolvedValueOnce({
      data: { success: true, price: { basePrice: 0, currency: "USD", finalPrice: 0 }, eventTypeId: "et" },
    });
    const result = await availabilityApi.getDates("o", "s", "1o1");
    expect(result?.data).toEqual([]);
  });

  it("returns null when success is false", async () => {
    mockGet.mockResolvedValueOnce({ data: { success: false } });
    expect(await availabilityApi.getDates("o", "s", "1o1")).toBeNull();
  });

  it("returns null when success is absent", async () => {
    mockGet.mockResolvedValueOnce({ data: {} });
    expect(await availabilityApi.getDates("o", "s", "1o1")).toBeNull();
  });

  it("returns null when the request throws", async () => {
    mockGet.mockRejectedValueOnce(new Error("x"));
    expect(await availabilityApi.getDates("o", "s", "1o1")).toBeNull();
  });
});

// ─── getTimes ───────────────────────────────────────────────────────────────────

describe("availabilityApi.getTimes", () => {
  it("builds /availability/times/:offeringId/:specialistId/:mode/:date and returns slots", async () => {
    const slots = [{ start: "09:00", end: "10:00", fullyBooked: false }];
    mockGet.mockResolvedValueOnce({ data: { success: true, data: slots } });
    const result = await availabilityApi.getTimes("off1", "spec1", "group_live", "2025-06-01");
    expect(lastUrl()).toBe("/availability/times/off1/spec1/group_live/2025-06-01");
    expect(result).toBe(slots);
  });

  it("returns [] when success is true but data is missing", async () => {
    mockGet.mockResolvedValueOnce({ data: { success: true } });
    expect(await availabilityApi.getTimes("o", "s", "1o1", "d")).toEqual([]);
  });

  it("returns [] when success is false", async () => {
    mockGet.mockResolvedValueOnce({ data: { success: false, data: [{ start: "1", end: "2" }] } });
    expect(await availabilityApi.getTimes("o", "s", "1o1", "d")).toEqual([]);
  });

  it("returns [] when the request throws", async () => {
    mockGet.mockRejectedValueOnce(new Error("x"));
    expect(await availabilityApi.getTimes("o", "s", "1o1", "d")).toEqual([]);
  });
});
