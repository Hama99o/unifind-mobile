/**
 * Classify a URL the Whish WebView is about to load (pure, unit-tested).
 *
 * The backend's Whish callbacks always redirect to the WEB front-end
 * (UF_FRONT_URL, hardcoded /en/ locale — see unifind/backend WebhookController):
 *   …/<lang>/find/offerings/checkout/payment-status?status=success&bookingRef=…
 *   …/<lang>/find/offerings/checkout/payment-status?status=failed&message=…
 *   …/<lang>/not-found                                  (callback errors)
 * The app intercepts these and shows its own status screen in the app language.
 * Before (QA 2026-11-10 PAY-02) only payment-status was caught, so an error left
 * the user on the website's 404 page inside the WebView.
 */

export const PAYMENT_STATUS_PATH = "/find/offerings/checkout/payment-status";
const NOT_FOUND_RE = /^\/(?:[a-z]{2}\/)?not-found\/?$/i;

export interface PaymentRedirect {
  status: "success" | "failed";
  bookingRef: string;
  message?: string;
}

function parse(url: string): { path: string; params: Record<string, string> } | null {
  try {
    const u = new URL(url);
    const params: Record<string, string> = {};
    u.searchParams.forEach((v, k) => {
      params[k] = v;
    });
    return { path: u.pathname, params };
  } catch {
    return null;
  }
}

export function classifyPaymentRedirect(url: string, fallbackBookingRef: string): PaymentRedirect | null {
  if (!url) return null;
  const parsed = parse(url);
  if (!parsed) return null;
  const { path, params } = parsed;

  if (path.includes(PAYMENT_STATUS_PATH)) {
    return {
      status: params.status === "success" ? "success" : "failed",
      bookingRef: params.bookingRef || fallbackBookingRef,
      message: params.message || undefined,
    };
  }
  if (NOT_FOUND_RE.test(path)) {
    return { status: "failed", bookingRef: fallbackBookingRef };
  }
  return null;
}
