/**
 * newsletterApi.test.ts — Node transport (public, no auth) for newsletter signup.
 *
 * subscribeNewsletter -> POST /newsletter/subscribe { email } -> res.data
 */

import { subscribeNewsletter } from "@/api/newsletterApi";
import { nodeApi } from "@/api/nodeApi";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("subscribeNewsletter", () => {
  it("POSTs /newsletter/subscribe with { email } and returns res.data", async () => {
    (nodeApi.post as jest.Mock).mockResolvedValueOnce({
      data: { success: true, message: "Subscribed" },
    });

    const result = await subscribeNewsletter("user@example.com");

    expect((nodeApi.post as jest.Mock).mock.calls[0][0]).toBe(
      "/newsletter/subscribe"
    );
    expect((nodeApi.post as jest.Mock).mock.calls[0][1]).toEqual({
      email: "user@example.com",
    });
    expect(result).toEqual({ success: true, message: "Subscribed" });
  });

  it("returns the failure body verbatim", async () => {
    (nodeApi.post as jest.Mock).mockResolvedValueOnce({
      data: { success: false, message: "Already subscribed" },
    });
    const result = await subscribeNewsletter("dup@example.com");
    expect(result).toEqual({ success: false, message: "Already subscribed" });
  });

  it("propagates a rejection", async () => {
    (nodeApi.post as jest.Mock).mockRejectedValueOnce(new Error("network"));
    await expect(subscribeNewsletter("x@y.io")).rejects.toThrow("network");
  });
});
