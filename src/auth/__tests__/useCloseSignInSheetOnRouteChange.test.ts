/**
 * useCloseSignInSheetOnRouteChange — the global SignInSheet must not survive
 * navigation (QA 2026-11-10 BUG-04: opened on /compare, still covering Home and
 * blocking the tab bar after navigating away).
 */

import { renderHook, act } from "@testing-library/react-native";
import { useSignInSheetStore } from "@/auth/signInSheetStore";
import { useCloseSignInSheetOnRouteChange } from "@/auth/useCloseSignInSheetOnRouteChange";

let mockPathname = "/home";
jest.mock("expo-router", () => ({
  usePathname: () => mockPathname,
}));

const initialState = useSignInSheetStore.getState();

beforeEach(() => {
  mockPathname = "/home";
  useSignInSheetStore.setState(initialState, true);
});

describe("useCloseSignInSheetOnRouteChange", () => {
  it("closes the sheet when the route changes after it was opened", () => {
    const { rerender } = renderHook(() => useCloseSignInSheetOnRouteChange());
    act(() => useSignInSheetStore.getState().open());
    expect(useSignInSheetStore.getState().isOpen).toBe(true);

    mockPathname = "/program-explorer";
    rerender({});
    expect(useSignInSheetStore.getState().isOpen).toBe(false);
  });

  it("keeps a sheet that was opened on the new route in the same render (screen opens it on mount)", () => {
    const { rerender } = renderHook(() => useCloseSignInSheetOnRouteChange());
    // Navigate to /compare and the screen opens the sheet in the same commit.
    mockPathname = "/compare";
    act(() => useSignInSheetStore.getState().open());
    rerender({});
    expect(useSignInSheetStore.getState().isOpen).toBe(true);

    // Leaving /compare closes it.
    mockPathname = "/home";
    rerender({});
    expect(useSignInSheetStore.getState().isOpen).toBe(false);
  });

  it("does nothing while the route stays the same", () => {
    const { rerender } = renderHook(() => useCloseSignInSheetOnRouteChange());
    act(() => useSignInSheetStore.getState().open());
    rerender({});
    rerender({});
    expect(useSignInSheetStore.getState().isOpen).toBe(true);
  });

  it("a sheet reopened on a later route is tracked from that route", () => {
    const { rerender } = renderHook(() => useCloseSignInSheetOnRouteChange());
    act(() => useSignInSheetStore.getState().open());
    mockPathname = "/growth-center";
    rerender({});
    expect(useSignInSheetStore.getState().isOpen).toBe(false);

    act(() => useSignInSheetStore.getState().open());
    rerender({});
    expect(useSignInSheetStore.getState().isOpen).toBe(true);
    mockPathname = "/profile";
    rerender({});
    expect(useSignInSheetStore.getState().isOpen).toBe(false);
  });
});
