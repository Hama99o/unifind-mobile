/**
 * useSignInSheet.test.ts — tests for the SignInSheet hook + imperative helpers.
 *
 * Source: src/auth/useSignInSheet.ts
 *
 * useSignInSheet() simply returns the whole signInSheetStore (open/close/isOpen).
 * openSignInSheet() / closeSignInSheet() are imperative wrappers around
 * useSignInSheetStore.getState().open()/.close() for use outside React.
 *
 * Hook tested via renderHook; imperative helpers tested directly against the store.
 */

import { renderHook, act } from "@testing-library/react-native";
import {
  useSignInSheet,
  openSignInSheet,
  closeSignInSheet,
} from "@/auth/useSignInSheet";
import { useSignInSheetStore } from "@/auth/signInSheetStore";

const initialState = useSignInSheetStore.getState();

beforeEach(() => {
  useSignInSheetStore.setState(initialState, true);
});

describe("useSignInSheet (hook)", () => {
  it("exposes isOpen, open and close", () => {
    const { result } = renderHook(() => useSignInSheet());
    expect(result.current.isOpen).toBe(false);
    expect(typeof result.current.open).toBe("function");
    expect(typeof result.current.close).toBe("function");
  });

  it("open() flips isOpen to true and re-renders the hook", () => {
    const { result } = renderHook(() => useSignInSheet());
    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);
  });

  it("close() flips isOpen back to false", () => {
    const { result } = renderHook(() => useSignInSheet());
    act(() => {
      result.current.open();
    });
    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("reflects external store mutations (shared global state)", () => {
    const { result } = renderHook(() => useSignInSheet());
    act(() => {
      useSignInSheetStore.getState().open();
    });
    expect(result.current.isOpen).toBe(true);
  });
});

describe("openSignInSheet / closeSignInSheet (imperative)", () => {
  it("openSignInSheet() opens the store without React", () => {
    openSignInSheet();
    expect(useSignInSheetStore.getState().isOpen).toBe(true);
  });

  it("closeSignInSheet() closes the store without React", () => {
    openSignInSheet();
    closeSignInSheet();
    expect(useSignInSheetStore.getState().isOpen).toBe(false);
  });

  it("imperative open is observed by a mounted hook", () => {
    const { result } = renderHook(() => useSignInSheet());
    act(() => {
      openSignInSheet();
    });
    expect(result.current.isOpen).toBe(true);
  });
});
