import type { ReactNode } from "react";
import { renderHook, act } from "@testing-library/react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeTestQueryClient } from "@/test-utils/renderWithProviders";
import { useClearUserCacheOnLogout } from "@/hooks/queries/useClearUserCacheOnLogout";
import { useAuthStore } from "@/stores/authStore";

describe("useClearUserCacheOnLogout", () => {
  it("removes per-user queries on logout and keeps catalog queries", () => {
    const client = makeTestQueryClient();
    client.setQueryData(["user", "u1", "bookings"], [1]);
    client.setQueryData(["program", "law", "en"], { id: 1 });
    useAuthStore.setState({ isLoggedIn: true });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    renderHook(() => useClearUserCacheOnLogout(), { wrapper });

    act(() => useAuthStore.setState({ isLoggedIn: false }));

    expect(client.getQueryData(["user", "u1", "bookings"])).toBeUndefined();
    expect(client.getQueryData(["program", "law", "en"])).toEqual({ id: 1 });
  });
});
