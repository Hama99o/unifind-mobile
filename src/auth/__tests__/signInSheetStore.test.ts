/**
 * signInSheetStore.test.ts — unit tests for the global SignInSheet Zustand store.
 *
 * Source: src/auth/signInSheetStore.ts
 *
 * The store is intentionally minimal:
 *   - isOpen: boolean (initial false)
 *   - open():  sets isOpen = true
 *   - close(): sets isOpen = false
 * No pending-action storage exists on the store (the auth gate explicitly does
 * NOT queue the deferred action — see useAuthGate.ts).
 *
 * Pure Zustand store — no RN modules, no hooks needed.
 * State is reset to the initial shape before each test.
 */

import { useSignInSheetStore } from "@/auth/signInSheetStore";

// Capture the pristine initial state so every test starts clean.
const initialState = useSignInSheetStore.getState();

beforeEach(() => {
  // Replace state wholesale (true) so leftover flags from prior tests are wiped.
  useSignInSheetStore.setState(initialState, true);
});

describe("signInSheetStore — initial state", () => {
  it("starts closed (isOpen === false)", () => {
    expect(useSignInSheetStore.getState().isOpen).toBe(false);
  });

  it("exposes open and close actions", () => {
    const state = useSignInSheetStore.getState();
    expect(typeof state.open).toBe("function");
    expect(typeof state.close).toBe("function");
  });

  it("does NOT expose any pending-action storage", () => {
    // The gate does not queue actions; the store has no such field.
    const state = useSignInSheetStore.getState() as Record<string, unknown>;
    expect(state.pendingAction).toBeUndefined();
    expect(state.pending).toBeUndefined();
    expect(Object.keys(state).sort()).toEqual(["close", "isOpen", "open"]);
  });
});

describe("signInSheetStore — open", () => {
  it("sets isOpen to true", () => {
    useSignInSheetStore.getState().open();
    expect(useSignInSheetStore.getState().isOpen).toBe(true);
  });

  it("is idempotent — calling open twice keeps it open", () => {
    useSignInSheetStore.getState().open();
    useSignInSheetStore.getState().open();
    expect(useSignInSheetStore.getState().isOpen).toBe(true);
  });
});

describe("signInSheetStore — close", () => {
  it("sets isOpen to false", () => {
    useSignInSheetStore.getState().open();
    useSignInSheetStore.getState().close();
    expect(useSignInSheetStore.getState().isOpen).toBe(false);
  });

  it("closing an already-closed sheet is a no-op (stays false)", () => {
    useSignInSheetStore.getState().close();
    expect(useSignInSheetStore.getState().isOpen).toBe(false);
  });
});

describe("signInSheetStore — open/close cycle", () => {
  it("toggles correctly across an open → close → open sequence", () => {
    const { open, close } = useSignInSheetStore.getState();
    open();
    expect(useSignInSheetStore.getState().isOpen).toBe(true);
    close();
    expect(useSignInSheetStore.getState().isOpen).toBe(false);
    open();
    expect(useSignInSheetStore.getState().isOpen).toBe(true);
  });

  it("notifies subscribers on each transition", () => {
    const seen: boolean[] = [];
    const unsub = useSignInSheetStore.subscribe((s) => seen.push(s.isOpen));
    useSignInSheetStore.getState().open();
    useSignInSheetStore.getState().close();
    unsub();
    expect(seen).toEqual([true, false]);
  });
});
