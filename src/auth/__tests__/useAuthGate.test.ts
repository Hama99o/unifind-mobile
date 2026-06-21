/**
 * useAuthGate.test.ts — tests for the protected-action auth gate.
 *
 * Source: src/auth/useAuthGate.ts
 *
 * requireAuth(action):
 *   - logged IN  → runs action() immediately; SignInSheet stays closed.
 *   - logged OUT → opens the SignInSheet; action is NOT run / NOT queued
 *     (mirrors web: user must re-trigger after login).
 *
 * Uses the REAL authStore (Zustand) toggled via setState, and the REAL
 * signInSheetStore to observe whether the sheet was opened.
 */

import { renderHook, act } from "@testing-library/react-native";
import { useAuthGate } from "@/auth/useAuthGate";
import { useAuthStore } from "@/stores/authStore";
import { useSignInSheetStore } from "@/auth/signInSheetStore";

const sheetInitial = useSignInSheetStore.getState();

beforeEach(() => {
  // Reset the sign-in sheet to closed.
  useSignInSheetStore.setState(sheetInitial, true);
  // Reset the relevant auth flag to a known logged-out baseline.
  // (Merge, not replace, so we keep the store's action functions intact.)
  useAuthStore.setState({
    isLoggedIn: false,
    isBootstrapping: false,
    user: null,
    accessToken: null,
  });
});

describe("useAuthGate — exposes state", () => {
  it("returns requireAuth and isLoggedIn", () => {
    const { result } = renderHook(() => useAuthGate());
    expect(typeof result.current.requireAuth).toBe("function");
    expect(result.current.isLoggedIn).toBe(false);
  });

  it("reflects the authStore isLoggedIn value", () => {
    useAuthStore.setState({ isLoggedIn: true });
    const { result } = renderHook(() => useAuthGate());
    expect(result.current.isLoggedIn).toBe(true);
  });
});

describe("useAuthGate — logged in", () => {
  it("runs the action immediately", () => {
    useAuthStore.setState({ isLoggedIn: true });
    const action = jest.fn();
    const { result } = renderHook(() => useAuthGate());
    act(() => {
      result.current.requireAuth(action);
    });
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("does NOT open the SignInSheet when logged in", () => {
    useAuthStore.setState({ isLoggedIn: true });
    const action = jest.fn();
    const { result } = renderHook(() => useAuthGate());
    act(() => {
      result.current.requireAuth(action);
    });
    expect(useSignInSheetStore.getState().isOpen).toBe(false);
  });

  it("supports an async action (still invoked, fire-and-forget)", () => {
    useAuthStore.setState({ isLoggedIn: true });
    const action = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAuthGate());
    act(() => {
      result.current.requireAuth(action);
    });
    expect(action).toHaveBeenCalledTimes(1);
  });
});

describe("useAuthGate — logged out", () => {
  it("opens the SignInSheet", () => {
    const action = jest.fn();
    const { result } = renderHook(() => useAuthGate());
    act(() => {
      result.current.requireAuth(action);
    });
    expect(useSignInSheetStore.getState().isOpen).toBe(true);
  });

  it("does NOT run the action (not queued, not resumed)", () => {
    const action = jest.fn();
    const { result } = renderHook(() => useAuthGate());
    act(() => {
      result.current.requireAuth(action);
    });
    expect(action).not.toHaveBeenCalled();
  });

  it("does not run the action even after a later login (no deferred queue)", () => {
    const action = jest.fn();
    const { result } = renderHook(() => useAuthGate());
    act(() => {
      result.current.requireAuth(action);
    });
    // Simulate the user logging in afterwards.
    act(() => {
      useAuthStore.setState({ isLoggedIn: true });
    });
    // The previously-gated action must still NOT have fired automatically.
    expect(action).not.toHaveBeenCalled();
  });
});

describe("useAuthGate — transition", () => {
  it("once logged in, a fresh requireAuth runs the action (sheet not reopened)", () => {
    const action = jest.fn();
    const { result } = renderHook(() => useAuthGate());

    // First attempt logged out → sheet opens, action skipped.
    act(() => {
      result.current.requireAuth(action);
    });
    expect(useSignInSheetStore.getState().isOpen).toBe(true);
    expect(action).not.toHaveBeenCalled();

    // User logs in and dismisses the sheet, then re-triggers.
    act(() => {
      useAuthStore.setState({ isLoggedIn: true });
      useSignInSheetStore.getState().close();
    });
    act(() => {
      result.current.requireAuth(action);
    });
    expect(action).toHaveBeenCalledTimes(1);
    expect(useSignInSheetStore.getState().isOpen).toBe(false);
  });
});
