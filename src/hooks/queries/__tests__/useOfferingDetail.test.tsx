/**
 * useOfferingDetail — RQ-01/RQ-02: cached offering detail; errors end in notFound
 * (the old loader had no catch and stayed on the skeleton forever).
 */

import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeTestQueryClient } from "@/test-utils/renderWithProviders";
import { useOfferingDetail } from "@/hooks/queries/useOfferingDetail";
import { offeringDetailApi } from "@/api/offeringDetailApi";
import { nodeOfferingApi } from "@/api/nodeOfferingApi";
import { reviewsApi } from "@/api/reviewsApi";

jest.mock("@/api/offeringDetailApi", () => ({ offeringDetailApi: { getBySlug: jest.fn() } }));
jest.mock("@/api/nodeOfferingApi", () => ({ nodeOfferingApi: { getBySlug: jest.fn() } }));
jest.mock("@/api/reviewsApi", () => ({ reviewsApi: { getAllAverageRating: jest.fn() } }));

const strapiGet = offeringDetailApi.getBySlug as jest.Mock;
const nodeGet = nodeOfferingApi.getBySlug as jest.Mock;
const getRating = reviewsApi.getAllAverageRating as jest.Mock;

function setup() {
  const client = makeTestQueryClient();
  client.setDefaultOptions({ queries: { retry: false, staleTime: 60_000, gcTime: 60_000 } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  strapiGet.mockResolvedValue({ id: 4, documentId: "d", title: "Cyber" });
  nodeGet.mockResolvedValue({ _id: "n1", specialists: [{ _id: "s1" }] });
  getRating.mockResolvedValue({ averageGeneralRating: 5, totalReviews: 1 });
});

describe("useOfferingDetail", () => {
  it("loads Strapi (with locale), Node and averages", async () => {
    const wrapper = setup();
    const { result } = renderHook(() => useOfferingDetail("cyber", "ar", "u1"), { wrapper });
    await waitFor(() => expect(result.current.averages?.totalReviews).toBe(1));
    expect(strapiGet).toHaveBeenCalledWith("cyber", "ar");
    expect(result.current.specialists).toEqual([{ _id: "s1" }]);
    expect(getRating).toHaveBeenCalledWith("Offering", "4");
  });

  it("revisit reads the cache", async () => {
    const wrapper = setup();
    const a = renderHook(() => useOfferingDetail("cyber", "en", "u1"), { wrapper });
    await waitFor(() => expect(a.result.current.loading).toBe(false));
    a.unmount();
    const b = renderHook(() => useOfferingDetail("cyber", "en", "u1"), { wrapper });
    expect(b.result.current.loading).toBe(false);
    expect(strapiGet).toHaveBeenCalledTimes(1);
    expect(nodeGet).toHaveBeenCalledTimes(1);
  });

  it("a failing request ends in notFound, not an endless loading state", async () => {
    nodeGet.mockRejectedValueOnce(new Error("network"));
    const wrapper = setup();
    const { result } = renderHook(() => useOfferingDetail("cyber", "en", undefined), { wrapper });
    await waitFor(() => expect(result.current.notFound).toBe(true));
    expect(result.current.loading).toBe(false);
  });
});
