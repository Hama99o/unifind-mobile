/**
 * Payments switch — ONE flag for the whole booking → Whish payment step.
 *
 * EXPO_PUBLIC_PAYMENTS_ENABLED=true  → Book a Session creates the booking and
 *                                      Checkout shows Pay Now (Whish WebView).
 * anything else / unset (DEFAULT)    → the flow stops cleanly before payment:
 *                                      a notice replaces the Book / Pay buttons,
 *                                      no pending booking is created.
 *
 * Off until the Whish merchant account is bought. Switch-to-live steps:
 * docs/QA_REPORT_2026-11-10.md §3.5 and FlowApp card "Payment: activate live".
 * Expo inlines EXPO_PUBLIC_* at build time: changing it needs a rebuild.
 */
export const PAYMENTS_ENABLED = process.env.EXPO_PUBLIC_PAYMENTS_ENABLED === "true";
