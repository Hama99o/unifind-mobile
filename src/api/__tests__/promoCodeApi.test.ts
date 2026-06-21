/**
 * promoCodeApi.test.ts — Node transport for promo codes.
 *
 * apply -> POST /promocode { promoCode, offeringId, bookingId }
 * remove -> DELETE /promocode with body in the axios `data` option
 *           { data: { bookingReference } }
 */

import { promoCodeApi } from "@/api/promoCodeApi";
import { nodeApi } from "@/api/nodeApi";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("promoCodeApi.apply", () => {
  it("POSTs /promocode with { promoCode, offeringId, bookingId } and returns res.data", async () => {
    const applied = {
      success: true,
      discountAmount: 10,
      finalAmount: 90,
      currency: { symbol: "$" },
      promoCode: "SAVE10",
      message: "applied",
    };
    (nodeApi.post as jest.Mock).mockResolvedValueOnce({ data: applied });

    const result = await promoCodeApi.apply("SAVE10", "off-mongo-1", "bk-mongo-1");

    expect((nodeApi.post as jest.Mock).mock.calls[0][0]).toBe("/promocode");
    expect((nodeApi.post as jest.Mock).mock.calls[0][1]).toEqual({
      promoCode: "SAVE10",
      offeringId: "off-mongo-1",
      bookingId: "bk-mongo-1",
    });
    expect(result).toBe(applied);
  });

  it("propagates a rejection (invalid/expired code)", async () => {
    (nodeApi.post as jest.Mock).mockRejectedValueOnce(new Error("expired"));
    await expect(promoCodeApi.apply("OLD", "o", "b")).rejects.toThrow("expired");
  });
});

describe("promoCodeApi.remove", () => {
  it("DELETEs /promocode passing { bookingReference } in the axios `data` body", async () => {
    const removed = {
      success: true,
      message: "removed",
      data: { bookingReference: "REF-1", finalPrice: 100 },
    };
    (nodeApi.delete as jest.Mock).mockResolvedValueOnce({ data: removed });

    const result = await promoCodeApi.remove("REF-1");

    expect((nodeApi.delete as jest.Mock).mock.calls[0][0]).toBe("/promocode");
    expect((nodeApi.delete as jest.Mock).mock.calls[0][1]).toEqual({
      data: { bookingReference: "REF-1" },
    });
    expect(result).toBe(removed);
  });

  it("propagates a rejection", async () => {
    (nodeApi.delete as jest.Mock).mockRejectedValueOnce(new Error("404"));
    await expect(promoCodeApi.remove("REF-1")).rejects.toThrow("404");
  });
});
