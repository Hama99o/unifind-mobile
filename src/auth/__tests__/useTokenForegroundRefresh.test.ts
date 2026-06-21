/**
 * useTokenForegroundRefresh.test.ts — tests the AppState foreground token refresh.
 *
 * Source: src/auth/useTokenForegroundRefresh.ts
 *
 * Behaviour:
 *   - On mount, subscribes to AppState "change".
 *   - On a change event, refreshes the token ONLY when ALL hold:
 *       previous state was "background" OR "inactive",
 *       next state is "active",
 *       useAuthStore.getState().isLoggedIn is true.
 *     → calls authService.ensureValidToken() (fire-and-forget, .catch swallowed).
 *   - On unmount, removes the subscription.
 *
 * Strategy:
 *   - jest.spyOn(AppState, "addEventListener") to capture the listener + return a
 *     subscription object with a remove() spy.
 *   - jest.spyOn(authService, "ensureValidToken") so no real network/refresh runs.
 *   - The hook seeds appState.current from AppState.currentState, then UPDATES it
 *     on every event. We therefore drive a "background" event first so the next
 *     "active" event reliably satisfies wasBackground, independent of the initial
 *     currentState under jest-expo.
 */

import { renderHook } from "@testing-library/react-native";
import { AppState, type AppStateStatus } from "react-native";
import { useTokenForegroundRefresh } from "@/auth/useTokenForegroundRefresh";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/authService";

type ChangeListener = (next: AppStateStatus) => void;

let captured: ChangeListener | null = null;
let removeSpy: jest.Mock;
let addSpy: jest.SpyInstance;
let ensureSpy: jest.SpyInstance;

beforeEach(() => {
  captured = null;
  removeSpy = jest.fn();

  addSpy = jest
    .spyOn(AppState, "addEventListener")
    .mockImplementation((type: string, listener: ChangeListener) => {
      if (type === "change") captured = listener;
      // Mirror RN's EventSubscription shape.
      return { remove: removeSpy } as unknown as ReturnType<
        typeof AppState.addEventListener
      >;
    });

  // Real authService module — spy so ensureValidToken does no real work.
  ensureSpy = jest
    .spyOn(authService, "ensureValidToken")
    .mockResolvedValue(true);

  // Default to logged-in unless a test overrides.
  useAuthStore.setState({ isLoggedIn: true });
});

afterEach(() => {
  addSpy.mockRestore();
  ensureSpy.mockRestore();
});

/** Fire a sequence of AppState transitions through the captured listener. */
function fire(...states: AppStateStatus[]) {
  for (const s of states) {
    captured?.(s);
  }
}

describe("useTokenForegroundRefresh — subscription lifecycle", () => {
  it("subscribes to the AppState 'change' event on mount", () => {
    renderHook(() => useTokenForegroundRefresh());
    expect(addSpy).toHaveBeenCalledTimes(1);
    expect(addSpy).toHaveBeenCalledWith("change", expect.any(Function));
    expect(captured).toBeInstanceOf(Function);
  });

  it("removes the subscription on unmount", () => {
    const { unmount } = renderHook(() => useTokenForegroundRefresh());
    expect(removeSpy).not.toHaveBeenCalled();
    unmount();
    expect(removeSpy).toHaveBeenCalledTimes(1);
  });
});

describe("useTokenForegroundRefresh — refresh trigger", () => {
  it("refreshes when returning from background to active while logged in", () => {
    renderHook(() => useTokenForegroundRefresh());
    fire("background", "active");
    expect(ensureSpy).toHaveBeenCalledTimes(1);
  });

  it("refreshes when returning from inactive to active while logged in", () => {
    renderHook(() => useTokenForegroundRefresh());
    fire("inactive", "active");
    expect(ensureSpy).toHaveBeenCalledTimes(1);
  });

  it("does NOT refresh when logged out, even on background → active", () => {
    useAuthStore.setState({ isLoggedIn: false });
    renderHook(() => useTokenForegroundRefresh());
    fire("background", "active");
    expect(ensureSpy).not.toHaveBeenCalled();
  });

  it("does NOT refresh when previous state was active (active → active)", () => {
    renderHook(() => useTokenForegroundRefresh());
    // Drive to active from active: first set current to active, then active again.
    fire("active", "active");
    expect(ensureSpy).not.toHaveBeenCalled();
  });

  it("does NOT refresh when going to background (active → background)", () => {
    renderHook(() => useTokenForegroundRefresh());
    fire("active", "background");
    expect(ensureSpy).not.toHaveBeenCalled();
  });

  it("does NOT refresh when next state is not active (background → inactive)", () => {
    renderHook(() => useTokenForegroundRefresh());
    fire("background", "inactive");
    expect(ensureSpy).not.toHaveBeenCalled();
  });

  it("refreshes each time the app re-foregrounds (background→active twice)", () => {
    renderHook(() => useTokenForegroundRefresh());
    fire("background", "active");
    fire("background", "active");
    expect(ensureSpy).toHaveBeenCalledTimes(2);
  });

  it("evaluates isLoggedIn at event time, not mount time", () => {
    // Mounted while logged out...
    useAuthStore.setState({ isLoggedIn: false });
    renderHook(() => useTokenForegroundRefresh());
    fire("background", "active");
    expect(ensureSpy).not.toHaveBeenCalled();

    // ...then user logs in; a later foreground triggers a refresh.
    useAuthStore.setState({ isLoggedIn: true });
    fire("background", "active");
    expect(ensureSpy).toHaveBeenCalledTimes(1);
  });

  it("swallows a rejected ensureValidToken (fire-and-forget, no unhandled throw)", () => {
    ensureSpy.mockRejectedValueOnce(new Error("refresh failed"));
    renderHook(() => useTokenForegroundRefresh());
    expect(() => fire("background", "active")).not.toThrow();
    expect(ensureSpy).toHaveBeenCalledTimes(1);
  });
});
