/**
 * useSelection.test.ts — the canonical favorite + compare toggle hook.
 *
 * Dependencies (all REAL except the axios transports, which we bypass by spying
 * on the api objects directly):
 *   - useAuthStore (Zustand) — drives the auth gate via useAuthGate's selector.
 *   - useFavoritesStore / useCompareStore (Zustand) — optimistic state.
 *   - useSignInSheetStore (Zustand) — opened when logged out.
 *   - useToastStore (Zustand) — showToast writes here; we assert on its message.
 *   - favoritesApi / comparesApi — spied per-test (resolve/reject).
 *
 * Traced behaviour:
 *   - requireAuth: logged out → opens SignInSheet, action NOT run.
 *   - toggleFavorite: optimistic add/remove, rollback + toast on api error.
 *   - toggleCompare add: store enforces max-5; over-limit → limit toast + return
 *     (no api call); success → "<count>/5 selected" toast; error → rollback + toast.
 *   - toggleCompare remove: optimistic remove, rollback + toast on error.
 *   - seedSelection: no-op when logged out / no userId; otherwise fetches ids per
 *     type and seeds the stores; favorite vs compare type filtering.
 */

import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useSelection } from "@/hooks/useSelection";
import { useAuthStore } from "@/stores/authStore";
import { useFavoritesStore } from "@/stores/favoritesStore";
import { useCompareStore } from "@/stores/compareStore";
import { useSignInSheetStore } from "@/auth/signInSheetStore";
import { useToastStore } from "@/stores/toastStore";
import { favoritesApi } from "@/api/favoritesApi";
import { comparesApi } from "@/api/comparesApi";

// ─── Store reset helpers ────────────────────────────────────────────────────

function loginAs(userID = "user-123") {
  useAuthStore.setState({
    isLoggedIn: true,
    isBootstrapping: false,
    accessToken: "tok",
    user: { sub: `auth0|${userID}`, userID },
  });
}

function logout() {
  useAuthStore.setState({
    isLoggedIn: false,
    isBootstrapping: false,
    accessToken: null,
    user: null,
  });
}

beforeEach(() => {
  jest.restoreAllMocks();
  // Reset all Zustand stores used by the hook.
  logout();
  useFavoritesStore.getState().setFavorites("Program", []);
  useFavoritesStore.getState().setFavorites("Institution", []);
  useFavoritesStore.getState().setFavorites("Offering", []);
  useFavoritesStore.getState().setFavorites("Specialist", []);
  useCompareStore.getState().setCompared("Program", []);
  useCompareStore.getState().setCompared("Institution", []);
  useSignInSheetStore.setState({ isOpen: false });
  useToastStore.setState({ message: null, seq: 0 });
});

// ─── isFavorite / isCompared ──────────────────────────────────────────────────

describe("isFavorite / isCompared", () => {
  it("reflect the underlying store state", () => {
    useFavoritesStore.getState().addFavorite("Institution", "i1");
    useCompareStore.getState().addCompare("Program", "p1");
    const { result } = renderHook(() => useSelection());
    expect(result.current.isFavorite("Institution", "i1")).toBe(true);
    expect(result.current.isFavorite("Institution", "absent")).toBe(false);
    expect(result.current.isCompared("Program", "p1")).toBe(true);
    expect(result.current.isCompared("Program", "absent")).toBe(false);
  });
});

// ─── Auth gate ────────────────────────────────────────────────────────────────

describe("auth gate", () => {
  it("toggleFavorite when logged out opens the SignInSheet and does not call the api", () => {
    logout();
    const spy = jest.spyOn(favoritesApi, "toggleFavorite");
    const { result } = renderHook(() => useSelection());

    act(() => result.current.toggleFavorite("Institution", "i1"));

    expect(useSignInSheetStore.getState().isOpen).toBe(true);
    expect(spy).not.toHaveBeenCalled();
    // optimistic state NOT applied either
    expect(useFavoritesStore.getState().isFavorite("Institution", "i1")).toBe(false);
  });

  it("toggleCompare when logged out opens the SignInSheet and does not call the api", () => {
    logout();
    const spy = jest.spyOn(comparesApi, "toggleCompare");
    const { result } = renderHook(() => useSelection());

    act(() => result.current.toggleCompare("Program", "p1"));

    expect(useSignInSheetStore.getState().isOpen).toBe(true);
    expect(spy).not.toHaveBeenCalled();
  });
});

// ─── toggleFavorite ───────────────────────────────────────────────────────────

