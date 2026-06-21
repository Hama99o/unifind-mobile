/**
 * paymentApi.test.ts — Node transport for Whish Money payment initiation.
 *
 * The backend response is triple-nested: res.data.data.data.collectUrl.
 * Tests assert the exact path, payload, the unwrapping, and both error paths.
 */

import { paymentApi } from "@/api/paymentApi";
import { nodeApi } from "@/api/nodeApi";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("paymentApi.getWhishUrl", () => {
  it("POSTs /webhook/payment/whish/url and unwraps the triple-nested collectUrl", async () => {
    (nodeApi.post as jest.Mock).mockResolvedValueOnce({
      data: {
        success: true,
        paymentId: "pay-1",
        data: { data: { collectUrl: "https://whish/collect/abc" } },
      },
    });

    const result = await paymentApi.getWhishUrl("REF-1", "please pay");

    expect((nodeApi.post as jest.Mock).mock.calls[0][0]).toBe(
      "/webhook/payment/whish/url"
    );
    expect((nodeApi.post as jest.Mock).mock.calls[0][1]).toEqual({
      bookingReference: "REF-1",
      notes: "please pay",
    });
    expect(result).toBe("https://whish/collect/abc");
  });

  it("defaults notes to an empty string when omitted", async () => {
    (nodeApi.post as jest.Mock).mockResolvedValueOnce({
      data: {
        success: true,
        paymentId: "pay-2",
        data: { data: { collectUrl: "https://whish/x" } },
      },
    });

    await paymentApi.getWhishUrl("REF-2");

    expect((nodeApi.post as jest.Mock).mock.calls[0][1]).toEqual({
      bookingReference: "REF-2",
      notes: "",
    });
  });

  it("throws when success is falsy", async () => {
    (nodeApi.post as jest.Mock).mockResolvedValueOnce({
      data: { success: false },
    });
    await expect(paymentApi.getWhishUrl("REF-3")).rejects.toThrow(
      "Payment initiation failed"
    );
  });

  it("throws when no collectUrl is returned", async () => {
    (nodeApi.post as jest.Mock).mockResolvedValueOnce({
      data: { success: true, paymentId: "p", data: { data: {} } },
    });
    await expect(paymentApi.getWhishUrl("REF-4")).rejects.toThrow(
      "No collect URL returned from payment provider"
    );
  });

  it("propagates a network rejection", async () => {
    (nodeApi.post as jest.Mock).mockRejectedValueOnce(new Error("network"));
    await expect(paymentApi.getWhishUrl("REF-5")).rejects.toThrow("network");
  });
});
