/**
 * Every API request gives up after this long. Without it a request the server
 * never answers left screens on their skeleton forever (QA 2026-11-10); with
 * it the query fails into the normal error + Retry state.
 */
export const REQUEST_TIMEOUT_MS = 20_000;
