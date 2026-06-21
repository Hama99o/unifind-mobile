/**
 * toastStore.test.ts — unit tests for the lightweight global toast store.
 *
 * The store is intentionally minimal: it holds a `message` and a `seq` counter
 * that increments on every show() (so the host re-animates even for identical
 * text). There is NO auto-dismiss timer in the store itself — dismissal is
 * driven by the host component calling hide(). These tests assert the store's
 * actual behaviour: show() sets message + bumps seq; hide() clears message but
 * leaves seq untouched.
 *
 * Also covers the module-level `showToast(message)` helper which proxies to
 * useToastStore.getState().show(message).
 *
 * Pure Zustand store — no RN modules, no hooks needed.
 */

import { useToastStore, showToast } from "@/stores/toastStore";

// Reset to the store's initial shape before each test.
beforeEach(() => {
  useToastStore.setState({ message: null, seq: 0 }, false);
});

// ─── initial state ─────────────────────────────────────────────────────────────

describe("initial state", () => {
  it("starts with no message and seq 0", () => {
    const { message, seq } = useToastStore.getState();
    expect(message).toBeNull();
    expect(seq).toBe(0);
  });
});

// ─── show ───────────────────────────────────────────────────────────────────────

describe("show", () => {
  it("sets the message", () => {
    useToastStore.getState().show("Hello");
    expect(useToastStore.getState().message).toBe("Hello");
  });

  it("increments seq on each call", () => {
    const { show } = useToastStore.getState();
    show("a");
    expect(useToastStore.getState().seq).toBe(1);
    show("b");
    expect(useToastStore.getState().seq).toBe(2);
  });

  it("bumps seq even when the message text is identical", () => {
    const { show } = useToastStore.getState();
    show("same");
    show("same");
    expect(useToastStore.getState().seq).toBe(2);
    expect(useToastStore.getState().message).toBe("same");
  });

  it("replaces a previous message with the latest one", () => {
    const { show } = useToastStore.getState();
    show("first");
    show("second");
    expect(useToastStore.getState().message).toBe("second");
  });
});

// ─── hide ───────────────────────────────────────────────────────────────────────

describe("hide", () => {
  it("clears the message back to null", () => {
    const { show, hide } = useToastStore.getState();
    show("bye");
    hide();
    expect(useToastStore.getState().message).toBeNull();
  });

  it("does NOT reset the seq counter (only message is cleared)", () => {
    const { show, hide } = useToastStore.getState();
    show("x");
    show("y");
    hide();
    // hide() sets { message: null } only — seq is preserved.
    expect(useToastStore.getState().seq).toBe(2);
  });

  it("is a safe no-op when already hidden", () => {
    const { hide } = useToastStore.getState();
    expect(() => hide()).not.toThrow();
    expect(useToastStore.getState().message).toBeNull();
  });
});

// ─── showToast helper ────────────────────────────────────────────────────────────

describe("showToast helper", () => {
  it("proxies to the store's show() — sets message and bumps seq", () => {
    showToast("from-helper");
    expect(useToastStore.getState().message).toBe("from-helper");
    expect(useToastStore.getState().seq).toBe(1);
  });

  it("can be called multiple times to update the message", () => {
    showToast("one");
    showToast("two");
    expect(useToastStore.getState().message).toBe("two");
    expect(useToastStore.getState().seq).toBe(2);
  });
});