describe("toggleFavorite (logged in)", () => {
  it("optimistically adds the favorite and calls the api with (id, type)", async () => {
    loginAs();
    const spy = jest
      .spyOn(favoritesApi, "toggleFavorite")
      .mockResolvedValue({ type: "success", action: "added" });
    const { result } = renderHook(() => useSelection());

    act(() => result.current.toggleFavorite("Institution", "i1"));

    // optimistic add is synchronous
    expect(useFavoritesStore.getState().isFavorite("Institution", "i1")).toBe(true);
    await waitFor(() => expect(spy).toHaveBeenCalledWith("i1", "Institution"));
  });

  it("optimistically removes an already-favorited item", async () => {
    loginAs();
    useFavoritesStore.getState().addFavorite("Institution", "i1");
    jest.spyOn(favoritesApi, "toggleFavorite").mockResolvedValue({ type: "success" });
    const { result } = renderHook(() => useSelection());

    act(() => result.current.toggleFavorite("Institution", "i1"));

    expect(useFavoritesStore.getState().isFavorite("Institution", "i1")).toBe(false);
  });

  it("rolls back the optimistic add and shows a toast when the api rejects", async () => {
    loginAs();
    jest
      .spyOn(favoritesApi, "toggleFavorite")
      .mockRejectedValue(new Error("server error"));
    const { result } = renderHook(() => useSelection());

    act(() => result.current.toggleFavorite("Institution", "i1"));

    // rolled back to NOT favorited
    await waitFor(() =>
      expect(useFavoritesStore.getState().isFavorite("Institution", "i1")).toBe(false)
    );
    // t() returns the key string
    expect(useToastStore.getState().message).toBe("failedUpdateFavorite");
  });

  it("rolls back the optimistic remove when the api rejects (re-adds the item)", async () => {
    loginAs();
    useFavoritesStore.getState().addFavorite("Program", "p1");
    jest
      .spyOn(favoritesApi, "toggleFavorite")
      .mockRejectedValue(new Error("server error"));
    const { result } = renderHook(() => useSelection());

    act(() => result.current.toggleFavorite("Program", "p1"));

    await waitFor(() =>
      expect(useFavoritesStore.getState().isFavorite("Program", "p1")).toBe(true)
    );
    expect(useToastStore.getState().message).toBe("failedUpdateFavorite");
  });
});

// ─── toggleCompare (add) ──────────────────────────────────────────────────────

describe("toggleCompare add (logged in)", () => {
  it("adds to the store, calls the api, and shows the '<count>/5 selected' toast", async () => {
    loginAs();
    const spy = jest
      .spyOn(comparesApi, "toggleCompare")
      .mockResolvedValue({ type: "success", compareCount: 3 });
    const { result } = renderHook(() => useSelection());

    act(() => result.current.toggleCompare("Program", "p1"));

    expect(useCompareStore.getState().isCompared("Program", "p1")).toBe(true);
    await waitFor(() => expect(spy).toHaveBeenCalledWith("p1", "Program"));
    // `${compareCount}/5 ${t("selected")}` → "3/5 selected"
    await waitFor(() => expect(useToastStore.getState().message).toBe("3/5 selected"));
  });

  it("falls back to the store count when the api omits compareCount", async () => {
    loginAs();
    jest
      .spyOn(comparesApi, "toggleCompare")
      .mockResolvedValue({ type: "success" }); // no compareCount
    const { result } = renderHook(() => useSelection());

    act(() => result.current.toggleCompare("Institution", "i1"));

    // store count after the optimistic add is 1
    await waitFor(() => expect(useToastStore.getState().message).toBe("1/5 selected"));
  });

  it("when the store is at the max of 5, shows the Program limit toast and does NOT call the api", () => {
    loginAs();
    ["a", "b", "c", "d", "e"].forEach((id) =>
      useCompareStore.getState().addCompare("Program", id)
    );
    const spy = jest.spyOn(comparesApi, "toggleCompare");
    const { result } = renderHook(() => useSelection());

    act(() => result.current.toggleCompare("Program", "p6"));

    expect(useToastStore.getState().message).toBe("compareProgramsLimit");
    expect(spy).not.toHaveBeenCalled();
    expect(useCompareStore.getState().isCompared("Program", "p6")).toBe(false);
  });

  it("uses the Institution limit toast when the Institution slot is full", () => {
    loginAs();
    ["a", "b", "c", "d", "e"].forEach((id) =>
      useCompareStore.getState().addCompare("Institution", id)
    );
    const { result } = renderHook(() => useSelection());

    act(() => result.current.toggleCompare("Institution", "i6"));

    expect(useToastStore.getState().message).toBe("compareInstitutionsLimit");
  });

  it("rolls back the optimistic add and shows a toast when the add-api rejects", async () => {
    loginAs();
    jest
      .spyOn(comparesApi, "toggleCompare")
      .mockRejectedValue(new Error("server error"));
    const { result } = renderHook(() => useSelection());

    act(() => result.current.toggleCompare("Program", "p1"));

    await waitFor(() =>
      expect(useCompareStore.getState().isCompared("Program", "p1")).toBe(false)
    );
    expect(useToastStore.getState().message).toBe("failedUpdateComparison");
  });
});

// ─── toggleCompare (remove) ───────────────────────────────────────────────────

