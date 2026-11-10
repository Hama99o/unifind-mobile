/**
 * useProgramDetail — RQ-01/RQ-02: program detail served from React Query, so a
 * second mount (revisit) reads the cache instead of showing the skeleton again.
 */

import type { ReactNode } from "react";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeTestQueryClient } from "@/test-utils/renderWithProviders";
import { useProgramDetail } from "@/hooks/queries/useProgramDetail";
import { programDetailApi } from "@/api/programDetailApi";
import { reviewsApi } from "@/api/reviewsApi";

jest.mock("@/api/programDetailApi", () => ({
  programDetailApi: { getBySlug: jest.fn(), getRelated: jest.fn() },
}));
jest.mock("@/api/reviewsApi", () => ({
  reviewsApi: { getAllAverageRating: jest.fn() },
}));

const getBySlug = programDetailApi.getBySlug as jest.Mock;
const getRelated = programDetailApi.getRelated as jest.Mock;
const getRating = reviewsApi.getAllAverageRating as jest.Mock;

const program = {
  id: 1,
  slug: "law",
  institution: { documentId: "inst-1" },
  specialisations: [{ studyField: { id: 7 } }],
};

beforeEach(() => {
  jest.clearAllMocks();
  getBySlug.mockResolvedValue(program);
  getRating.mockResolvedValue({ averageGeneralRating: 4.2, totalReviews: 9 });
  getRelated.mockImplementation(async (_ids: number[], _l: string, page: number) => ({
    items: [{ id: 100 + page, slug: `p${page}` }],
    page,
    pageCount: 2,
    total: 2,
  }));
});

function wrapperFor(client = makeTestQueryClient()) {
  return {
    client,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  };
}

describe("useProgramDetail", () => {
  it("loads program, institution rating and the first related page", async () => {
    const { wrapper } = wrapperFor();
    const { result } = renderHook(() => useProgramDetail("law", "en"), { wrapper });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.related).toHaveLength(1));
    expect(result.current.program).toEqual(program);
    expect(result.current.rating).toBe(4.2);
    expect(result.current.nbReviews).toBe(9);
    expect(getRelated).toHaveBeenCalledWith([7], "en", 1, 5, "law");
  });

  it("loadMoreRelated appends the next page", async () => {
    const { wrapper } = wrapperFor();
    const { result } = renderHook(() => useProgramDetail("law", "en"), { wrapper });
    await waitFor(() => expect(result.current.related).toHaveLength(1));
    act(() => result.current.loadMoreRelated());
    await waitFor(() => expect(result.current.related).toHaveLength(2));
  });

  it("revisit: a second mount reads the cache, no skeleton and no refetch while fresh", async () => {
    const { wrapper, client } = wrapperFor();
    client.setDefaultOptions({ queries: { ...client.getDefaultOptions().queries, staleTime: 60_000, gcTime: 60_000 } });
    const first = renderHook(() => useProgramDetail("law", "en"), { wrapper });
    await waitFor(() => expect(first.result.current.related).toHaveLength(1));
    first.unmount();

    const second = renderHook(() => useProgramDetail("law", "en"), { wrapper });
    expect(second.result.current.loading).toBe(false);
    expect(second.result.current.program).toEqual(program);
    expect(getBySlug).toHaveBeenCalledTimes(1);
  });

  it("flags notFound when the program does not exist", async () => {
    getBySlug.mockResolvedValueOnce(null);
    const { wrapper } = wrapperFor();
    const { result } = renderHook(() => useProgramDetail("nope", "en"), { wrapper });
    await waitFor(() => expect(result.current.notFound).toBe(true));
    expect(result.current.loading).toBe(false);
  });
});
