/**
 * useAsyncResource — React Query backed (RQ-01). Same { data, loading, error,
 * reload } contract as before, plus: cached per user + key, so a remount
 * (revisiting a profile tab) does not show loading again.
 */

import type { ReactNode } from "react";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { makeTestQueryClient } from "@/test-utils/renderWithProviders";
import { useAsyncResource } from "@/hooks/useAsyncResource";
import { useAuthStore } from "@/stores/authStore";

let client: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

beforeEach(() => {
  client = makeTestQueryClient();
  useAuthStore.setState({ user: { userID: "u1" } as never });
});

describe("useAsyncResource", () => {
  it("starts in the loading state with null data and null error", () => {
    const { result } = renderHook(() => useAsyncResource(["k"], () => new Promise<string>(() => {})), { wrapper });
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("resolves: sets data, clears loading, leaves error null", async () => {
    const { result } = renderHook(() => useAsyncResource(["k"], () => Promise.resolve({ value: 42 })), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ value: 42 });
    expect(result.current.error).toBeNull();
  });

  it("rejection with an Error: surfaces err.message and clears loading", async () => {
    const { result } = renderHook(() => useAsyncResource(["k"], () => Promise.reject(new Error("boom"))), { wrapper });
    await waitFor(() => expect(result.current.error).toBe("boom"));
    expect(result.current.loading).toBe(false);
  });

  it("rejection with a non-Error: falls back to the default message", async () => {
    const { result } = renderHook(() => useAsyncResource(["k"], () => Promise.reject("plain string")), { wrapper });
    await waitFor(() => expect(result.current.error).toBe("Failed to load. Please try again."));
  });

  it("reload() re-runs the loader and refreshes data", async () => {
    const loader = jest.fn().mockResolvedValueOnce("a").mockResolvedValueOnce("b");
    const { result } = renderHook(() => useAsyncResource(["k"], loader), { wrapper });
    await waitFor(() => expect(result.current.data).toBe("a"));
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.data).toBe("b"));
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("reload() clears a previous error when the retry succeeds", async () => {
    const loader = jest.fn().mockRejectedValueOnce(new Error("x")).mockResolvedValueOnce("ok");
    const { result } = renderHook(() => useAsyncResource(["k"], loader), { wrapper });
    await waitFor(() => expect(result.current.error).toBe("x"));
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.data).toBe("ok"));
    expect(result.current.error).toBeNull();
  });

  it("re-runs the loader when the key changes", async () => {
    const loader = jest.fn(async () => "v");
    const { rerender } = renderHook(({ lang }: { lang: string }) => useAsyncResource(["k", lang], loader), {
      wrapper,
      initialProps: { lang: "en" },
    });
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));
    rerender({ lang: "ar" });
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));
  });

  it("revisit: a remount with the same key shows cached data without loading", async () => {
    client.setDefaultOptions({ queries: { retry: false, staleTime: 60_000, gcTime: 60_000 } });
    const loader = jest.fn(async () => ["fav"]);
    const a = renderHook(() => useAsyncResource(["favorites"], loader), { wrapper });
    await waitFor(() => expect(a.result.current.data).toEqual(["fav"]));
    a.unmount();
    const b = renderHook(() => useAsyncResource(["favorites"], loader), { wrapper });
    expect(b.result.current.loading).toBe(false);
    expect(b.result.current.data).toEqual(["fav"]);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("scopes the cache per user", async () => {
    client.setDefaultOptions({ queries: { retry: false, staleTime: 60_000, gcTime: 60_000 } });
    const loader = jest.fn(async () => useAuthStore.getState().user?.userID);
    const a = renderHook(() => useAsyncResource(["bookings"], loader), { wrapper });
    await waitFor(() => expect(a.result.current.data).toBe("u1"));
    a.unmount();
    useAuthStore.setState({ user: { userID: "u2" } as never });
    const b = renderHook(() => useAsyncResource(["bookings"], loader), { wrapper });
    await waitFor(() => expect(b.result.current.data).toBe("u2"));
  });
});
