/**
 * useInstitutionDetail — RQ-01/RQ-02: cached institution detail + averages refresh.
 */

import type { ReactNode } from "react";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeTestQueryClient } from "@/test-utils/renderWithProviders";
import { useInstitutionDetail } from "@/hooks/queries/useInstitutionDetail";
import { institutionDetailApi } from "@/api/institutionDetailApi";
import { reviewsApi } from "@/api/reviewsApi";

jest.mock("@/api/institutionDetailApi", () => ({
  institutionDetailApi: {
    getInstitutionBySlug: jest.fn(),
    getAcademicUnitsInfo: jest.fn(),
    getInstitutionProgramCount: jest.fn(),
  },
}));
jest.mock("@/api/reviewsApi", () => ({ reviewsApi: { getAllAverageRating: jest.fn() } }));

const api = institutionDetailApi as unknown as Record<string, jest.Mock>;
const getRating = reviewsApi.getAllAverageRating as jest.Mock;
const academic = { Bachelors: [{ id: 1 }], Masters: [], PhD: [], Others: [] };

function setup() {
  const client = makeTestQueryClient();
  client.setDefaultOptions({ queries: { retry: false, staleTime: 60_000, gcTime: 60_000 } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { wrapper };
}

beforeEach(() => {
  jest.clearAllMocks();
  api.getInstitutionBySlug.mockResolvedValue({ id: 27, documentId: "27", name: "LU" });
  api.getAcademicUnitsInfo.mockResolvedValue(academic);
  api.getInstitutionProgramCount.mockResolvedValue(522);
  getRating.mockResolvedValue({ averageGeneralRating: 4, totalReviews: 14 });
});

describe("useInstitutionDetail", () => {
  it("loads institution, academic units, program count and averages", async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useInstitutionDetail("lu", "ar"), { wrapper });
    await waitFor(() => expect(result.current.averages?.totalReviews).toBe(14));
    expect(result.current.institution?.name).toBe("LU");
    expect(result.current.academicData).toBe(academic);
    expect(result.current.nbPrograms).toBe(522);
    expect(api.getInstitutionBySlug).toHaveBeenCalledWith("lu", "ar");
  });

  it("revisit reads the cache (no second fetch, no loading)", async () => {
    const { wrapper } = setup();
    const a = renderHook(() => useInstitutionDetail("lu", "en"), { wrapper });
    await waitFor(() => expect(a.result.current.institution).not.toBeNull());
    a.unmount();
    const b = renderHook(() => useInstitutionDetail("lu", "en"), { wrapper });
    expect(b.result.current.loading).toBe(false);
    expect(api.getInstitutionBySlug).toHaveBeenCalledTimes(1);
  });

  it("refreshAverages refetches the rating after a review", async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useInstitutionDetail("lu", "en"), { wrapper });
    await waitFor(() => expect(result.current.averages?.totalReviews).toBe(14));
    getRating.mockResolvedValueOnce({ averageGeneralRating: 4.1, totalReviews: 15 });
    await act(() => result.current.refreshAverages());
    await waitFor(() => expect(result.current.averages?.totalReviews).toBe(15));
  });

  it("notFound when the slug does not exist", async () => {
    api.getInstitutionBySlug.mockResolvedValueOnce(null);
    const { wrapper } = setup();
    const { result } = renderHook(() => useInstitutionDetail("nope", "en"), { wrapper });
    await waitFor(() => expect(result.current.notFound).toBe(true));
  });
});