describe("toggleCompare remove (logged in)", () => {
  it("optimistically removes a compared item and calls the api", async () => {
    loginAs();
    useCompareStore.getState().addCompare("Program", "p1");
    const spy = jest
      .spyOn(comparesApi, "toggleCompare")
      .mockResolvedValue({ type: "success" });
    const { result } = renderHook(() => useSelection());

    act(() => result.current.toggleCompare("Program", "p1"));

    expect(useCompareStore.getState().isCompared("Program", "p1")).toBe(false);
    await waitFor(() => expect(spy).toHaveBeenCalledWith("p1", "Program"));
  });

  it("rolls back the removal (re-adds) and shows a toast when the remove-api rejects", async () => {
    loginAs();
    useCompareStore.getState().addCompare("Program", "p1");
    jest
      .spyOn(comparesApi, "toggleCompare")
      .mockRejectedValue(new Error("server error"));
    const { result } = renderHook(() => useSelection());

    act(() => result.current.toggleCompare("Program", "p1"));

    await waitFor(() =>
      expect(useCompareStore.getState().isCompared("Program", "p1")).toBe(true)
    );
    expect(useToastStore.getState().message).toBe("failedUpdateComparison");
  });
});

// ─── seedSelection ────────────────────────────────────────────────────────────

describe("seedSelection", () => {
  it("is a no-op when logged out (no api calls)", async () => {
    logout();
    const favSpy = jest.spyOn(favoritesApi, "getFavoriteIds");
    const cmpSpy = jest.spyOn(comparesApi, "getCompareIds");
    const { result } = renderHook(() => useSelection());

    await act(async () => {
      await result.current.seedSelection(["Institution", "Program"]);
    });

    expect(favSpy).not.toHaveBeenCalled();
    expect(cmpSpy).not.toHaveBeenCalled();
  });

  it("is a no-op when logged in but userId is empty", async () => {
    useAuthStore.setState({
      isLoggedIn: true,
      isBootstrapping: false,
      accessToken: "tok",
      user: { sub: "", userID: "" },
    });
    const favSpy = jest.spyOn(favoritesApi, "getFavoriteIds");
    const { result } = renderHook(() => useSelection());

    await act(async () => {
      await result.current.seedSelection(["Institution"]);
    });

    expect(favSpy).not.toHaveBeenCalled();
  });

  it("seeds favorites and compares from the server for the requested types", async () => {
    loginAs("user-123");
    const favSpy = jest
      .spyOn(favoritesApi, "getFavoriteIds")
      .mockImplementation(async (_userId, type) =>
        type === "Institution" ? ["i1", "i2"] : ["p9"]
      );
    const cmpSpy = jest
      .spyOn(comparesApi, "getCompareIds")
      .mockImplementation(async (type) => (type === "Program" ? ["p1"] : ["i7"]));

    const { result } = renderHook(() => useSelection());

    await act(async () => {
      await result.current.seedSelection(["Institution", "Program"]);
    });

    // favorites seeded for both favorite-capable types
    expect(favSpy).toHaveBeenCalledWith("user-123", "Institution");
    expect(favSpy).toHaveBeenCalledWith("user-123", "Program");
    expect(useFavoritesStore.getState().isFavorite("Institution", "i1")).toBe(true);
    expect(useFavoritesStore.getState().isFavorite("Institution", "i2")).toBe(true);
    expect(useFavoritesStore.getState().isFavorite("Program", "p9")).toBe(true);

    // compares seeded for both compare-capable types
    expect(cmpSpy).toHaveBeenCalledWith("Program");
    expect(cmpSpy).toHaveBeenCalledWith("Institution");
    expect(useCompareStore.getState().isCompared("Program", "p1")).toBe(true);
    expect(useCompareStore.getState().isCompared("Institution", "i7")).toBe(true);
  });

  it("only seeds favorites for favorite-only types (Offering/Specialist) and skips compares for them", async () => {
    loginAs("user-123");
    const favSpy = jest
      .spyOn(favoritesApi, "getFavoriteIds")
      .mockResolvedValue(["x1"]);
    const cmpSpy = jest.spyOn(comparesApi, "getCompareIds").mockResolvedValue([]);

    const { result } = renderHook(() => useSelection());

    await act(async () => {
      await result.current.seedSelection(["Offering", "Specialist"]);
    });

    // Offering + Specialist are favorite types but NOT compare types
    expect(favSpy).toHaveBeenCalledWith("user-123", "Offering");
    expect(favSpy).toHaveBeenCalledWith("user-123", "Specialist");
    expect(cmpSpy).not.toHaveBeenCalled();
  });

  it("ignores a failing favorites fetch silently (no throw, stores unchanged)", async () => {
    loginAs("user-123");
    jest
      .spyOn(favoritesApi, "getFavoriteIds")
      .mockRejectedValue(new Error("network"));
    jest.spyOn(comparesApi, "getCompareIds").mockResolvedValue([]);

    const { result } = renderHook(() => useSelection());

    await expect(
      act(async () => {
        await result.current.seedSelection(["Institution"]);
      })
    ).resolves.toBeUndefined();

    expect(useFavoritesStore.getState().isFavorite("Institution", "anything")).toBe(false);
  });
});
