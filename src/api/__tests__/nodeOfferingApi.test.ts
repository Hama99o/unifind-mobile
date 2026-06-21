/**
 * nodeOfferingApi.test.ts — unit tests for the Node offering-detail & specialists transport.
 *
 * nodeApi is globally mocked. Covers success/failure gating (success===true),
 * URL/params shape, and try/catch fallbacks.
 */

import { nodeOfferingApi } from "@/api/nodeOfferingApi";
import { nodeApi } from "@/api/nodeApi";

const mockGet = nodeApi.get as jest.Mock;

function lastCall(): unknown[] {
  return mockGet.mock.calls[mockGet.mock.calls.length - 1];
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── getBySlug ──────────────────────────────────────────────────────────────────

describe("nodeOfferingApi.getBySlug", () => {
  it("requests /offering/:slug and returns data when success is true", async () => {
    const detail = { _id: "o1", offeringContentId: 1, slug: "py", eventTypes: [] };
    mockGet.mockResolvedValueOnce({ data: { success: true, data: detail } });
    const result = await nodeOfferingApi.getBySlug("py");
    expect(result).toBe(detail);
    expect(lastCall()[0]).toBe("/offering/py");
  });

  it("returns null when success is false", async () => {
    mockGet.mockResolvedValueOnce({ data: { success: false, data: { _id: "x" } } });
    expect(await nodeOfferingApi.getBySlug("py")).toBeNull();
  });

  it("returns null when success is absent", async () => {
    mockGet.mockResolvedValueOnce({ data: {} });
    expect(await nodeOfferingApi.getBySlug("py")).toBeNull();
  });

  it("returns null when the request throws", async () => {
    mockGet.mockRejectedValueOnce(new Error("x"));
    expect(await nodeOfferingApi.getBySlug("py")).toBeNull();
  });
});

// ─── getSpecialists ─────────────────────────────────────────────────────────────

describe("nodeOfferingApi.getSpecialists", () => {
  it("requests /offering/:id/specialist with the mode query param and returns specialists", async () => {
    const specialists = [{ _id: "s1", name: "Dr A" }];
    mockGet.mockResolvedValueOnce({ data: { success: true, specialists } });
    const result = await nodeOfferingApi.getSpecialists("123", "1o1");
    expect(result).toBe(specialists);
    const call = lastCall();
    expect(call[0]).toBe("/offering/123/specialist");
    expect(call[1]).toEqual({ params: { mode: "1o1" } });
  });

  it("returns [] (with success true) when specialists is missing", async () => {
    mockGet.mockResolvedValueOnce({ data: { success: true } });
    expect(await nodeOfferingApi.getSpecialists("123", "group_live")).toEqual([]);
  });

  it("returns [] when success is false", async () => {
    mockGet.mockResolvedValueOnce({ data: { success: false, specialists: [{ _id: "s1", name: "A" }] } });
    expect(await nodeOfferingApi.getSpecialists("123", "1o1")).toEqual([]);
  });

  it("returns [] when the request throws", async () => {
    mockGet.mockRejectedValueOnce(new Error("x"));
    expect(await nodeOfferingApi.getSpecialists("123", "1o1")).toEqual([]);
  });
});
