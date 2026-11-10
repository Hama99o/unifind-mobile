/**
 * useProfile — one cached /userinfo shared by header + tabs; invalidation after save.
 */

import type { ReactNode } from "react";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeTestQueryClient } from "@/test-utils/renderWithProviders";
import { useInvalidateUserInfo, useUserInfo } from "@/hooks/queries/useProfile";
import { profileApi } from "@/api/profileApi";
import { useAuthStore } from "@/stores/authStore";

jest.mock("@/api/profileApi", () => ({ profileApi: { getUserInfo: jest.fn(), getCountries: jest.fn() } }));
const getUserInfo = profileApi.getUserInfo as jest.Mock;

it("dedupes /userinfo across consumers and refetches after invalidation", async () => {
  useAuthStore.setState({ user: { userID: "u1" } as never });
  getUserInfo.mockResolvedValueOnce({ firstName: "Ali" }).mockResolvedValueOnce({ firstName: "Ali B." });
  const client = makeTestQueryClient();
  client.setDefaultOptions({ queries: { retry: false, staleTime: 60_000, gcTime: 60_000 } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(
    () => ({ header: useUserInfo(), tab: useUserInfo(), invalidate: useInvalidateUserInfo() }),
    { wrapper }
  );
  await waitFor(() => expect(result.current.tab.data?.firstName).toBe("Ali"));
  expect(getUserInfo).toHaveBeenCalledTimes(1);

  await act(() => result.current.invalidate());
  await waitFor(() => expect(result.current.header.data?.firstName).toBe("Ali B."));
});
