import { classifyPaymentRedirect } from "@/screens/checkout/paymentRedirect";

const FRONT = "https://stg.unifind-lb.org";

describe("classifyPaymentRedirect (PAY-02)", () => {
  it("success redirect → success with the bookingRef from the URL", () => {
    expect(
      classifyPaymentRedirect(`${FRONT}/en/find/offerings/checkout/payment-status?status=success&bookingRef=BK-9`, "BK-1")
    ).toEqual({ status: "success", bookingRef: "BK-9", message: undefined });
  });

  it("failed redirect keeps the backend message and falls back to the current booking", () => {
    expect(
      classifyPaymentRedirect(`${FRONT}/en/find/offerings/checkout/payment-status?status=failed&message=Insufficient%20funds`, "BK-1")
    ).toEqual({ status: "failed", bookingRef: "BK-1", message: "Insufficient funds" });
  });

  it("unknown status is treated as failed (never a false success)", () => {
    expect(classifyPaymentRedirect(`${FRONT}/ar/find/offerings/checkout/payment-status?status=weird`, "BK-1")?.status).toBe("failed");
  });

  it("backend error redirect to /<lang>/not-found → failed, not the website 404", () => {
    expect(classifyPaymentRedirect(`${FRONT}/en/not-found`, "BK-1")).toEqual({ status: "failed", bookingRef: "BK-1" });
    expect(classifyPaymentRedirect(`${FRONT}/not-found`, "BK-1")?.status).toBe("failed");
  });

  it("ignores Whish's own pages and junk", () => {
    expect(classifyPaymentRedirect("https://whish.money/pay/collect/abc", "BK-1")).toBeNull();
    expect(classifyPaymentRedirect("https://whish.money/help/not-found-faq", "BK-1")).toBeNull();
    expect(classifyPaymentRedirect("not a url", "BK-1")).toBeNull();
  });
});
