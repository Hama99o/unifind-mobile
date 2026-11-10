/**
 * QA 2026-11-10: neither API client had a timeout, so a request the server
 * never answers left a screen on its skeleton forever (About Me › Overview for
 * a new account). With a timeout it fails into the normal error + Retry state.
 */
jest.unmock("@/api/nodeApi");
jest.unmock("@/api/http");
import { nodeApi, REQUEST_TIMEOUT_MS } from "@/api/nodeApi";
import { http } from "@/api/http";

describe("API client timeouts", () => {
  it("Node API requests time out", () => {
    expect(REQUEST_TIMEOUT_MS).toBeGreaterThanOrEqual(10_000);
    expect(REQUEST_TIMEOUT_MS).toBeLessThanOrEqual(30_000);
    expect(nodeApi.defaults.timeout).toBe(REQUEST_TIMEOUT_MS);
  });

  it("Strapi catalog requests time out", () => {
    expect(http.defaults.timeout).toBe(REQUEST_TIMEOUT_MS);
  });
});
